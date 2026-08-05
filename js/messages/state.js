// ============================================================
//  messages/state.js — Estado compartilhado do módulo de mensagens
// ============================================================
//  Centraliza as variáveis mutáveis lidas/escritas por messages.js
//  e seus submódulos (loader, import-export, trash).

let currentUserId = null;
let dragSrc = null;
let uiInitialized = false;
let isLoadingMessages = false;
let activeCategoryFilter = null;
let lastCheckedHour = new Date().getHours();
let autoTimeInterval = null;

export const allMessages = [];

export const state = {
    get currentUserId() { return currentUserId; },
    set currentUserId(v) { currentUserId = v; },

    get dragSrc() { return dragSrc; },
    set dragSrc(v) { dragSrc = v; },

    get uiInitialized() { return uiInitialized; },
    set uiInitialized(v) { uiInitialized = v; },

    get isLoadingMessages() { return isLoadingMessages; },
    set isLoadingMessages(v) { isLoadingMessages = v; },

    get activeCategoryFilter() { return activeCategoryFilter; },
    set activeCategoryFilter(v) { activeCategoryFilter = v; },

    get lastCheckedHour() { return lastCheckedHour; },
    set lastCheckedHour(v) { lastCheckedHour = v; },

    get autoTimeInterval() { return autoTimeInterval; },
    set autoTimeInterval(v) { autoTimeInterval = v; },
};

export function resetState() {
    uiInitialized = false;
    currentUserId = null;
    activeCategoryFilter = null;
    allMessages.length = 0;
    if (autoTimeInterval) {
        clearInterval(autoTimeInterval);
        autoTimeInterval = null;
    }
}
