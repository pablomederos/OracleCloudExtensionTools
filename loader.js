// Loader Script - Injects ES6 modules into the page DOM
// This runs as a traditional content script and injects module scripts into the page
; (async function () {
    'use strict';

    // Load feature flags from chrome.storage
    const settings = await chrome.storage.local.get('feature_azure_devops');
    const featureFlags = {
        azureDevOps: settings.feature_azure_devops === true || settings.feature_azure_devops === 'true'
    };

    // Inject config script that listens for the config
    const configScript = document.createElement('script');
    configScript.src = chrome.runtime.getURL('config.js');
    (document.head || document.documentElement).appendChild(configScript);

    // Wait for config script to load, then send config via custom event
    configScript.onload = () => {
        window.postMessage({
            type: 'ORACLE_TOOLS_CONFIG',
            config: featureFlags
        }, '*');
    };

    // List of module files to inject in order
    const moduleFiles = [
        'src/styles/dialog.js',
        'src/utils/dom.js',
        'src/tasks/azure-devops-api.js',
        'src/tasks/azure-devops-dialog.js',
        'src/app.js'
    ];

    // Inject each module file as a script tag
    moduleFiles.forEach(file => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = chrome.runtime.getURL(file);
        (document.head || document.documentElement).appendChild(script);
    });
})();
