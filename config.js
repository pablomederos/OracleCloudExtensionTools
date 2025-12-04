// Configuration injected by loader
// This file listens for config from the content script
window.ORACLE_TOOLS_CONFIG = {};

window.addEventListener('message', (event) => {
    if (event.data.type === 'ORACLE_TOOLS_CONFIG') {
        window.ORACLE_TOOLS_CONFIG = event.data.config;
    }
});
