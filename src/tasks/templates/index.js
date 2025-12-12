async function loadTemplate(templatePath) {
    const response = await fetch(chrome.runtime.getURL(templatePath));
    return await response.text();
}

export async function getDialogStructure() {
    return await loadTemplate('src/tasks/templates/dialog-structure.html');
}

export async function getTasksTabTemplate() {
    return await loadTemplate('src/tasks/templates/tasks-tab.html');
}

export async function getSettingsTabTemplate() {
    return await loadTemplate('src/tasks/templates/settings-tab.html');
}

export function fillTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : '';
    });
}
