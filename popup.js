// Popup script - Manages feature toggles
; (function () {
    'use strict';

    const FEATURES = {
        azureDevOps: {
            id: 'toggle-azure-devops',
            storageKey: 'feature_azure_devops',
            defaultValue: false // Default to disabled
        }
    };

    // Load saved states
    async function loadFeatureStates() {
        for (const feature of Object.values(FEATURES)) {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                const result = await chrome.storage.local.get(feature.storageKey);
                const isEnabled = result[feature.storageKey] === true || result[feature.storageKey] === 'true';
                toggle.checked = isEnabled;
            }
        }
    }

    // Save feature state and sync to page localStorage
    async function saveFeatureState(feature, enabled) {
        // Save to chrome.storage
        await chrome.storage.local.set({ [feature.storageKey]: enabled });

        // Sync to page's localStorage via content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (key, value) => {
                        localStorage.setItem(key, value.toString());
                    },
                    args: [feature.storageKey, enabled]
                }).catch(() => {
                    // Ignore errors if page isn't loaded
                });
            }
        });
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', async () => {
        await loadFeatureStates();

        // Setup toggle listeners
        Object.values(FEATURES).forEach(feature => {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    saveFeatureState(feature, e.target.checked);
                });
            }
        });
    });
})();
