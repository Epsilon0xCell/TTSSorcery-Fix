// Shared test harness: installs a stub SillyTavern host around the real
// extension file and hands the test the recorded seams (events, fetch
// calls, toastr messages, DOM handler registry).
//
// The extension is copied into a fake host tree because its imports are
// relative paths out of the extensions folder; the stubs under host/
// stand in for the host modules at exactly those relative positions.
// Set TTS_SRC to point at another copy of index.js (for example a
// baseline checkout) to run the same suite against it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(here);
// Each test process gets its own copy of the fake host tree: the test
// files run in parallel processes and would otherwise race on the
// shared extension path.
const treeRoot = path.join(here, `.host-${process.pid}`);
const treeExt = path.join(treeRoot, 'scripts', 'extensions', 'third-party', 'TTSSorcery', 'index.js');

export function copyExtensionSource() {
    fs.cpSync(path.join(here, 'host'), treeRoot, { recursive: true });
    process.on('exit', () => fs.rmSync(treeRoot, { recursive: true, force: true }));
    const src = process.env.TTS_SRC || path.join(repoRoot, 'index.js');
    fs.copyFileSync(src, treeExt);
    return src;
}

// Minimal jQuery-shaped fake. One element object per selector, with the
// value/checked state and the handlers the extension binds, all kept in
// a registry the tests can read and drive.
export class FakeEl {
    constructor(name) {
        this.name = name;
        this._val = '';
        this._checked = false;
        this._html = '';
        this.handlers = new Map();
        this._children = [];
        this.attrs = {};
    }
    on(event, fn) { this.handlers.set(event, fn); return this; }
    off() { return this; }
    val(v) { if (v === undefined) return this._val; this._val = v; return this; }
    prop(k, v) { if (v === undefined) return k === 'checked' ? this._checked : undefined; if (k === 'checked') this._checked = v; return this; }
    html(h) { if (h === undefined) return this._html; this._html = h; return this; }
    append(child) { this._children.push(child); return this; }
    empty() { this._children = []; return this; }
    children() { return this; }
    not() { return this; }
    remove() { return this; }
    find() { return this; }
    closest() { return this; }
    siblings() { return this; }
    attr(k, v) { if (v === undefined) return this.attrs[k]; this.attrs[k] = v; return this; }
    data(k) { return this.attrs['data-' + k]; }
    show() { return this; }
    hide() { return this; }
    toggle() { return this; }
    slideToggle() { return this; }
    addClass() { return this; }
    removeClass() { return this; }
    click() { return this; }
    text() { return ''; }
    each() { return this; }
}

export function installGlobals() {
    const registry = new Map();
    const elFor = (name) => {
        if (!registry.has(name)) registry.set(name, new FakeEl(name));
        return registry.get(name);
    };

    function $(arg, attrs) {
        if (typeof arg === 'string' && arg.startsWith('<')) {
            const el = new FakeEl(arg);
            if (attrs) { el._val = attrs.value ?? ''; el._text = attrs.text ?? ''; }
            return el;
        }
        if (typeof arg === 'string') return elFor(arg);
        if (arg && typeof arg === 'object') return elFor(arg.__name || 'object');
        return elFor('unknown');
    }
    $.registry = registry;
    $.elFor = elFor;

    const readyCallbacks = [];
    function jQuery(arg) {
        if (typeof arg === 'function') { readyCallbacks.push(arg); return elFor('ready'); }
        return $(arg);
    }

    const toastrCalls = [];
    const toastr = {
        error: (m) => toastrCalls.push(['error', m]),
        warning: (m) => toastrCalls.push(['warning', m]),
        info: (m) => toastrCalls.push(['info', m]),
        success: (m) => toastrCalls.push(['success', m]),
    };

    const audios = [];
    class FakeAudio {
        constructor(src) { this.src = src; this.onended = null; this.onerror = null; audios.push(this); }
        play() { return Promise.resolve(); }
        pause() {}
    }

    const fetchCalls = [];
    let fetchImpl = async () => ({
        ok: true,
        blob: async () => new Blob(['audio']),
        text: async () => '',
    });

    globalThis.$ = $;
    globalThis.jQuery = jQuery;
    globalThis.document = { __name: 'document' };
    globalThis.toastr = toastr;
    globalThis.Audio = FakeAudio;
    globalThis.fetch = async (url, init) => {
        fetchCalls.push({ url, init, body: init?.body ? JSON.parse(init.body) : null });
        return fetchImpl(url, init);
    };
    globalThis.prompt = () => 'Focus';
    globalThis.confirm = () => true;
    globalThis.setInterval = () => 0;
    globalThis.clearInterval = () => {};
    URL.createObjectURL = () => 'blob:fake';
    URL.revokeObjectURL = () => {};

    console.log = () => {};
    console.debug = () => {};

    return {
        $, registry, elFor, readyCallbacks, toastrCalls, audios, fetchCalls,
        setFetchImpl(fn) { fetchImpl = fn; },
        async runReady() { for (const fn of readyCallbacks) await fn(); },
    };
}

export async function importExtension() {
    const ext = await import(pathToFileURL(treeExt).href);
    const hostScript = await import(pathToFileURL(path.join(treeRoot, 'script.js')).href);
    const hostExt = await import(pathToFileURL(path.join(treeRoot, 'scripts', 'extensions.js')).href);
    return { ext, eventSource: hostScript.eventSource, event_types: hostScript.event_types, extension_settings: hostExt.extension_settings, context: hostExt.context };
}

export function baseSettings(overrides = {}) {
    return {
        enabled: true,
        api_key: 'test-key',
        model: 'zonos-v0.1-hybrid',
        language_iso_code: 'en-us',
        speaking_rate: 15,
        vqscore: 0.78,
        speaker_noised: false,
        disable_narrator: false,
        action_handling: 'narrator',
        max_preload: 5,
        segment_gap: 0,
        auto_generation: true,
        force_neutral_narrator: false,
        voices: {
            narrator: {
                name: 'Narrator',
                audioFiles: { default: { file: 'data:audio/mp3;base64,AAA', fileName: 'n.mp3', duration: 1 } },
            },
            v1: {
                name: 'Elara',
                audioFiles: {
                    default: { file: null, fileName: null, duration: null },
                    elara: { file: 'data:audio/mp3;base64,BBB', fileName: 'e.mp3', duration: 1 },
                },
            },
        },
        ...overrides,
    };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Let pending promise chains (fetch .then handlers) settle.
export async function settle(rounds = 6) {
    for (let i = 0; i < rounds; i++) await new Promise((r) => setImmediate(r));
}
