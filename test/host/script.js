// Test stub for the SillyTavern host script.js module.
// Records event handlers so tests can drive the extension by emitting
// the same events the host would.
export const eventHandlers = new Map();

export const eventSource = {
    on(event, fn) {
        if (!eventHandlers.has(event)) eventHandlers.set(event, []);
        eventHandlers.get(event).push(fn);
    },
    emit(event, data) {
        for (const fn of eventHandlers.get(event) || []) fn(data);
    },
};

export const event_types = {
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
    MESSAGE_SWIPED: 'MESSAGE_SWIPED',
    MESSAGE_EDITED: 'MESSAGE_EDITED',
    MESSAGE_DELETED: 'MESSAGE_DELETED',
    CHAT_LOADED: 'CHAT_LOADED',
    chatLoaded: 'chatLoaded',
    CHAT_COMPLETION_PROMPT_READY: 'CHAT_COMPLETION_PROMPT_READY',
    STREAM_TOKEN_RECEIVED: 'STREAM_TOKEN_RECEIVED',
    GENERATION_STARTED: 'GENERATION_STARTED',
    GENERATION_STOPPED: 'GENERATION_STOPPED',
};

export const streamingProcessor = null;

export function saveSettingsDebounced() {}
