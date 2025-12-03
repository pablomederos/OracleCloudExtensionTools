// DevOps Dialog Module
// Handles all UI creation and management for the DevOps dialog

import { ADO_CONFIG, fetchTaskIds, fetchWorkItemDetails } from './devops-api.js';

// Query selector helper (needs to be accessible)
const querySelectors = {
    devopsDialog: ['.devops-dialog']
};

function query(selectorList) {
    return selectorList.map(it => document.querySelector(it)).find(it => it);
}

function createControlGroup(labelText, type, id) {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.textContent = labelText;
    label.htmlFor = id;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;

    group.appendChild(label);
    group.appendChild(input);
    return group;
}

function renderTable(workItems) {
    const tbody = document.getElementById('tasksBody');
    tbody.innerHTML = '';

    let lastDate = null;
    let useGray = false;

    workItems
        .sort((a, b) => new Date(b.fields['System.ChangedDate']) - new Date(a.fields['System.ChangedDate']))
        .forEach(item => {
            const tr = document.createElement('tr');

            const fields = item.fields;
            const id = fields['System.Id'];
            const title = fields['System.Title'];
            const date = new Date(fields['System.ChangedDate']).toLocaleDateString();
            const status = fields['System.State'];
            const estimate = fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || '-';

            // Date grouping logic
            if (date !== lastDate) {
                useGray = !useGray;
                lastDate = date;
            }

            if (useGray) {
                tr.classList.add('task-row-alt');
            }

            const cells = [id, title, date, status, estimate];
            cells.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });

            const actionTd = document.createElement('td');

            const copyBtn = document.createElement('button');
            copyBtn.textContent = '📋';
            copyBtn.title = 'Copy to Clipboard';
            copyBtn.className = 'action-btn';
            copyBtn.style.marginLeft = '5px';
            copyBtn.onclick = () => {
                const text = `${id}: ${title.replace(':', ' ')}`;
                navigator.clipboard.writeText(text).then(() => {
                    const dialog = query(querySelectors.devopsDialog);
                    if (dialog) dialog.close();
                });
            };
            actionTd.appendChild(copyBtn);

            tr.appendChild(actionTd);

            tbody.appendChild(tr);
        });
}

function updateSearchButtonState(dialog) {
    const searchBtn = dialog.querySelector('#searchBtn');
    const usernameInput = dialog.querySelector('#username');
    const hasToken = !!localStorage.getItem('devops_token');
    const hasUsername = !!usernameInput.value.trim();
    const hasOrg = !!ADO_CONFIG.orgUrl;
    const hasProject = !!ADO_CONFIG.project;
    const hasApi = !!ADO_CONFIG.apiVersion;

    searchBtn.disabled = !(hasToken && hasUsername && hasOrg && hasProject && hasApi);

    if (searchBtn.disabled) {
        const missing = [];
        if (!hasToken) missing.push('Token');
        if (!hasUsername) missing.push('Username');
        if (!hasOrg) missing.push('Org URL');
        if (!hasProject) missing.push('Project');
        if (!hasApi) missing.push('API Version');
        searchBtn.title = `Missing: ${missing.join(', ')}`;
    } else {
        searchBtn.title = '';
    }
}

async function loadInitialData(dialog) {
    const startDateInput = dialog.querySelector('#startDate');
    const endDateInput = dialog.querySelector('#endDate');
    const usernameInput = dialog.querySelector('#username');
    const searchBtn = dialog.querySelector('#searchBtn');

    // Set default dates if not set
    if (!startDateInput.value || !endDateInput.value) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        startDateInput.value = yesterday.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }

    // Load username
    const storedUsername = localStorage.getItem('devops_username');
    if (storedUsername) {
        usernameInput.value = storedUsername;
    }

    updateSearchButtonState(dialog);

    const cachedData = sessionStorage.getItem('devops_tasks_cache');
    if (cachedData) {
        renderTable(JSON.parse(cachedData));
    } else {
        if (!searchBtn.disabled) searchBtn.click();
        else {
            const hasToken = !!localStorage.getItem('devops_token');
            const hasOrg = !!ADO_CONFIG.orgUrl;
            const hasProject = !!ADO_CONFIG.project;
            const hasApi = !!ADO_CONFIG.apiVersion;

            if (!hasToken || !hasOrg || !hasProject || !hasApi) {
                const settingsTabBtn = dialog.querySelector('.tab-btn:nth-child(2)');
                if (settingsTabBtn) settingsTabBtn.click();
            }
        }
    }
}

function createTasksContent(container, dialog) {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const startGroup = createControlGroup('Start Date', 'date', 'startDate');
    controls.appendChild(startGroup);

    const endGroup = createControlGroup('End Date', 'date', 'endDate');
    controls.appendChild(endGroup);

    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'Search';
    searchBtn.id = 'searchBtn';
    searchBtn.className = 'btn-primary';
    searchBtn.style.alignSelf = 'end';
    searchBtn.disabled = true;
    controls.appendChild(searchBtn);

    container.appendChild(controls);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'tasks-table-container';

    const table = document.createElement('table');
    table.className = 'tasks-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Task ID', 'Title', 'Changed Date', 'Status', 'Original Estimate', 'Action'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.id = 'tasksBody';
    table.appendChild(tbody);

    tableContainer.appendChild(table);
    container.appendChild(tableContainer);

    const footer = document.createElement('div');
    footer.className = 'footer-actions';
    container.appendChild(footer);

    const startDateInput = startGroup.querySelector('input');
    const endDateInput = endGroup.querySelector('input');

    searchBtn.onclick = async () => {
        const start = startDateInput.value;
        const end = endDateInput.value;
        const username = localStorage.getItem('devops_username');

        if (!start || !end) {
            alert('Please select both start and end dates');
            return;
        }
        if (!username) {
            alert('Please enter a username');
            return;
        }

        searchBtn.textContent = 'Searching...';
        searchBtn.disabled = true;

        try {
            const ids = await fetchTaskIds(start, end, username);

            if (ids?.length) {
                const details = await fetchWorkItemDetails(ids);
                sessionStorage.setItem('devops_tasks_cache', JSON.stringify(details));
                renderTable(details);
            } else {
                renderTable([]);
                alert('No tasks found for the selected range.');
            }
        } catch (error) {
            console.error(error);
            alert('Error fetching tasks');
        } finally {
            searchBtn.textContent = 'Search';
            searchBtn.disabled = false;
        }
    };
}

function createSettingsContent(container, dialog) {
    container.style.padding = '15px';

    const orgUrlGroup = createControlGroup('Org URL', 'text', 'adoOrgUrl');
    orgUrlGroup.querySelector('input').value = ADO_CONFIG.orgUrl;
    orgUrlGroup.querySelector('input').placeholder = 'e.g. https://dev.azure.com/yourorg';

    const projectGroup = createControlGroup('Project', 'text', 'adoProject');
    projectGroup.querySelector('input').value = ADO_CONFIG.project;
    projectGroup.querySelector('input').placeholder = 'e.g. YourProject';

    const apiVersionGroup = createControlGroup('API Version', 'text', 'adoApiVersion');
    apiVersionGroup.querySelector('input').value = ADO_CONFIG.apiVersion;
    apiVersionGroup.querySelector('input').placeholder = 'e.g. 7.1';

    const usernameGroup = createControlGroup('Username', 'text', 'username');
    const usernameInput = usernameGroup.querySelector('input');
    usernameInput.placeholder = 'e.g. Gabriel Mederos <email>';
    usernameInput.value = localStorage.getItem('devops_username') || '';
    usernameInput.oninput = () => {
        localStorage.setItem('devops_username', usernameInput.value);
        updateSearchButtonState(dialog);
    };

    const tokenGroup = createControlGroup('DevOps Token (PAT)', 'password', 'adoToken');
    const tokenInput = tokenGroup.querySelector('input');
    tokenInput.placeholder = 'Leave empty to keep existing token';

    const saveSettingsBtn = document.createElement('button');
    saveSettingsBtn.textContent = 'Save Settings';
    saveSettingsBtn.className = 'btn-primary';
    saveSettingsBtn.style.marginTop = '20px';
    saveSettingsBtn.onclick = () => {
        const newOrgUrl = orgUrlGroup.querySelector('input').value.trim();
        const newProject = projectGroup.querySelector('input').value.trim();
        const newApiVersion = apiVersionGroup.querySelector('input').value.trim();
        const newToken = tokenInput.value.trim();

        if (newOrgUrl && newProject && newApiVersion) {
            localStorage.setItem('ado_orgUrl', newOrgUrl);
            localStorage.setItem('ado_project', newProject);
            localStorage.setItem('ado_apiVersion', newApiVersion);

            ADO_CONFIG.orgUrl = newOrgUrl;
            ADO_CONFIG.project = newProject;
            ADO_CONFIG.apiVersion = newApiVersion;

            if (newToken) {
                const encoded = btoa(':' + newToken);
                localStorage.setItem('devops_token', encoded);
                tokenInput.value = '';
            }

            alert('Settings saved!');
            updateSearchButtonState(dialog);
        } else {
            alert('Please fill all required fields');
        }
    };

    container.appendChild(orgUrlGroup);
    container.appendChild(projectGroup);
    container.appendChild(apiVersionGroup);
    container.appendChild(usernameGroup);
    container.appendChild(tokenGroup);
    container.appendChild(saveSettingsBtn);
}

export function createDevopsDialog() {
    const dialog = document.createElement('dialog');
    dialog.classList.add('devops-dialog');

    const header = document.createElement('div');
    header.className = 'dialog-header';

    const title = document.createElement('h2');
    title.textContent = 'Azure DevOps Tasks';
    title.style.color = 'white';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => dialog.close();

    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    const tabsNav = document.createElement('div');
    tabsNav.className = 'tabs-nav';
    tabsNav.style.display = 'flex';
    tabsNav.style.borderBottom = '1px solid #ccc';
    tabsNav.style.marginBottom = '15px';

    const tasksTabBtn = document.createElement('button');
    tasksTabBtn.textContent = 'Tasks';
    tasksTabBtn.className = 'tab-btn active';
    tasksTabBtn.style.padding = '10px 20px';
    tasksTabBtn.style.border = 'none';
    tasksTabBtn.style.background = 'none';
    tasksTabBtn.style.cursor = 'pointer';
    tasksTabBtn.style.borderBottom = '2px solid #0078d4';
    tasksTabBtn.style.fontWeight = 'bold';

    const settingsTabBtn = document.createElement('button');
    settingsTabBtn.textContent = 'Settings';
    settingsTabBtn.className = 'tab-btn';
    settingsTabBtn.style.padding = '10px 20px';
    settingsTabBtn.style.border = 'none';
    settingsTabBtn.style.background = 'none';
    settingsTabBtn.style.cursor = 'pointer';

    tabsNav.appendChild(tasksTabBtn);
    tabsNav.appendChild(settingsTabBtn);
    dialog.appendChild(tabsNav);

    const body = document.createElement('div');
    body.className = 'dialog-body';

    const tasksContent = document.createElement('div');
    tasksContent.className = 'tab-content';
    createTasksContent(tasksContent, dialog);
    body.appendChild(tasksContent);

    const settingsContent = document.createElement('div');
    settingsContent.className = 'tab-content';
    settingsContent.style.display = 'none';
    createSettingsContent(settingsContent, dialog);
    body.appendChild(settingsContent);

    dialog.appendChild(body);

    tasksTabBtn.onclick = () => {
        tasksTabBtn.classList.add('active');
        tasksTabBtn.style.borderBottom = '2px solid #0078d4';
        tasksTabBtn.style.fontWeight = 'bold';

        settingsTabBtn.classList.remove('active');
        settingsTabBtn.style.borderBottom = 'none';
        settingsTabBtn.style.fontWeight = 'normal';

        tasksContent.style.display = 'block';
        settingsContent.style.display = 'none';
    };

    settingsTabBtn.onclick = () => {
        settingsTabBtn.classList.add('active');
        settingsTabBtn.style.borderBottom = '2px solid #0078d4';
        settingsTabBtn.style.fontWeight = 'bold';

        tasksTabBtn.classList.remove('active');
        tasksTabBtn.style.borderBottom = 'none';
        tasksTabBtn.style.fontWeight = 'normal';

        settingsContent.style.display = 'block';
        tasksContent.style.display = 'none';
    };

    return dialog;
}

export function showDevOpsDialog() {
    let dialog = query(querySelectors.devopsDialog);
    if (!dialog) {
        dialog = createDevopsDialog();
        document.body.appendChild(dialog);
    }
    dialog.showModal();
    loadInitialData(dialog);
}
