// Popup script - Manages feature toggles
; (function () {
    'use strict';

    const FEATURES = {
        azureDevOps: {
            id: 'toggle-azure-devops',
            storageKey: 'feature_azure_devops',
            defaultValue: true
        }
    };

    // Load saved states
    function loadFeatureStates() {
        Object.values(FEATURES).forEach(feature => {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                const savedValue = localStorage.getItem(feature.storageKey);
                const isEnabled = savedValue !== null ? savedValue === 'true' : feature.defaultValue;
                toggle.checked = isEnabled;
            }
        });
    }

    // Save feature state
    function saveFeatureState(feature, enabled) {
        localStorage.setItem(feature.storageKey, enabled.toString());

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
    document.addEventListener('DOMContentLoaded', () => {
        loadFeatureStates();

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
