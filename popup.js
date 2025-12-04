// Popup script - Manages feature toggles
; (function () {
    'use strict';

    const FEATURES = {
        azureDevOps: {
            id: 'toggle-azure-devops',
            storageKey: 'feature_azure_devops',
            defaultValue: false
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

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        await loadFeatureStates();

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
