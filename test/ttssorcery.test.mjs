// Behavioral tests for TTSSorcery's index.js, driven through a stub
// SillyTavern host (see harness.mjs). Run with: node --test test/
// The suite runs against the repo's own index.js; set TTS_SRC to a
// different copy to run it against that copy instead.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyExtensionSource, installGlobals, importExtension, baseSettings, settle, sleep } from './harness.mjs';

copyExtensionSource();
const host = installGlobals();
const { eventSource, event_types, extension_settings, context } = await importExtension();

const SAMPLE = '§n|narrator.mp3|e8:1§The rain fell. §c:Elara|elara.mp3|e1:0.7§"Hello there." *she smiled* "Stay dry."';

async function resetAll(settings) {
    extension_settings.TTSSorcery = settings;
    eventSource.emit(event_types.MESSAGE_SWIPED, {});
    await settle();
    host.fetchCalls.length = 0;
    host.audios.length = 0;
    host.toastrCalls.length = 0;
}

test('init seeds presets, fills the preset list, and registers the regex script once', async () => {
    extension_settings.TTSSorcery = baseSettings();
    delete extension_settings.TTSSorcery.presets;
    delete extension_settings.TTSSorcery.active_preset;
    extension_settings.regex = [];
    await host.runReady();

    const s = extension_settings.TTSSorcery;
    assert.ok(Array.isArray(s.presets), 'presets seeded as an array');
    assert.equal(s.presets[0].name, 'Default');
    assert.equal(s.active_preset, 'Default');
    // The seeded preset is a copy: editing it must not rewrite the
    // defaults a future fresh load would hand out.
    s.presets[0].speaking_rate = 99;
    assert.equal(s.presets.length, 1);

    const list = host.elFor('#TTSSorcery_preset_list');
    assert.ok(list._children.some((c) => c._val === 'Default'), 'preset select lists Default');

    assert.equal(extension_settings.regex.length, 1);
    assert.equal(extension_settings.regex[0].scriptName, 'TTSSorcery TTS Markers');
    assert.equal(
        extension_settings.regex[0].findRegex,
        '/§([nac])(:([^§|]*))?(\\|([^§|]*))?(\\|([^§]*))?§/g',
        'the registered pattern matches the parser pattern in extractTTSInfo',
    );
});

test('creating a preset from the panel works on a fresh install', async () => {
    const s = extension_settings.TTSSorcery;
    const before = s.presets.length;
    const handler = host.elFor('#TTSSorcery_preset_new').handlers.get('click');
    assert.ok(handler, 'preset new handler is bound');
    await handler();
    assert.equal(s.presets.length, before + 1);
    assert.equal(s.presets[s.presets.length - 1].name, 'Focus');
    assert.equal(s.active_preset, 'Focus');
    const list = host.elFor('#TTSSorcery_preset_list');
    assert.ok(list._children.some((c) => c._val === 'Focus'), 'preset select lists the new preset');
});

test('instruction injection appends once per generation and respects the guard', async () => {
    await resetAll(baseSettings());
    const data = { messages: [{ role: 'system', content: 'SYS' }] };
    eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, data);
    assert.ok(data.messages[0].content.startsWith('SYS'));
    assert.ok(data.messages[0].content.includes('TTS INSTRUCTIONS'));
    assert.ok(data.messages[0].content.includes('Elara (default, elara)'));

    const again = { messages: [{ role: 'system', content: 'SYS' }] };
    eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, again);
    assert.equal(again.messages[0].content, 'SYS', 'second prompt event in one generation injects nothing');

    eventSource.emit(event_types.GENERATION_STARTED, {});
    const next = { messages: [{ role: 'user', content: 'hi' }] };
    eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, next);
    assert.equal(next.messages[0].role, 'system', 'a system message is created when none exists');
    assert.ok(next.messages[0].content.includes('TTS INSTRUCTIONS'));
});

test('instruction injection does nothing while disabled or without a chat', async () => {
    await resetAll(baseSettings({ enabled: false }));
    const data = { messages: [{ role: 'system', content: 'SYS' }] };
    eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, data);
    assert.equal(data.messages[0].content, 'SYS');

    await resetAll(baseSettings());
    context.chatId = null;
    const orphan = { messages: [{ role: 'system', content: 'SYS' }] };
    eventSource.emit(event_types.CHAT_COMPLETION_PROMPT_READY, orphan);
    assert.equal(orphan.messages[0].content, 'SYS');
    context.chatId = 'chat-1';
});

test('stream start soft reset does not throw', async () => {
    await resetAll(baseSettings());
    assert.doesNotThrow(() => eventSource.emit(event_types.STREAM_TOKEN_RECEIVED, { type: 'start' }));
    assert.doesNotThrow(() => eventSource.emit(event_types.STREAM_TOKEN_RECEIVED, { type: 'start' }));
    assert.doesNotThrow(() => eventSource.emit(event_types.STREAM_TOKEN_RECEIVED, { token: 'a §n§ b' }));
});

test('a marked message is parsed, segmented, and sent to Zyphra in order', async () => {
    await resetAll(baseSettings());
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: false, mes: SAMPLE });
    await settle();

    assert.equal(host.fetchCalls.length, 4, 'one live fetch plus three preloads');
    const bodies = host.fetchCalls.map((c) => c.body);
    assert.equal(host.fetchCalls[0].url, 'https://api.zyphra.com/v1/audio/text-to-speech');
    assert.equal(host.fetchCalls[0].init.headers['X-API-Key'], 'test-key');

    assert.equal(bodies[0].text, '... The rain fell. ...');
    assert.deepEqual(bodies[0].emotion, { neutral: 1 });
    assert.equal(bodies[0].speaker_audio, 'AAA', 'narrator sample with the data URL prefix stripped');
    assert.equal(bodies[0].vqscore, 0.78, 'hybrid-only fields ride along for the hybrid model');

    assert.equal(bodies[1].text, '... Hello there. ...');
    assert.deepEqual(bodies[1].emotion, { happiness: 0.7 });
    assert.equal(bodies[1].speaker_audio, 'BBB', 'the character voice sample');

    assert.equal(bodies[2].text, '... she smiled ...');
    assert.equal(bodies[2].emotion, undefined, 'action segments carry no emotion field');
    assert.equal(bodies[2].speaker_audio, 'AAA', 'the action sandwich is narrated');

    assert.equal(bodies[3].text, '... Stay dry. ...');
    assert.deepEqual(bodies[3].emotion, { happiness: 0.7 });

    // Play the queue out: each ended audio advances to the next
    // preloaded segment, and no segment is fetched twice.
    for (let i = 0; i < 4; i++) {
        const audio = host.audios[i];
        assert.ok(audio, `audio ${i} exists`);
        audio.onended && audio.onended();
        await settle();
        await sleep(10);
    }
    assert.equal(host.fetchCalls.length, 4, 'preloaded segments are not refetched');

    // The queue drained cleanly: a new message starts fetching again.
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: false, mes: SAMPLE });
    await settle();
    assert.ok(host.fetchCalls.length > 4, 'a later message starts a fresh queue');
});

test('user messages and marker-free messages start nothing', async () => {
    await resetAll(baseSettings());
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: true, mes: SAMPLE });
    await settle();
    assert.equal(host.fetchCalls.length, 0);
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: false, mes: 'plain text, no markers' });
    await settle();
    assert.equal(host.fetchCalls.length, 0);
});

test('a swipe mid-playback detaches the playing audio', async () => {
    await resetAll(baseSettings());
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: false, mes: SAMPLE });
    await settle();
    assert.ok(host.audios.length > 0);
    const playing = host.audios[0];
    assert.equal(typeof playing.onended, 'function');
    eventSource.emit(event_types.MESSAGE_SWIPED, {});
    await settle();
    assert.equal(playing.onended, null, 'reset clears the ended handler so stale audio cannot advance a new queue');
});

test('a segment whose voice is missing falls back to the narrator sample', async () => {
    await resetAll(baseSettings());
    eventSource.emit(event_types.MESSAGE_RECEIVED, {
        is_user: false,
        mes: '§c:Ghost|ghost.mp3|e6:0.5§Boo.',
    });
    await settle();
    assert.equal(host.fetchCalls.length, 1);
    assert.equal(host.fetchCalls[0].body.speaker_audio, 'AAA');
    assert.deepEqual(host.fetchCalls[0].body.emotion, { anger: 0.5 });
});

test('no API key stops playback with an error instead of fetching', async () => {
    await resetAll(baseSettings({ api_key: '' }));
    eventSource.emit(event_types.MESSAGE_RECEIVED, { is_user: false, mes: SAMPLE });
    await settle();
    assert.equal(host.fetchCalls.length, 0);
    assert.ok(host.toastrCalls.some(([kind, m]) => kind === 'error' && String(m).includes('API key')));
});

test('the shipped file carries no dead code with undefined names', () => {
    const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.js'), 'utf8');
    for (const name of ['audioJobQueue', 'audioQueueProcessorReady', 'playAudioData', 'talkingAnimation', 'shouldPreserveTtsQueue']) {
        assert.ok(!src.includes(name), `${name} is gone`);
    }
});
