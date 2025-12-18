import { SHORTCUTS, getShortcutDisplay } from './src/config/shortcuts.js';

; (function () {
    'use strict';

    const FEATURES = {
        azureDevOps: {
            id: 'toggle-azure-devops',
            storageKey: 'feature_azure_devops',
            defaultValue: false
        },
        experimentalFeatures: {
            id: 'toggle-experimental-features',
            storageKey: 'feature_experimental_features',
            defaultValue: false
        }
    };

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

    async function saveAllFeatures() {
        const updates = {};
        for (const feature of Object.values(FEATURES)) {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                updates[feature.storageKey] = toggle.checked;
            }
        }
        await chrome.storage.local.set(updates);
    }

    function updateApplyButton() {
        if (applyBtn) {
            applyBtn.disabled = !pendingChanges;
            applyBtn.textContent = pendingChanges ? 'Apply Changes' : 'No Changes';
        }
    }

    let pendingChanges = false;
    const applyBtn = document.getElementById('apply-btn');

    document.addEventListener('DOMContentLoaded', async () => {
        await loadFeatureStates();
        populateShortcuts();
        updateApplyButton();

        Object.values(FEATURES).forEach(feature => {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                toggle.addEventListener('change', () => {
                    pendingChanges = true;
                    updateApplyButton();
                });
            }
        });

        applyBtn.addEventListener('click', async () => {
            await saveAllFeatures();
            pendingChanges = false;
            updateApplyButton();

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });

            window.close();
        });

        const mainPage = document.querySelector('body > .header').parentElement;
        const shortcutsPage = document.getElementById('shortcuts-page');
        const viewShortcutsLink = document.getElementById('view-shortcuts-link');
        const backButton = document.getElementById('back-button');

        viewShortcutsLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('body > .header').style.display = 'none';
            document.querySelector('body > .content').style.display = 'none';
            document.querySelector('body > .footer').style.display = 'none';
            shortcutsPage.style.display = 'block';
        });

        backButton.addEventListener('click', () => {
            document.querySelector('body > .header').style.display = 'block';
            document.querySelector('body > .content').style.display = 'block';
            document.querySelector('body > .footer').style.display = 'block';
            shortcutsPage.style.display = 'none';
        });
    });

    function populateShortcuts() {
        const shortcutsList = document.querySelector('#shortcuts-page .shortcuts-list');
        if (!shortcutsList) return;

        shortcutsList.innerHTML = '';

        Object.keys(SHORTCUTS).forEach(key => {
            const shortcut = SHORTCUTS[key];
            const keys = getShortcutDisplay(key);

            const shortcutItem = document.createElement('div');
            shortcutItem.className = 'shortcut-item';

            const shortcutKeys = document.createElement('div');
            shortcutKeys.className = 'shortcut-keys';

            keys.forEach((keyName, index) => {
                const kbd = document.createElement('kbd');
                kbd.textContent = keyName;
                shortcutKeys.appendChild(kbd);

                if (index < keys.length - 1) {
                    shortcutKeys.appendChild(document.createTextNode(' + '));
                }
            });

            const shortcutDescription = document.createElement('div');
            shortcutDescription.className = 'shortcut-description';
            shortcutDescription.textContent = shortcut.label;

            shortcutItem.appendChild(shortcutKeys);
            shortcutItem.appendChild(shortcutDescription);
            shortcutsList.appendChild(shortcutItem);
        });
    }
})();
