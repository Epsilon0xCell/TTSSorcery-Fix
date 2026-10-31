// Second-process suite: the regex script already existing, and the
// preset import path. Kept apart from the main suite because the
// extension module registers its handlers once per process.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyExtensionSource, installGlobals, importExtension, baseSettings, settle } from './harness.mjs';

copyExtensionSource();
const host = installGlobals();
const { eventSource, event_types, extension_settings } = await importExtension();

test('an existing regex script is not duplicated at init', async () => {
    extension_settings.TTSSorcery = baseSettings();
    extension_settings.regex = [{ scriptName: 'TTSSorcery TTS Markers', findRegex: '/x/g' }];
    await host.runReady();
    assert.equal(extension_settings.regex.length, 1);
});

test('importing a preset file adds it and applies it', async () => {
    const el = host.elFor('#TTSSorcery_preset_import_file');
    const imported = {
        name: 'Imported', model: 'zonos-v0.1-transformer', language_iso_code: 'de',
        speaking_rate: 20, vqscore: 0.7, speaker_noised: true,
    };
    el.files = [{ text: async () => JSON.stringify(imported) }];
    const handler = el.handlers.get('change');
    assert.ok(handler, 'import change handler is bound');
    await handler.call(el);
    await settle();

    const s = extension_settings.TTSSorcery;
    assert.ok(s.presets.some((p) => p.name === 'Imported'), 'preset added');
    assert.equal(s.active_preset, 'Imported');
    assert.equal(s.model, 'zonos-v0.1-transformer', 'loadPreset applies the imported values');
    assert.equal(s.language_iso_code, 'de');
    assert.ok(host.toastrCalls.some(([kind]) => kind === 'success'));
});

test('deleting the Default preset is refused', async () => {
    const s = extension_settings.TTSSorcery;
    s.active_preset = 'Default';
    const handler = host.elFor('#TTSSorcery_preset_delete').handlers.get('click');
    assert.ok(handler, 'delete handler is bound');
    await handler();
    assert.ok(s.presets.some((p) => p.name === 'Default'), 'Default survives');
    assert.ok(host.toastrCalls.some(([kind, m]) => kind === 'error' && String(m).includes('default')));
});
