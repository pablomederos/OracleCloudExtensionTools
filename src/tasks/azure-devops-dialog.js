import { ADO_CONFIG, fetchTaskIds, fetchWorkItemDetails } from './azure-devops-api.js';
import { querySelectors } from '../utils/selectors.js';
import {
    STORAGE_KEYS,
    MESSAGES,
    UI_TEXT,
    BUTTON_CLASSES,
    BUTTON_CONFIG,
    FIELD_KEYS
} from '../utils/constants.js';
import {
    getDialogStructure,
    getTasksTabTemplate,
    getSettingsTabTemplate,
    fillTemplate
} from './templates/index.js';
import {
    processTaskInsertion,
    startCompletionCheck
} from '../utils/oracle-grid.js';

let sortState = {
    column: 'date',
    ascending: false
};

export async function createDevopsDialog() {
    const dialog = document.createElement('dialog');
    dialog.classList.add('devops-dialog');

    dialog.innerHTML = await getDialogStructure();

    const closeBtn = querySelectors.queryFrom(dialog, querySelectors.closeBtn);
    const tasksTabBtn = querySelectors.queryFrom(dialog, querySelectors.tasksTab);
    const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTab);
    const tasksContent = querySelectors.queryFrom(dialog, querySelectors.tasksContent);
    const settingsContent = querySelectors.queryFrom(dialog, querySelectors.settingsContent);

    closeBtn.onclick = () => dialog.close();

    await createTasksContent(tasksContent, dialog);
    await createSettingsContent(settingsContent, dialog);

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

export async function showDevOpsDialog() {
    let dialog = querySelectors.query(querySelectors.devopsDialog);
    if (!dialog) {
        dialog = await createDevopsDialog();
        document.body.appendChild(dialog);
    }
    dialog.showModal();
    loadInitialData(dialog);
}

async function createTasksContent(container, dialog) {
    container.innerHTML = await getTasksTabTemplate();

    const startDateInput = querySelectors.queryFrom(container, querySelectors.startDate);
    const endDateInput = querySelectors.queryFrom(container, querySelectors.endDate);
    const searchBtn = querySelectors.queryFrom(container, querySelectors.searchBtn);
    const addAllButton = querySelectors.queryFrom(container, querySelectors.addAllBtn);

    container.querySelectorAll(querySelectors.sortableTableHeader[0]).forEach(th => {
        th.onclick = () => {
            const column = th.dataset.column;
            const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
            if (cachedData) {
                const workItems = JSON.parse(cachedData);
                const ascending = sortState.column === column ? !sortState.ascending : true;
                renderTable(workItems, column, ascending);
            }
        };
    });

    searchBtn.onclick = async () => {
        const start = startDateInput.value;
        const end = endDateInput.value;
        const username = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME);

        if (!start || !end) {
            alert(MESSAGES.SELECT_DATES);
            return;
        }
        if (!username) {
            alert(MESSAGES.ENTER_USERNAME);
            return;
        }

        searchBtn.textContent = UI_TEXT.SEARCHING;
        searchBtn.disabled = true;

        try {
            const ids = await fetchTaskIds(start, end, username);

            if (ids?.length) {
                const details = await fetchWorkItemDetails(ids);
                sessionStorage.setItem(STORAGE_KEYS.SESSION.TASKS_CACHE, JSON.stringify(details));
                renderTable(details);
            } else {
                renderTable([]);
                alert(MESSAGES.NO_TASKS_FOUND);
            }
        } catch (error) {
            console.error(error);
            alert(MESSAGES.ERROR_FETCHING);
        } finally {
            searchBtn.textContent = UI_TEXT.SEARCH;
            searchBtn.disabled = false;
        }
    };

    addAllButton.onclick = () => {
        const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
        if (cachedData) {
            sessionStorage.setItem(STORAGE_KEYS.SESSION.COMPLETE_JSON, cachedData);
            alert(MESSAGES.ALL_TASKS_SAVED);

            if (dialog) dialog.close();

            startCompletionCheck();
        } else {
            alert(MESSAGES.NO_TASKS_TO_ADD);
        }
    };
}

async function createSettingsContent(container, dialog) {
    const template = await getSettingsTabTemplate();
    container.innerHTML = fillTemplate(template, {
        orgUrl: ADO_CONFIG.orgUrl,
        project: ADO_CONFIG.project,
        apiVersion: ADO_CONFIG.apiVersion,
        username: localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME) || ''
    });

    const usernameInput = querySelectors.queryFrom(container, querySelectors.username);
    const tokenInput = querySelectors.queryFrom(container, querySelectors.adoToken);
    const saveSettingsBtn = querySelectors.queryFrom(container, querySelectors.saveSettingsBtn);

    usernameInput.oninput = () => {
        localStorage.setItem(STORAGE_KEYS.LOCAL.USERNAME, usernameInput.value);
        updateSearchButtonState(dialog);
    };

    saveSettingsBtn.onclick = () => {
        const newOrgUrl = querySelectors.queryFrom(container, querySelectors.adoOrgUrl).value.trim();
        const newProject = querySelectors.queryFrom(container, querySelectors.adoProject).value.trim();
        const newApiVersion = querySelectors.queryFrom(container, querySelectors.adoApiVersion).value.trim();
        const newToken = tokenInput.value.trim();

        if (newOrgUrl && newProject && newApiVersion) {
            localStorage.setItem(STORAGE_KEYS.LOCAL.ORG_URL, newOrgUrl);
            localStorage.setItem(STORAGE_KEYS.LOCAL.PROJECT, newProject);
            localStorage.setItem(STORAGE_KEYS.LOCAL.API_VERSION, newApiVersion);

            ADO_CONFIG.orgUrl = newOrgUrl;
            ADO_CONFIG.project = newProject;
            ADO_CONFIG.apiVersion = newApiVersion;

            if (newToken) {
                const encoded = btoa(':' + newToken);
                localStorage.setItem(STORAGE_KEYS.LOCAL.TOKEN, encoded);
                tokenInput.value = '';
            }

            alert(MESSAGES.SETTINGS_SAVED);
            updateSearchButtonState(dialog);
        } else {
            alert(MESSAGES.FILL_REQUIRED);
        }
    };
}

function updateSortIndicators() {
    const headers = document.querySelectorAll(querySelectors.tasksTableHeader[0]);
    const columnMap = ['id', 'title', 'date', 'status', 'estimate', null];

    headers.forEach((th, index) => {
        const column = columnMap[index];
        if (!column) return;

        th.textContent = th.textContent.replace(/ [↑↓]/g, '');

        if (column === sortState.column) {
            th.textContent += sortState.ascending ? ' ↑' : ' ↓';
        }
    });
}

function updateSearchButtonState(dialog) {
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn);
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username);
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.LOCAL.TOKEN);
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
    const startDateInput = querySelectors.queryFrom(dialog, querySelectors.startDate);
    const endDateInput = querySelectors.queryFrom(dialog, querySelectors.endDate);
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username);
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn);

    if (!startDateInput.value || !endDateInput.value) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        startDateInput.value = yesterday.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }

    const storedUsername = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME);
    if (storedUsername) {
        usernameInput.value = storedUsername;
    }

    updateSearchButtonState(dialog);

    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
    if (cachedData) {
        renderTable(JSON.parse(cachedData));
    } else {
        if (!searchBtn.disabled) searchBtn.click();
        else {
            const hasToken = !!localStorage.getItem(STORAGE_KEYS.LOCAL.TOKEN);
            const hasOrg = !!ADO_CONFIG.orgUrl;
            const hasProject = !!ADO_CONFIG.project;
            const hasApi = !!ADO_CONFIG.apiVersion;

            if (!hasToken || !hasOrg || !hasProject || !hasApi) {
                const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTabBtn);
                if (settingsTabBtn) settingsTabBtn.click();
            }
        }
    }
}

function renderTable(workItems, sortColumn = sortState.column, ascending = sortState.ascending) {
    const tbody = document.getElementById(querySelectors.tasksBody[0].replace('#', ''));
    tbody.innerHTML = '';

    sortState.column = sortColumn;
    sortState.ascending = ascending;

    updateSortIndicators();

    let lastDate = null;
    let useGray = false;

    const sortedItems = [...workItems].sort((a, b) => {
        let valA, valB;

        switch (sortColumn) {
            case 'id':
                valA = a.fields[FIELD_KEYS.ID];
                valB = b.fields[FIELD_KEYS.ID];
                break;
            case 'title':
                valA = a.fields[FIELD_KEYS.TITLE].toLowerCase();
                valB = b.fields[FIELD_KEYS.TITLE].toLowerCase();
                break;
            case 'date':
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
                valB = new Date(b.fields[FIELD_KEYS.CHANGED_DATE]);
                break;
            case 'status':
                valA = a.fields[FIELD_KEYS.STATE].toLowerCase();
                valB = b.fields[FIELD_KEYS.STATE].toLowerCase();
                break;
            case 'estimate':
                valA = a.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0;
                valB = b.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0;
                break;
            default:
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
                valB = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });

    sortedItems.forEach(item => {
        const tr = document.createElement('tr');

        const fields = item.fields;
        const id = fields[FIELD_KEYS.ID];
        const title = fields[FIELD_KEYS.TITLE];
        const date = new Date(fields[FIELD_KEYS.CHANGED_DATE]).toLocaleDateString();
        const status = fields[FIELD_KEYS.STATE];
        const estimate = fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || '-';

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

        const btn = document.createElement('button');
        btn.textContent = '⏱️';
        btn.title = 'Add to Time Sheet';
        btn.className = 'action-btn experimental-feature';
        btn.onclick = () => addToTimeSheet(id);
        actionTd.appendChild(btn);

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy to Clipboard';
        copyBtn.className = 'action-btn';
        copyBtn.style.marginLeft = '5px';
        copyBtn.onclick = () => {
            const text = `${id}: ${title.replace(':', ' ')}`;
            navigator.clipboard.writeText(text).then(() => {
                const dialog = querySelectors.query(querySelectors.devopsDialog);
                if (dialog) dialog.close();

                const commentView = querySelectors.query(querySelectors.commentView);
                const textarea = querySelectors.queryFrom(commentView, querySelectors.commentTextarea);

                if (textarea) {
                    textarea.value = text;
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        };
        actionTd.appendChild(copyBtn);

        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });
}

function addToTimeSheet(id) {
    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
    if (!cachedData) return;

    const tasks = JSON.parse(cachedData);
    const task = tasks.find(t => t.fields[FIELD_KEYS.ID] == id);

    if (!task) {
        alert(MESSAGES.TASK_NOT_FOUND);
        return;
    }

    startCompletionCheck();
    sessionStorage.setItem(STORAGE_KEYS.SESSION.ROW_JSON, JSON.stringify(task));

    const dialog = querySelectors.query(querySelectors.devopsDialog);
    if (dialog) dialog.close();
    processTaskInsertion(task);
}

function addDevOpsButton() {
    let toolbarButtonsContainer = querySelectors.query(querySelectors.headerToolbar);

    if (toolbarButtonsContainer) {
        createAndAppendButton(toolbarButtonsContainer);
    } else {
        let interval = setInterval(() => {
            toolbarButtonsContainer = querySelectors.query(querySelectors.headerToolbar);
            if (toolbarButtonsContainer) {
                clearInterval(interval);
                createAndAppendButton(toolbarButtonsContainer);
            }
        }, 200);
    }
}

function createAndAppendButton(container) {
    if (querySelectors.queryFrom(container, querySelectors.devopsBtn)) return;

    const button = document.createElement('button');
    button.textContent = BUTTON_CONFIG.TEXT;
    button.classList.add(...BUTTON_CLASSES);
    button.style.borderRadius = BUTTON_CONFIG.BORDER_RADIUS;
    button.style.fontWeight = BUTTON_CONFIG.FONT_WEIGHT;
    button.onclick = showDevOpsDialog;

    if (container.firstChild) {
        container.insertBefore(button, container.firstChild);
    } else {
        container.appendChild(button);
    }
}

export function initAzureDevOps() {
    addDevOpsButton();
}
import { createCommentCommand, populateCommentTextarea } from '../app.js';
import { querySelectors } from '../utils/selectors.js';
import {
    getDialogStructure,
    getTasksTabTemplate,
    getSettingsTabTemplate,
    fillTemplate
} from './templates/index.js';

const STORAGE_KEYS = {
    SESSION: {
        TASKS_CACHE: 'devops_tasks_cache',
        COMPLETE_JSON: 'devOpsCompleteJSON',
        DATA_INSERTED: 'dataAlreadyInserted',
        ROW_JSON: 'devOpsRowJSON'
    },
    LOCAL: {
        USERNAME: 'devops_username',
        TOKEN: 'devops_token',
        ORG_URL: 'ado_orgUrl',
        PROJECT: 'ado_project',
        API_VERSION: 'ado_apiVersion'
    }
};

const MESSAGES = {
    SELECT_DATES: 'Please select both start and end dates',
    ENTER_USERNAME: 'Please enter a username',
    NO_TASKS_FOUND: 'No tasks found for the selected range.',
    ERROR_FETCHING: 'Error fetching tasks',
    ALL_TASKS_SAVED: 'All tasks saved to sessionStorage (devOpsCompleteJSON)!',
    NO_TASKS_TO_ADD: 'No tasks to add.',
    SETTINGS_SAVED: 'Settings saved!',
    FILL_REQUIRED: 'Please fill all required fields',
    TASK_NOT_FOUND: 'Task not found in cache.',
    CELL_NOT_FOUND: 'No se pudo encontrar la celda para insertar el valor.',
    COMMENT_FAILED: 'No se pudo agregar el comentario. Intente nuevamente.'
};

const UI_TEXT = {
    SEARCHING: 'Searching...',
    SEARCH: 'Search',
    DATA_INSERTED_TRUE: '1',
    DATA_INSERTED_FALSE: '0'
};

const BUTTON_CLASSES = [
    'BaseButtonStyles_styles_base__jvi3ds0',
    'devops-btn',
    'BaseButtonStyles_styles_sizes_sm__jvi3ds2d',
    'BaseButtonStyles_styles_variants_outlined_base__jvi3dso',
    'BaseButtonStyles_styles_styled__jvi3ds1',
    'BaseButtonStyles_styles_styledOutline__jvi3ds2',
    'BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv'
];

const BUTTON_CONFIG = {
    TEXT: 'Add from DevOps',
    BORDER_RADIUS: '5px',
    FONT_WEIGHT: '600'
};

const FIELD_KEYS = {
    ID: 'System.Id',
    TITLE: 'System.Title',
    CHANGED_DATE: 'System.ChangedDate',
    STATE: 'System.State',
    ORIGINAL_ESTIMATE: 'Microsoft.VSTS.Scheduling.OriginalEstimate'
};

let sortState = {
    column: 'date',
    ascending: false
};

export async function createDevopsDialog() {
    const dialog = document.createElement('dialog');
    dialog.classList.add('devops-dialog');

    dialog.innerHTML = await getDialogStructure();

    const closeBtn = querySelectors.queryFrom(dialog, querySelectors.closeBtn);
    const tasksTabBtn = querySelectors.queryFrom(dialog, querySelectors.tasksTab);
    const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTab);
    const tasksContent = querySelectors.queryFrom(dialog, querySelectors.tasksContent);
    const settingsContent = querySelectors.queryFrom(dialog, querySelectors.settingsContent);

    closeBtn.onclick = () => dialog.close();

    await createTasksContent(tasksContent, dialog);
    await createSettingsContent(settingsContent, dialog);

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

export async function showDevOpsDialog() {
    let dialog = querySelectors.query(querySelectors.devopsDialog);
    if (!dialog) {
        dialog = await createDevopsDialog();
        document.body.appendChild(dialog);
    }
    dialog.showModal();
    loadInitialData(dialog);
}

async function createTasksContent(container, dialog) {
    container.innerHTML = await getTasksTabTemplate();

    const startDateInput = querySelectors.queryFrom(container, querySelectors.startDate);
    const endDateInput = querySelectors.queryFrom(container, querySelectors.endDate);
    const searchBtn = querySelectors.queryFrom(container, querySelectors.searchBtn);
    const addAllButton = querySelectors.queryFrom(container, querySelectors.addAllBtn);

    container.querySelectorAll(querySelectors.sortableTableHeader[0]).forEach(th => {
        th.onclick = () => {
            const column = th.dataset.column;
            const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
            if (cachedData) {
                const workItems = JSON.parse(cachedData);
                const ascending = sortState.column === column ? !sortState.ascending : true;
                renderTable(workItems, column, ascending);
            }
        };
    });

    searchBtn.onclick = async () => {
        const start = startDateInput.value;
        const end = endDateInput.value;
        const username = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME);

        if (!start || !end) {
            alert(MESSAGES.SELECT_DATES);
            return;
        }
        if (!username) {
            alert(MESSAGES.ENTER_USERNAME);
            return;
        }

        searchBtn.textContent = UI_TEXT.SEARCHING;
        searchBtn.disabled = true;

        try {
            const ids = await fetchTaskIds(start, end, username);

            if (ids?.length) {
                const details = await fetchWorkItemDetails(ids);
                sessionStorage.setItem(STORAGE_KEYS.SESSION.TASKS_CACHE, JSON.stringify(details));
                renderTable(details);
            } else {
                renderTable([]);
                alert(MESSAGES.NO_TASKS_FOUND);
            }
        } catch (error) {
            console.error(error);
            alert(MESSAGES.ERROR_FETCHING);
        } finally {
            searchBtn.textContent = UI_TEXT.SEARCH;
            searchBtn.disabled = false;
        }
    };

    addAllButton.onclick = () => {
        const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
        if (cachedData) {
            sessionStorage.setItem(STORAGE_KEYS.SESSION.COMPLETE_JSON, cachedData);
            alert(MESSAGES.ALL_TASKS_SAVED);

            if (dialog) dialog.close();

            startCompletionCheck();
        } else {
            alert(MESSAGES.NO_TASKS_TO_ADD);
        }
    };
}

async function createSettingsContent(container, dialog) {
    const template = await getSettingsTabTemplate();
    container.innerHTML = fillTemplate(template, {
        orgUrl: ADO_CONFIG.orgUrl,
        project: ADO_CONFIG.project,
        apiVersion: ADO_CONFIG.apiVersion,
        username: localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME) || ''
    });

    const usernameInput = querySelectors.queryFrom(container, querySelectors.username);
    const tokenInput = querySelectors.queryFrom(container, querySelectors.adoToken);
    const saveSettingsBtn = querySelectors.queryFrom(container, querySelectors.saveSettingsBtn);

    usernameInput.oninput = () => {
        localStorage.setItem(STORAGE_KEYS.LOCAL.USERNAME, usernameInput.value);
        updateSearchButtonState(dialog);
    };

    saveSettingsBtn.onclick = () => {
        const newOrgUrl = querySelectors.queryFrom(container, querySelectors.adoOrgUrl).value.trim();
        const newProject = querySelectors.queryFrom(container, querySelectors.adoProject).value.trim();
        const newApiVersion = querySelectors.queryFrom(container, querySelectors.adoApiVersion).value.trim();
        const newToken = tokenInput.value.trim();

        if (newOrgUrl && newProject && newApiVersion) {
            localStorage.setItem(STORAGE_KEYS.LOCAL.ORG_URL, newOrgUrl);
            localStorage.setItem(STORAGE_KEYS.LOCAL.PROJECT, newProject);
            localStorage.setItem(STORAGE_KEYS.LOCAL.API_VERSION, newApiVersion);

            ADO_CONFIG.orgUrl = newOrgUrl;
            ADO_CONFIG.project = newProject;
            ADO_CONFIG.apiVersion = newApiVersion;

            if (newToken) {
                const encoded = btoa(':' + newToken);
                localStorage.setItem(STORAGE_KEYS.LOCAL.TOKEN, encoded);
                tokenInput.value = '';
            }

            alert(MESSAGES.SETTINGS_SAVED);
            updateSearchButtonState(dialog);
        } else {
            alert(MESSAGES.FILL_REQUIRED);
        }
    };
}

function updateSortIndicators() {
    const headers = document.querySelectorAll(querySelectors.tasksTableHeader[0]);
    const columnMap = ['id', 'title', 'date', 'status', 'estimate', null];

    headers.forEach((th, index) => {
        const column = columnMap[index];
        if (!column) return;

        th.textContent = th.textContent.replace(/ [↑↓]/g, '');

        if (column === sortState.column) {
            th.textContent += sortState.ascending ? ' ↑' : ' ↓';
        }
    });
}

function updateSearchButtonState(dialog) {
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn);
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username);
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.LOCAL.TOKEN);
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
    const startDateInput = querySelectors.queryFrom(dialog, querySelectors.startDate);
    const endDateInput = querySelectors.queryFrom(dialog, querySelectors.endDate);
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username);
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn);

    if (!startDateInput.value || !endDateInput.value) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        startDateInput.value = yesterday.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }

    const storedUsername = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME);
    if (storedUsername) {
        usernameInput.value = storedUsername;
    }

    updateSearchButtonState(dialog);

    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
    if (cachedData) {
        renderTable(JSON.parse(cachedData));
    } else {
        if (!searchBtn.disabled) searchBtn.click();
        else {
            const hasToken = !!localStorage.getItem(STORAGE_KEYS.LOCAL.TOKEN);
            const hasOrg = !!ADO_CONFIG.orgUrl;
            const hasProject = !!ADO_CONFIG.project;
            const hasApi = !!ADO_CONFIG.apiVersion;

            if (!hasToken || !hasOrg || !hasProject || !hasApi) {
                const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTabBtn);
                if (settingsTabBtn) settingsTabBtn.click();
            }
        }
    }
}

function renderTable(workItems, sortColumn = sortState.column, ascending = sortState.ascending) {
    const tbody = document.getElementById(querySelectors.tasksBody[0].replace('#', ''));
    tbody.innerHTML = '';

    sortState.column = sortColumn;
    sortState.ascending = ascending;

    updateSortIndicators();

    let lastDate = null;
    let useGray = false;

    const sortedItems = [...workItems].sort((a, b) => {
        let valA, valB;

        switch (sortColumn) {
            case 'id':
                valA = a.fields[FIELD_KEYS.ID];
                valB = b.fields[FIELD_KEYS.ID];
                break;
            case 'title':
                valA = a.fields[FIELD_KEYS.TITLE].toLowerCase();
                valB = b.fields[FIELD_KEYS.TITLE].toLowerCase();
                break;
            case 'date':
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
                valB = new Date(b.fields[FIELD_KEYS.CHANGED_DATE]);
                break;
            case 'status':
                valA = a.fields[FIELD_KEYS.STATE].toLowerCase();
                valB = b.fields[FIELD_KEYS.STATE].toLowerCase();
                break;
            case 'estimate':
                valA = a.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0;
                valB = b.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0;
                break;
            default:
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
                valB = new Date(a.fields[FIELD_KEYS.CHANGED_DATE]);
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });

    sortedItems.forEach(item => {
        const tr = document.createElement('tr');

        const fields = item.fields;
        const id = fields[FIELD_KEYS.ID];
        const title = fields[FIELD_KEYS.TITLE];
        const date = new Date(fields[FIELD_KEYS.CHANGED_DATE]).toLocaleDateString();
        const status = fields[FIELD_KEYS.STATE];
        const estimate = fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || '-';

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

        const btn = document.createElement('button');
        btn.textContent = '⏱️';
        btn.title = 'Add to Time Sheet';
        btn.className = 'action-btn experimental-feature';
        btn.onclick = () => addToTimeSheet(id);
        actionTd.appendChild(btn);

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy to Clipboard';
        copyBtn.className = 'action-btn';
        copyBtn.style.marginLeft = '5px';
        copyBtn.onclick = () => {
            const text = `${id}: ${title.replace(':', ' ')}`;
            navigator.clipboard.writeText(text).then(() => {
                const dialog = querySelectors.query(querySelectors.devopsDialog);
                if (dialog) dialog.close();

                const commentView = querySelectors.query(querySelectors.commentView);
                const textarea = querySelectors.queryFrom(commentView, querySelectors.commentTextarea);

                if (textarea) {
                    textarea.value = text;
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        };
        actionTd.appendChild(copyBtn);

        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });
}

function findFirstEmptyCellByDate(isoDateString) {
    const dateObj = new Date(isoDateString);

    if (isNaN(dateObj.getTime())) {
        console.error("Fecha inválida proporcionada:", isoDateString);
        return null;
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayName = dayNames[dateObj.getUTCDay()];
    const monthName = monthNames[dateObj.getUTCMonth()];
    const dayNumber = String(dateObj.getUTCDate()).padStart(2, '0');

    const targetHeaderValidString = `${dayName},${monthName} ${dayNumber}`;

    const headerContainer = document.getElementById(querySelectors.timecardDatagridColumnHeader[0].replace('#', ''));
    if (!headerContainer) {
        console.error("No se encontró el contenedor de encabezados 'timecard-datagrid:columnHeader'");
        return null;
    }

    const headerCells = Array.from(headerContainer.querySelectorAll(querySelectors.datagridHeaderCell[0]));

    let targetLeftPos = null;

    const matchingHeader = headerCells.find(cell => {
        return cell.innerText.trim() === targetHeaderValidString;
    });

    if (!matchingHeader) {
        console.warn(`No se encontró ninguna columna con la fecha ${targetHeaderValidString}`);
        return null;
    }

    targetLeftPos = matchingHeader.style.left;

    const dataBody = document.getElementById(querySelectors.timecardDatagridDatabody[0].replace('#', ''));
    if (!dataBody) return null;

    const allCells = Array.from(dataBody.querySelectorAll(querySelectors.datagridCell[0]));

    const columnCells = allCells.filter(cell => cell.style.left === targetLeftPos);

    columnCells.sort((a, b) => {
        const topA = parseFloat(a.style.top || 0);
        const topB = parseFloat(b.style.top || 0);
        return topA - topB;
    });

    for (let cell of columnCells) {
        const textContent = cell.innerText.trim();
        const inputElement = querySelectors.queryFrom(cell, querySelectors.input);
        const inputValue = inputElement ? inputElement.value : "";

        const isEmpty = (textContent === "" && inputValue === "");

        if (isEmpty)
            return cell;
    }

    console.warn("No se encontraron celdas vacías para este día (la columna está llena).");
    return null;
}

function waitForEditorHost(cell, maxAttempts = 12, interval = 100) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            const native = querySelectors.queryFrom(cell, querySelectors.input);
            const ojHost = querySelectors.queryFrom(cell, querySelectors.ojInputComponents);
            const contentEditable = querySelectors.queryFrom(cell, querySelectors.contentEditable);
            const host = native || ojHost || contentEditable || null;
            if (host) return resolve(host);
            attempts++;
            if (attempts >= maxAttempts) return resolve(null);
            setTimeout(check, interval);
        };
        check();
    });
}

async function simulateTypingAndCommit(editorHost, text) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    if (!editorHost) return;

    const nativeInput = (editorHost.tagName === 'INPUT') ? editorHost : (editorHost.querySelector ? querySelectors.queryFrom(editorHost, querySelectors.input) : null);
    const target = nativeInput || editorHost;

    try { if (target && typeof target.focus === 'function') target.focus(); } catch (e) { }

    try {
        if (nativeInput) {
            nativeInput.value = '';
            nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            try { editorHost.value = ''; } catch (e) { }
            try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: '' }, bubbles: true })); } catch (e) { }
        }
    } catch (e) { }

    const canExec = typeof document.execCommand === 'function' && document.queryCommandSupported && document.queryCommandSupported('insertText');

    for (let ch of String(text)) {
        try {
            if (canExec) {
                if (target && typeof target.focus === 'function') target.focus();
                document.execCommand('insertText', false, ch);
            } else if (nativeInput) {
                nativeInput.value += ch;
                nativeInput.dispatchEvent(new InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }));
            } else {
                try { editorHost.value = (editorHost.value || '') + ch; } catch (err) { }
                try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: editorHost.value || '' }, bubbles: true })); } catch (err) { }
            }
        } catch (e) { }
        await sleep(20);
    }

    try {
        if (nativeInput) nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
        else editorHost.dispatchEvent(new CustomEvent('ojValueChanged', { detail: { value: text }, bubbles: true }));
    } catch (e) { }

    try {
        const makeKey = (k, kc) => new KeyboardEvent('keydown', { key: k, code: k, keyCode: kc, which: kc, bubbles: true, cancelable: true });
        (target).dispatchEvent(makeKey('Enter', 13));
        (target).dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    } catch (e) { }

    try { target && target.blur && target.blur(); } catch (e) { }
    try {
        const dataBodyId = querySelectors.timecardDatagridDatabody[0].replace('#', '');
        const dataBody = document.getElementById(dataBodyId) || document.body;
        dataBody.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        dataBody.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        dataBody.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } catch (e) { }

    await sleep(220);

    try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: text }, bubbles: true })); } catch (e) { }
    try { editorHost.dispatchEvent(new CustomEvent('ojValueUpdated', { detail: { value: text }, bubbles: true })); } catch (e) { }

    await sleep(120);
}

function handleCellActivation(emptyCell, value, taskId, taskTitle, taskDate) {
    createCommentCommand(emptyCell);

    setTimeout(async () => {
        const commentAdded = await populateCommentTextarea(taskId, taskTitle);

        if (commentAdded) {
            const commentView = querySelectors.query(querySelectors.commentView);
            const saveBtn = querySelectors.queryFrom(commentView, querySelectors.saveBtn);
            saveBtn?.click();

            await new Promise(r => setTimeout(r, 350));

            const freshEmptyCell = findFirstEmptyCellByDate(taskDate);
            if (!freshEmptyCell) {
                alert(MESSAGES.CELL_NOT_FOUND);
                return;
            }

            freshEmptyCell.focus();
            freshEmptyCell.dispatchEvent(new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 2
            }));

            const editorHost = await waitForEditorHost(freshEmptyCell);
            try {
                await simulateTypingAndCommit(editorHost || freshEmptyCell, value);
            } catch (e) {
                console.error('simulateTypingAndCommit error:', e);
            }

            await new Promise(r => setTimeout(r, 250));
            const dataBodyId = querySelectors.timecardDatagridDatabody[0].replace('#', '');
            const dataBody = document.getElementById(dataBodyId);
            const stringValue = String(value).trim();

            const cells = Array.from((dataBody || document.body).querySelectorAll(querySelectors.datagridCell[0]));
            const inserted = cells.some(c => {
                const txt = c.innerText.trim();
                const inp = querySelectors.queryFrom(c, querySelectors.input);
                const v = inp ? String(inp.value).trim() : '';
                return txt === stringValue || v === stringValue;
            });

            if (inserted) {
                sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_TRUE);
            } else {
                try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) { }
                try { (dataBody || document.body).click(); } catch (e) { }
                await new Promise(r => setTimeout(r, 200));
                const active = document.activeElement || freshEmptyCell;
                try { active && active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true })); } catch (e) { }
                await new Promise(r => setTimeout(r, 200));

                const recheck = Array.from((dataBody || document.body).querySelectorAll(querySelectors.datagridCell[0]));
                const reinserted = recheck.some(c => {
                    const txt = c.innerText.trim();
                    const inp = querySelectors.queryFrom(c, querySelectors.input);
                    const v = inp ? String(inp.value).trim() : '';
                    return txt === stringValue || v === stringValue;
                });
                if (reinserted) sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_TRUE);
                else console.warn('No se verificó la inserción del valor en la celda.');
            }
        } else {
            alert(MESSAGES.COMMENT_FAILED);
        }
    }, 300);
}

function processTaskInsertion(task) {
    const taskDate = task.fields[FIELD_KEYS.CHANGED_DATE];
    const originalEstimate = task.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || '';
    const taskId = task.fields[FIELD_KEYS.ID];
    const taskTitle = task.fields[FIELD_KEYS.TITLE];

    setTimeout(() => {
        const emptyCell = findFirstEmptyCellByDate(taskDate);

        if (emptyCell) {
            handleCellActivation(emptyCell, originalEstimate, taskId, taskTitle, taskDate);
        } else {
            console.warn('No se pudo encontrar una celda vacía para la fecha:', taskDate);
        }
    }, 300);
}

function addToTimeSheet(id) {
    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE);
    if (!cachedData) return;

    const tasks = JSON.parse(cachedData);
    const task = tasks.find(t => t.fields[FIELD_KEYS.ID] == id);

    if (!task) {
        alert(MESSAGES.TASK_NOT_FOUND);
        return;
    }

    startCompletionCheck();
    sessionStorage.setItem(STORAGE_KEYS.SESSION.ROW_JSON, JSON.stringify(task));

    const dialog = querySelectors.query(querySelectors.devopsDialog);
    if (dialog) dialog.close();
    processTaskInsertion(task);
}

function startCompletionCheck() {
    sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_FALSE);

    const interval = setInterval(() => {
        const status = sessionStorage.getItem(STORAGE_KEYS.SESSION.DATA_INSERTED);

        if (status === UI_TEXT.DATA_INSERTED_TRUE) {
            clearInterval(interval);
            showDevOpsDialog();
        }
    }, 1000);
}

function addDevOpsButton() {
    let toolbarButtonsContainer = querySelectors.query(querySelectors.headerToolbar);

    if (toolbarButtonsContainer) {
        createAndAppendButton(toolbarButtonsContainer);
    } else {
        let interval = setInterval(() => {
            toolbarButtonsContainer = querySelectors.query(querySelectors.headerToolbar);
            if (toolbarButtonsContainer) {
                clearInterval(interval);
                createAndAppendButton(toolbarButtonsContainer);
            }
        }, 200);
    }
}

function createAndAppendButton(container) {
    if (querySelectors.queryFrom(container, querySelectors.devopsBtn)) return;

    const button = document.createElement('button');
    button.textContent = BUTTON_CONFIG.TEXT;
    button.classList.add(...BUTTON_CLASSES);
    button.style.borderRadius = BUTTON_CONFIG.BORDER_RADIUS;
    button.style.fontWeight = BUTTON_CONFIG.FONT_WEIGHT;
    button.onclick = showDevOpsDialog;

    if (container.firstChild) {
        container.insertBefore(button, container.firstChild);
    } else {
        container.appendChild(button);
    }
}

export function initAzureDevOps() {
    addDevOpsButton();
}
