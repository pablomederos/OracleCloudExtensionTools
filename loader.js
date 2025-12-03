// Loader Script - Injects ES6 modules into the page DOM
// This runs as a traditional content script and injects module scripts into the page
; (function () {
    'use strict';

    // List of module files to inject in order
    const moduleFiles = [
        'styles.js',
        'utils.js',
        'devops-api.js',
        'devops-dialog.js',
        'app.js'
    ];

    // Inject each module file as a script tag
    moduleFiles.forEach(file => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = chrome.runtime.getURL(file);
        (document.head || document.documentElement).appendChild(script);
    });
})();
