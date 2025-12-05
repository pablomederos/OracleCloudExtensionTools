// Popup script - Manages feature toggles
import { SHORTCUTS, getShortcutDisplay } from './src/config/shortcuts.js';

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
        populateShortcuts();

        Object.values(FEATURES).forEach(feature => {
            const toggle = document.getElementById(feature.id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    saveFeatureState(feature, e.target.checked);
                });
            }
        });

        // Navigation between pages
        const mainPage = document.querySelector('body > .header').parentElement;
        const shortcutsPage = document.getElementById('shortcuts-page');
        const viewShortcutsLink = document.getElementById('view-shortcuts-link');
        const backButton = document.getElementById('back-button');

        viewShortcutsLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Hide main page elements
            document.querySelector('body > .header').style.display = 'none';
            document.querySelector('body > .content').style.display = 'none';
            document.querySelector('body > .footer').style.display = 'none';
            // Show shortcuts page
            shortcutsPage.style.display = 'block';
        });

        backButton.addEventListener('click', () => {
            // Show main page elements
            document.querySelector('body > .header').style.display = 'block';
            document.querySelector('body > .content').style.display = 'block';
            document.querySelector('body > .footer').style.display = 'block';
            // Hide shortcuts page
            shortcutsPage.style.display = 'none';
        });
    });

    // Populate shortcuts list dynamically from shared config
    function populateShortcuts() {
        const shortcutsList = document.querySelector('#shortcuts-page .shortcuts-list');
        if (!shortcutsList) return;

        // Clear existing content
        shortcutsList.innerHTML = '';

        // Generate shortcuts from config
        Object.keys(SHORTCUTS).forEach(key => {
            const shortcut = SHORTCUTS[key];
            const keys = getShortcutDisplay(key);

            const shortcutItem = document.createElement('div');
            shortcutItem.className = 'shortcut-item';

            const shortcutKeys = document.createElement('div');
            shortcutKeys.className = 'shortcut-keys';

            // Create kbd elements for each key
            keys.forEach((keyName, index) => {
                const kbd = document.createElement('kbd');
                kbd.textContent = keyName;
                shortcutKeys.appendChild(kbd);

                // Add '+' separator between keys
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
