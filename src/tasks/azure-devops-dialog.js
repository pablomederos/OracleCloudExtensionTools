// DevOps Dialog Module
// Handles all UI creation and management for the DevOps dialog

import { ADO_CONFIG, fetchTaskIds, fetchWorkItemDetails } from './azure-devops-api.js';
import { createCommentCommand } from '../app.js';

// Query selector helper (needs to be accessible)
const querySelectors = {
    devopsDialog: ['.devops-dialog']
};

function query(selectorList) {
    return selectorList.map(it => document.querySelector(it)).find(it => it);
}

// Sort state
let sortState = {
    column: 'date', // default sort by date
    ascending: false // newest first
};

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
    console.log(`Buscando columna para la fecha: "${targetHeaderValidString}"`);

    const headerContainer = document.getElementById('timecard-datagrid:columnHeader');
    if (!headerContainer) {
        console.error("No se encontró el contenedor de encabezados 'timecard-datagrid:columnHeader'");
        return null;
    }

    const headerCells = Array.from(headerContainer.querySelectorAll('.oj-datagrid-header-cell'));

    let targetLeftPos = null;

    const matchingHeader = headerCells.find(cell => {
        return cell.innerText.trim() === targetHeaderValidString;
    });

    if (!matchingHeader) {
        console.warn(`No se encontró ninguna columna con la fecha ${targetHeaderValidString}`);
        return null;
    }

    targetLeftPos = matchingHeader.style.left;
    console.log(`Columna encontrada en posición left: ${targetLeftPos}`);

    const dataBody = document.getElementById('timecard-datagrid:databody');
    if (!dataBody) return null;

    const allCells = Array.from(dataBody.querySelectorAll('.oj-datagrid-cell'));

    const columnCells = allCells.filter(cell => cell.style.left === targetLeftPos);

    columnCells.sort((a, b) => {
        const topA = parseFloat(a.style.top || 0);
        const topB = parseFloat(b.style.top || 0);
        return topA - topB;
    });

    for (let cell of columnCells) {
        const textContent = cell.innerText.trim();
        const inputElement = cell.querySelector('input');
        const inputValue = inputElement ? inputElement.value : "";

        const isEmpty = (textContent === "" && inputValue === "");

        if (isEmpty) {
            console.log("Celda vacía encontrada:", cell);
            return cell;
        }
    }

    console.log("No se encontraron celdas vacías para este día (la columna está llena).");
    return null;
}

function activateEditModeOnCell(cellElement, callback) {
    if (!cellElement) {
        console.error("No se proporcionó una celda válida.");
        return;
    }

    cellElement.focus();

    const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    cellElement.dispatchEvent(clickEvent);

    console.log("Foco y Clic aplicados a la celda. Intentando activar edición...");

    setTimeout(() => {
        const dblClick = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        const success = cellElement.dispatchEvent(dblClick);
        if (success) {
            console.log("Evento doble clic enviado.");

            setTimeout(() => {
                const input = cellElement.querySelector('input, textarea');
                if (input) {
                    input.focus();
                    console.log("Input interno encontrado y enfocado.");
                    if (callback) callback(input);
                } else {
                    console.warn("No se encontró input dentro de la celda.");
                }
            }, 100);
        }
    }, 150);
}


function renderTable(workItems, sortColumn = sortState.column, ascending = sortState.ascending) {
    const tbody = document.getElementById('tasksBody');
    tbody.innerHTML = '';

    // Update sort state
    sortState.column = sortColumn;
    sortState.ascending = ascending;

    // Update header indicators
    updateSortIndicators();

    let lastDate = null;
    let useGray = false;

    // Sort the work items based on the selected column
    const sortedItems = [...workItems].sort((a, b) => {
        let valA, valB;

        switch (sortColumn) {
            case 'id':
                valA = a.fields['System.Id'];
                valB = b.fields['System.Id'];
                break;
            case 'title':
                valA = a.fields['System.Title'].toLowerCase();
                valB = b.fields['System.Title'].toLowerCase();
                break;
            case 'date':
                valA = new Date(a.fields['System.ChangedDate']);
                valB = new Date(b.fields['System.ChangedDate']);
                break;
            case 'status':
                valA = a.fields['System.State'].toLowerCase();
                valB = b.fields['System.State'].toLowerCase();
                break;
            case 'estimate':
                valA = a.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || 0;
                valB = b.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || 0;
                break;
            default:
                valA = new Date(a.fields['System.ChangedDate']);
                valB = new Date(b.fields['System.ChangedDate']);
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });

    sortedItems.forEach(item => {
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

        // Add to Time Sheet button
        const btn = document.createElement('button');
        btn.textContent = '⏱️';
        btn.title = 'Add to Time Sheet';
        btn.className = 'action-btn';
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

function updateSortIndicators() {
    const headers = document.querySelectorAll('.tasks-table th');
    const columnMap = ['id', 'title', 'date', 'status', 'estimate', null]; // null for Action column

    headers.forEach((th, index) => {
        const column = columnMap[index];
        if (!column) return; // Skip Action column

        // Remove existing indicators
        th.textContent = th.textContent.replace(/ [↑↓]/g, '');

        // Add indicator if this is the sorted column
        if (column === sortState.column) {
            th.textContent += sortState.ascending ? ' ↑' : ' ↓';
        }
    });
}

function createTasksContent(container, dialog) {
    container.innerHTML = `
        <div class="controls">
            <div class="control-group">
                <label for="startDate">Start Date</label>
                <input type="date" id="startDate">
            </div>
            <div class="control-group">
                <label for="endDate">End Date</label>
                <input type="date" id="endDate">
            </div>
            <button id="searchBtn" class="btn-primary" style="align-self: end;" disabled>Search</button>
        </div>
        
        <div class="tasks-table-container">
            <table class="tasks-table">
                <thead>
                    <tr>
                        <th data-column="id" style="cursor: pointer; user-select: none;" title="Click to sort">Task ID</th>
                        <th data-column="title" style="cursor: pointer; user-select: none;" title="Click to sort">Title</th>
                        <th data-column="date" style="cursor: pointer; user-select: none;" title="Click to sort">Changed Date</th>
                        <th data-column="status" style="cursor: pointer; user-select: none;" title="Click to sort">Status</th>
                        <th data-column="estimate" style="cursor: pointer; user-select: none;" title="Click to sort">Original Estimate</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="tasksBody"></tbody>
            </table>
        </div>
        
        <div class="footer-actions">
            <button id="addAllBtn" class="btn-secondary">Add all to Time Sheet</button>
        </div>
    `;

    // Get references to elements
    const startDateInput = container.querySelector('#startDate');
    const endDateInput = container.querySelector('#endDate');
    const searchBtn = container.querySelector('#searchBtn');
    const addAllButton = container.querySelector('#addAllBtn');

    // Add click handlers to sortable headers
    container.querySelectorAll('th[data-column]').forEach(th => {
        th.onclick = () => {
            const column = th.dataset.column;
            const cachedData = sessionStorage.getItem('devops_tasks_cache');
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

    addAllButton.onclick = () => {
        const cachedData = sessionStorage.getItem('devops_tasks_cache');
        if (cachedData) {
            sessionStorage.setItem('devOpsCompleteJSON', cachedData);
            alert('All tasks saved to sessionStorage (devOpsCompleteJSON)!');

            // Close dialog and start check
            if (dialog) dialog.close();

            startCompletionCheck();
        } else {
            alert('No tasks to add.');
        }
    };
}

function createSettingsContent(container, dialog) {
    container.innerHTML = `
        <div style="padding: 15px;">
            <div class="control-group">
                <label for="adoOrgUrl">Org URL</label>
                <input type="text" id="adoOrgUrl" value="${ADO_CONFIG.orgUrl}" placeholder="e.g. https://dev.azure.com/yourorg">
            </div>
            <div class="control-group">
                <label for="adoProject">Project</label>
                <input type="text" id="adoProject" value="${ADO_CONFIG.project}" placeholder="e.g. YourProject">
            </div>
            <div class="control-group">
                <label for="adoApiVersion">API Version</label>
                <input type="text" id="adoApiVersion" value="${ADO_CONFIG.apiVersion}" placeholder="e.g. 7.1">
            </div>
            <div class="control-group">
                <label for="username">Username</label>
                <input type="text" id="username" value="${localStorage.getItem('devops_username') || ''}" placeholder="e.g. Gabriel Mederos <email>">
            </div>
            <div class="control-group">
                <label for="adoToken">DevOps Token (PAT)</label>
                <input type="password" id="adoToken" placeholder="Leave empty to keep existing token">
            </div>
            <button id="saveSettingsBtn" class="btn-primary" style="margin-top: 20px;">Save Settings</button>
        </div>
    `;

    // Get references to elements
    const usernameInput = container.querySelector('#username');
    const tokenInput = container.querySelector('#adoToken');
    const saveSettingsBtn = container.querySelector('#saveSettingsBtn');

    // Username input handler
    usernameInput.oninput = () => {
        localStorage.setItem('devops_username', usernameInput.value);
        updateSearchButtonState(dialog);
    };

    // Save settings handler
    saveSettingsBtn.onclick = () => {
        const newOrgUrl = container.querySelector('#adoOrgUrl').value.trim();
        const newProject = container.querySelector('#adoProject').value.trim();
        const newApiVersion = container.querySelector('#adoApiVersion').value.trim();
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
}

export function createDevopsDialog() {
    const dialog = document.createElement('dialog');
    dialog.classList.add('devops-dialog');

    dialog.innerHTML = `
        <div class="dialog-header">
            <h2 style="color: white;">Azure DevOps Tasks</h2>
            <button class="close-btn">&times;</button>
        </div>
        
        <div class="tabs-nav" style="display: flex; border-bottom: 1px solid #ccc; margin-bottom: 15px;">
            <button class="tab-btn active" data-tab="tasks" style="padding: 10px 20px; border: none; background: none; cursor: pointer; border-bottom: 2px solid #0078d4; font-weight: bold;">Tasks</button>
            <button class="tab-btn" data-tab="settings" style="padding: 10px 20px; border: none; background: none; cursor: pointer;">Settings</button>
        </div>
        
        <div class="dialog-body">
            <div class="tab-content" data-content="tasks"></div>
            <div class="tab-content" data-content="settings" style="display: none;"></div>
        </div>
    `;

    // Get references to elements
    const closeBtn = dialog.querySelector('.close-btn');
    const tasksTabBtn = dialog.querySelector('[data-tab="tasks"]');
    const settingsTabBtn = dialog.querySelector('[data-tab="settings"]');
    const tasksContent = dialog.querySelector('[data-content="tasks"]');
    const settingsContent = dialog.querySelector('[data-content="settings"]');

    // Close button handler
    closeBtn.onclick = () => dialog.close();

    // Create tab contents
    createTasksContent(tasksContent, dialog);
    createSettingsContent(settingsContent, dialog);

    // Tab switching logic
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

// Button injection functionality
function addDevOpsButton() {
    const toolbarSelector = 'oj-toolbar[aria-label="Header Toolbar"]';
    let toolbarButtonsContainer = document.querySelector(toolbarSelector);

    if (toolbarButtonsContainer) {
        createAndAppendButton(toolbarButtonsContainer);
    } else {
        let interval = setInterval(() => {
            toolbarButtonsContainer = document.querySelector(toolbarSelector);
            if (toolbarButtonsContainer) {
                clearInterval(interval);
                createAndAppendButton(toolbarButtonsContainer);
            }
        }, 200);
    }
}

function createAndAppendButton(container) {
    if (container.querySelector('.devops-btn')) return; // Prevent duplicates

    const button = document.createElement('button');
    button.textContent = 'Add from DevOps';
    button.classList.add('BaseButtonStyles_styles_base__jvi3ds0', 'devops-btn');
    button.classList.add('BaseButtonStyles_styles_sizes_sm__jvi3ds2d');
    button.classList.add('BaseButtonStyles_styles_variants_outlined_base__jvi3dso');
    button.classList.add('BaseButtonStyles_styles_styled__jvi3ds1');
    button.classList.add('BaseButtonStyles_styles_styledOutline__jvi3ds2');
    button.classList.add('BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv');
    button.style.borderRadius = '5px';
    button.style.fontWeight = '600';
    button.onclick = showDevOpsDialog;

    if (container.firstChild) {
        container.insertBefore(button, container.firstChild);
    } else {
        container.appendChild(button);
    }
}

// Time sheet integration functions
function addToTimeSheet(id) {
    const cachedData = sessionStorage.getItem('devops_tasks_cache');
    if (cachedData) {
        const tasks = JSON.parse(cachedData);

        const task = tasks.find(t => t.fields['System.Id'] == id);

        if (task) {
            sessionStorage.setItem('devOpsRowJSON', JSON.stringify(task));

            const dialog = query(querySelectors.devopsDialog);
            if (dialog) dialog.close();

            const taskDate = task.fields['System.ChangedDate'];
            const originalEstimate = task.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || '';

            setTimeout(() => {
                const emptyCell = findFirstEmptyCellByDate(taskDate);

                if (emptyCell) {
                    activateEditModeOnCell(emptyCell, (input) => {
                        if (originalEstimate) {
                            input.value = originalEstimate;
                            console.log(`Valor asignado al input: ${originalEstimate}`);

                            const inputEvent = new Event('input', { bubbles: true });
                            input.dispatchEvent(inputEvent);
                        }

                        setTimeout(() => {
                            createCommentCommand();
                        }, 200);
                    });
                } else {
                    console.warn('No se pudo encontrar una celda vacía para la fecha:', taskDate);
                    startCompletionCheck();
                }
            }, 300);
        } else {
            alert('Task not found in cache.');
        }
    }
}

function startCompletionCheck() {
    sessionStorage.setItem('dataAlreadyInserted', '0');

    const interval = setInterval(() => {
        const status = sessionStorage.getItem('dataAlreadyInserted');

        if (status === '1') {
            clearInterval(interval);
            showDevOpsDialog();
        }
    }, 1000);
}

// Initialize Azure DevOps integration
export function initAzureDevOps() {
    addDevOpsButton();
}
