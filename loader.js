// Loader Script - Injects ES6 modules into the page DOM
// This runs as a traditional content script and injects module scripts into the page
; (async function () {
    'use strict';

    // Load feature flags from chrome.storage
    const settings = await chrome.storage.local.get('feature_azure_devops');
    const featureFlags = {
        azureDevOps: settings.feature_azure_devops === true || settings.feature_azure_devops === 'true'
    };

    // Inject feature flags as global variable
    const configScript = document.createElement('script');
    configScript.textContent = `window.ORACLE_TOOLS_CONFIG = ${JSON.stringify(featureFlags)}; `;
    (document.head || document.documentElement).appendChild(configScript);

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
