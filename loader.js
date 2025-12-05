// Loader Script - Injects ES6 modules into the page DOM
// This runs as a traditional content script and injects module scripts into the page
; (async function () {
    'use strict';

    const settings = await chrome.storage.local.get(['feature_azure_devops', 'feature_experimental_features']);
    const featureFlags = {
        azureDevOps: settings.feature_azure_devops === true || settings.feature_azure_devops === 'true',
        experimentalFeatures: settings.feature_experimental_features === true || settings.feature_experimental_features === 'true'
    };

    const configScript = document.createElement('script');
    configScript.src = chrome.runtime.getURL('config.js');
    (document.head || document.documentElement).appendChild(configScript);

    configScript.onload = () => {
        window.postMessage({
            type: 'ORACLE_TOOLS_CONFIG',
            config: featureFlags
        }, '*');
    };

    const moduleFiles = [
        'src/styles/dialog.js',
        'src/utils/dom.js',
        'src/tasks/azure-devops-api.js',
        'src/tasks/azure-devops-dialog.js',
        'src/app.js'
    ];

    moduleFiles.forEach(file => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = chrome.runtime.getURL(file);
        (document.head || document.documentElement).appendChild(script);
    });
})();
