async function loadTemplate(templatePath) {
    const baseUrl = window.ORACLE_TOOLS_CONFIG?.extensionBaseUrl || '';
    const response = await fetch(baseUrl + templatePath);
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

export async function getTemplatesDialogTemplate() {
    return await loadTemplate('src/tasks/templates/templates-dialog.html');
}

export function fillTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : '';
    });
}
