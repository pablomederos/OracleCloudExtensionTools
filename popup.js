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

    // Save feature state
    async function saveFeatureState(feature, enabled) {
        await chrome.storage.local.set({ [feature.storageKey]: enabled });

        // Notify content scripts of the change
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'FEATURE_TOGGLE',
                    feature: feature.storageKey,
                    enabled: enabled
                }).catch(() => {
                    // Ignore errors if content script isn't loaded
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
