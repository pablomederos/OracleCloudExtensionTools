import { ADO_CONFIG, fetchTaskIds, fetchWorkItemDetails } from './azure-devops-api.js'
import { querySelectors } from '../utils/selectors.js'
import {
    STORAGE_KEYS,
    MESSAGES,
    UI_TEXT,
    BUTTON_CLASSES,
    BUTTON_CONFIG,
    FIELD_KEYS
} from '../utils/constants.js'
import {
    getDialogStructure,
    getTasksTabTemplate,
    getSettingsTabTemplate,
    fillTemplate
} from './templates/index.js'
import {
    processTaskInsertion,
    startCompletionCheck
} from '../utils/oracle-grid.js'

let sortState = {
    column: 'date',
    ascending: false
}

export const createDevopsDialog = async () => {
    const dialog = document.createElement('dialog')
    dialog.classList.add('devops-dialog')

    dialog.innerHTML = await getDialogStructure()

    const closeBtn = querySelectors.queryFrom(dialog, querySelectors.closeBtn)
    const tasksTabBtn = querySelectors.queryFrom(dialog, querySelectors.tasksTab)
    const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTab)
    const tasksContent = querySelectors.queryFrom(dialog, querySelectors.tasksContent)
    const settingsContent = querySelectors.queryFrom(dialog, querySelectors.settingsContent)

    closeBtn.onclick = () => dialog.close()

    await createTasksContent(tasksContent, dialog)
    await createSettingsContent(settingsContent, dialog)

    tasksTabBtn.onclick = () => {
        tasksTabBtn.classList.add('active')
        tasksTabBtn.style.borderBottom = '2px solid var(--color-primary)'
        tasksTabBtn.style.fontWeight = 'bold'

        settingsTabBtn.classList.remove('active')
        settingsTabBtn.style.borderBottom = 'none'
        settingsTabBtn.style.fontWeight = 'normal'

        tasksContent.style.display = 'block'
        settingsContent.style.display = 'none'
    }

    settingsTabBtn.onclick = () => {
        settingsTabBtn.classList.add('active')
        settingsTabBtn.style.borderBottom = '2px solid var(--color-primary)'
        settingsTabBtn.style.fontWeight = 'bold'

        tasksTabBtn.classList.remove('active')
        tasksTabBtn.style.borderBottom = 'none'
        tasksTabBtn.style.fontWeight = 'normal'

        settingsContent.style.display = 'block'
        tasksContent.style.display = 'none'
    }

    return dialog
}

export const showDevOpsDialog = async () => {
    let dialog = querySelectors.query(querySelectors.devopsDialog)
    if (!dialog) {
        dialog = await createDevopsDialog()
        document.body.appendChild(dialog)
    }
    dialog.showModal()
    loadInitialData(dialog)
}

const createTasksContent = async (container, dialog) => {
    container.innerHTML = await getTasksTabTemplate()

    const startDateInput = querySelectors.queryFrom(container, querySelectors.startDate)
    const endDateInput = querySelectors.queryFrom(container, querySelectors.endDate)
    const searchBtn = querySelectors.queryFrom(container, querySelectors.searchBtn)
    const addAllButton = querySelectors.queryFrom(container, querySelectors.addAllBtn)

    const filterSwitch = container.querySelector('#filterDateSwitch')
    const showToDoSwitch = querySelectors.queryFrom(container, querySelectors.showToDo)

    container.querySelectorAll(querySelectors.sortableTableHeader[0]).forEach(th => {
        th.onclick = () => {
            const column = th.dataset.column
            const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
            if (cachedData) {
                const workItems = JSON.parse(cachedData)
                const ascending = sortState.column === column ? !sortState.ascending : true
                renderTable(workItems, column, ascending)
            }
        }
    })

    const localFilterId = container.querySelector('#localFilterId')
    const localFilterTitle = container.querySelector('#localFilterTitle')
    const localFilterDate = container.querySelector('#localFilterDate')
    const localFilterStatus = container.querySelector('#localFilterStatus')
    const filterPopoverBtn = container.querySelector('#filterPopoverBtn')
    const clearFilterBtn = container.querySelector('#clearFilterBtn')

    const syncDateBounds = () => {
        if (localFilterDate) {
            localFilterDate.min = startDateInput.value
            localFilterDate.max = endDateInput.value
        }
    }
    syncDateBounds()

    let filterDebounce;
    const triggerLocalFilter = () => {
        clearTimeout(filterDebounce)
        filterDebounce = setTimeout(() => {
            const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
            if (cachedData) {
                renderTable(JSON.parse(cachedData))
            }
            
            const hasActiveFilters = localFilterId.value || localFilterTitle.value || localFilterDate.value || localFilterStatus.value
            clearFilterBtn.disabled = !hasActiveFilters
            clearFilterBtn.style.opacity = hasActiveFilters ? '1' : '0.5'
        }, 300)
    }

    [localFilterId, localFilterTitle, localFilterDate, localFilterStatus].forEach(input => {
        if(input) input.addEventListener('input', triggerLocalFilter)
    })

    if(clearFilterBtn) {
        clearFilterBtn.onclick = () => {
            localFilterId.value = ''
            localFilterTitle.value = ''
            localFilterDate.value = ''
            localFilterStatus.value = ''
            triggerLocalFilter()
        }
    }

    const updateFilterStorage = () => {
        if (filterSwitch.checked) {
            localStorage.setItem(STORAGE_KEYS.LOCAL.FILTER_ENABLED, 'true')
            localStorage.setItem(STORAGE_KEYS.LOCAL.FILTER_START_DATE, startDateInput.value)
            localStorage.setItem(STORAGE_KEYS.LOCAL.FILTER_END_DATE, endDateInput.value)
        } else {
            localStorage.removeItem(STORAGE_KEYS.LOCAL.FILTER_ENABLED)
            localStorage.removeItem(STORAGE_KEYS.LOCAL.FILTER_START_DATE)
            localStorage.removeItem(STORAGE_KEYS.LOCAL.FILTER_END_DATE)
            sessionStorage.removeItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
        }
    }

    filterSwitch.onchange = () => {
        updateFilterStorage()
    }

    showToDoSwitch.onchange = () => {
        const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
        if (cachedData) {
            renderTable(JSON.parse(cachedData))
        }
    }

    startDateInput.onchange = () => {
        syncDateBounds()
        if (filterSwitch.checked) updateFilterStorage()
    }

    endDateInput.onchange = () => {
        syncDateBounds()
        if (filterSwitch.checked) updateFilterStorage()
    }

    searchBtn.onclick = async () => {
        const start = startDateInput.value
        const end = endDateInput.value
        const username = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME)

        if (!start || !end) {
            alert(MESSAGES.SELECT_DATES)
            return
        }
        if (!username) {
            alert(MESSAGES.ENTER_USERNAME)
            return
        }

        if (filterSwitch.checked) {
            updateFilterStorage()
        }

        searchBtn.textContent = UI_TEXT.SEARCHING
        searchBtn.disabled = true

        try {
            const ids = await fetchTaskIds(start, end, username)

            if (ids?.length) {
                const details = await fetchWorkItemDetails(ids)
                sessionStorage.setItem(STORAGE_KEYS.SESSION.TASKS_CACHE, JSON.stringify(details))
                renderTable(details)
            } else {
                renderTable([])
                alert(MESSAGES.NO_TASKS_FOUND)
            }
        } catch (error) {
            console.error(error)
            alert(MESSAGES.ERROR_FETCHING)
        } finally {
            searchBtn.textContent = UI_TEXT.SEARCH
            searchBtn.disabled = false
        }
    }

    addAllButton.onclick = () => {
        const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
        if (cachedData) {
            sessionStorage.setItem(STORAGE_KEYS.SESSION.COMPLETE_JSON, cachedData)
            alert(MESSAGES.ALL_TASKS_SAVED)

            if (dialog) dialog.close()

            startCompletionCheck(showDevOpsDialog)
        } else {
            alert(MESSAGES.NO_TASKS_TO_ADD)
        }
    }
}

const createSettingsContent = async (container, dialog) => {
    const template = await getSettingsTabTemplate()
    container.innerHTML = fillTemplate(template, {
        orgUrl: ADO_CONFIG.orgUrl,
        project: ADO_CONFIG.project,
        apiVersion: ADO_CONFIG.apiVersion,
        username: localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME) || ''
    })

    const usernameInput = querySelectors.queryFrom(container, querySelectors.username)
    const tokenInput = querySelectors.queryFrom(container, querySelectors.adoToken)
    const orgUrlInput = querySelectors.queryFrom(container, querySelectors.adoOrgUrl)
    const patLink = querySelectors.queryFrom(container, querySelectors.getPatLink)
    const saveSettingsBtn = querySelectors.queryFrom(container, querySelectors.saveSettingsBtn)

    const updatePatLink = () => {
        const orgUrl = orgUrlInput.value.trim()
        if (orgUrl) {
            patLink.href = `${orgUrl.replace(/\/$/, '')}/_usersSettings/tokens`
            patLink.style.display = 'block'
        } else {
            patLink.style.display = 'none'
        }
    }

    orgUrlInput.oninput = updatePatLink
    updatePatLink()

    usernameInput.oninput = () => {
        localStorage.setItem(STORAGE_KEYS.LOCAL.USERNAME, usernameInput.value)
        updateSearchButtonState(dialog)
    }

    saveSettingsBtn.onclick = () => {
        const newOrgUrl = querySelectors.queryFrom(container, querySelectors.adoOrgUrl).value.trim()
        const newProject = querySelectors.queryFrom(container, querySelectors.adoProject).value.trim()
        const newApiVersion = querySelectors.queryFrom(container, querySelectors.adoApiVersion).value.trim()
        const newToken = tokenInput.value.trim()

        if (newOrgUrl && newProject && newApiVersion) {
            localStorage.setItem(STORAGE_KEYS.LOCAL.ORG_URL, newOrgUrl)
            localStorage.setItem(STORAGE_KEYS.LOCAL.PROJECT, newProject)
            localStorage.setItem(STORAGE_KEYS.LOCAL.API_VERSION, newApiVersion)

            ADO_CONFIG.orgUrl = newOrgUrl
            ADO_CONFIG.project = newProject
            ADO_CONFIG.apiVersion = newApiVersion

            if (newToken) {
                const encoded = btoa(':' + newToken)
                localStorage.setItem(STORAGE_KEYS.LOCAL.TOKEN, encoded)
                tokenInput.value = ''
            }

            alert(MESSAGES.SETTINGS_SAVED)
            updateSearchButtonState(dialog)
        } else {
            alert(MESSAGES.FILL_REQUIRED)
        }
    }
}

const updateSortIndicators = () => {
    const headers = document.querySelectorAll(querySelectors.tasksTableHeader[0])
    const columnMap = ['id', 'title', 'date', 'status', 'estimate', null]

    headers.forEach((th, index) => {
        const column = columnMap[index]
        if (!column) return

        th.textContent = th.textContent.replace(/ [↑↓]/g, '')

        if (column === sortState.column) {
            th.textContent += sortState.ascending ? ' ↑' : ' ↓'
        }
    })
}

const hasRequiredSettings = (hasToken, hasUsername, hasOrg, hasProject, hasApi) =>
    hasToken && hasUsername && hasOrg && hasProject && hasApi

const updateSearchButtonState = (dialog) => {
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn)
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username)
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.LOCAL.TOKEN)
    const hasUsername = !!usernameInput.value.trim()
    const hasOrg = !!ADO_CONFIG.orgUrl
    const hasProject = !!ADO_CONFIG.project
    const hasApi = !!ADO_CONFIG.apiVersion

    searchBtn.disabled = !hasRequiredSettings(hasToken, hasUsername, hasOrg, hasProject, hasApi)

    if (searchBtn.disabled) {
        const missing = []
        if (!hasToken) missing.push('Token')
        if (!hasUsername) missing.push('Username')
        if (!hasOrg) missing.push('Org URL')
        if (!hasProject) missing.push('Project')
        if (!hasApi) missing.push('API Version')
        searchBtn.title = `Missing: ${missing.join(', ')}`
    } else {
        searchBtn.title = ''
    }
}

const loadInitialData = async (dialog) => {
    const startDateInput = querySelectors.queryFrom(dialog, querySelectors.startDate)
    const endDateInput = querySelectors.queryFrom(dialog, querySelectors.endDate)
    const usernameInput = querySelectors.queryFrom(dialog, querySelectors.username)
    const searchBtn = querySelectors.queryFrom(dialog, querySelectors.searchBtn)

    const filterSwitch = dialog.querySelector('#filterDateSwitch')
    const filterEnabled = localStorage.getItem(STORAGE_KEYS.LOCAL.FILTER_ENABLED) === 'true'

    if (filterEnabled) {
        filterSwitch.checked = true
        const savedStart = localStorage.getItem(STORAGE_KEYS.LOCAL.FILTER_START_DATE)
        const savedEnd = localStorage.getItem(STORAGE_KEYS.LOCAL.FILTER_END_DATE)
        if (savedStart) startDateInput.value = savedStart
        if (savedEnd) endDateInput.value = savedEnd
    } else {
        filterSwitch.checked = false
        if (!startDateInput.value || !endDateInput.value) {
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            startDateInput.value = yesterday.toISOString().split('T')[0]
            endDateInput.value = today.toISOString().split('T')[0]
        }
    }

    const localFilterDate = dialog.querySelector('#localFilterDate')
    if (localFilterDate) {
        localFilterDate.min = startDateInput.value
        localFilterDate.max = endDateInput.value
    }

    const storedUsername = localStorage.getItem(STORAGE_KEYS.LOCAL.USERNAME)
    if (storedUsername) {
        usernameInput.value = storedUsername
    }

    updateSearchButtonState(dialog)

    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
    if (cachedData) {
        renderTable(JSON.parse(cachedData))
    } else {
        if (!searchBtn.disabled) searchBtn.click()
        else {
            const isAdoSetupMissing = () => !hasToken || !hasOrg || !hasProject || !hasApi

            if (isAdoSetupMissing()) {
                const settingsTabBtn = querySelectors.queryFrom(dialog, querySelectors.settingsTabBtn)
                if (settingsTabBtn) settingsTabBtn.click()
            }
        }
    }
}

const renderTable = (workItems, sortColumn = sortState.column, ascending = sortState.ascending) => {
    const tbody = document.getElementById(querySelectors.tasksBody[0].replace('#', ''))
    tbody.innerHTML = ''

    sortState.column = sortColumn
    sortState.ascending = ascending

    updateSortIndicators()

    let lastDate = null
    let useGray = false

    const dialog = querySelectors.query(querySelectors.devopsDialog)
    const showToDoSwitch = querySelectors.queryFrom(dialog, querySelectors.showToDo)
    const showToDo = showToDoSwitch ? showToDoSwitch.checked : false

    const localFilterStatusNode = document.getElementById('localFilterStatus')
    if (localFilterStatusNode && workItems.length > 0) {
        const currentOptions = Array.from(localFilterStatusNode.options).map(o => o.value)
        const uniqueStatuses = [...new Set(workItems.map(item => item.fields[FIELD_KEYS.STATE]))].sort()
        
        if (uniqueStatuses.some(s => !currentOptions.includes(s)) || currentOptions.length - 1 !== uniqueStatuses.length) {
            const currentValue = localFilterStatusNode.value
            localFilterStatusNode.innerHTML = '<option value="">All</option>'
            uniqueStatuses.forEach(status => {
                const opt = document.createElement('option')
                opt.value = status
                opt.textContent = status
                localFilterStatusNode.appendChild(opt)
            })
            if (uniqueStatuses.includes(currentValue)) {
                localFilterStatusNode.value = currentValue
            }
        }
    }

    const localFilterIdVal = (document.getElementById('localFilterId')?.value || '').toLowerCase()
    const localFilterTitleVal = (document.getElementById('localFilterTitle')?.value || '').toLowerCase()
    const localFilterDateVal = document.getElementById('localFilterDate')?.value || ''
    const localFilterStatusVal = (document.getElementById('localFilterStatus')?.value || '').toLowerCase()

    const filteredItems = workItems.filter(item => {
        const state = item.fields[FIELD_KEYS.STATE] || ''
        const idStr = String(item.fields[FIELD_KEYS.ID] || '')
        const titleStr = item.fields[FIELD_KEYS.TITLE] || ''
        
        let changedDateStr = ''
        if (item.fields[FIELD_KEYS.CHANGED_DATE]) {
            changedDateStr = new Date(item.fields[FIELD_KEYS.CHANGED_DATE]).toISOString().split('T')[0]
        }

        let passesToDo = false
        if (state === 'To Do') passesToDo = showToDo
        else if (state === 'In Progress' || state === 'Done') passesToDo = true
        else passesToDo = true

        if (!passesToDo) return false;

        if (localFilterIdVal && !idStr.toLowerCase().includes(localFilterIdVal)) return false;
        if (localFilterTitleVal && !titleStr.toLowerCase().includes(localFilterTitleVal)) return false;
        if (localFilterDateVal && changedDateStr !== localFilterDateVal) return false;
        if (localFilterStatusVal && state.toLowerCase() !== localFilterStatusVal) return false;

        return true;
    })

    const sortedItems = [...filteredItems].sort((a, b) => {
        let valA, valB

        switch (sortColumn) {
            case 'id':
                valA = a.fields[FIELD_KEYS.ID]
                valB = b.fields[FIELD_KEYS.ID]
                break
            case 'title':
                valA = a.fields[FIELD_KEYS.TITLE].toLowerCase()
                valB = b.fields[FIELD_KEYS.TITLE].toLowerCase()
                break
            case 'date':
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE])
                valB = new Date(b.fields[FIELD_KEYS.CHANGED_DATE])
                break
            case 'status':
                valA = a.fields[FIELD_KEYS.STATE].toLowerCase()
                valB = b.fields[FIELD_KEYS.STATE].toLowerCase()
                break
            case 'estimate':
                valA = a.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0
                valB = b.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || 0
                break
            default:
                valA = new Date(a.fields[FIELD_KEYS.CHANGED_DATE])
                valB = new Date(a.fields[FIELD_KEYS.CHANGED_DATE])
        }

        if (valA < valB) return ascending ? -1 : 1
        if (valA > valB) return ascending ? 1 : -1
        return 0
    })

    sortedItems.forEach(item => {
        const tr = document.createElement('tr')

        const fields = item.fields
        const id = fields[FIELD_KEYS.ID]
        const title = fields[FIELD_KEYS.TITLE]
        const date = new Date(fields[FIELD_KEYS.CHANGED_DATE]).toLocaleDateString()
        const status = fields[FIELD_KEYS.STATE]
        const estimate = fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || '-'

        if (date !== lastDate) {
            useGray = !useGray
            lastDate = date
        }

        if (useGray) {
            tr.classList.add('task-row-alt')
        }

        let highlightedTitle = title
        if (localFilterTitleVal) {
            const regex = new RegExp(`(${localFilterTitleVal})`, 'gi')
            highlightedTitle = title.replace(regex, '<mark>$1</mark>')
        }

        const cells = [id, highlightedTitle, date, status, estimate]
        cells.forEach((text, i) => {
            const td = document.createElement('td')
            if (i === 1) {
                td.innerHTML = String(text)
            } else {
                td.textContent = text
            }
            tr.appendChild(td)
        })

        const actionTd = document.createElement('td')

        const btn = document.createElement('button')
        btn.textContent = '⏱️'
        btn.title = 'Add to Time Sheet'
        btn.className = 'action-btn experimental-feature'
        btn.onclick = () => addToTimeSheet(id)
        actionTd.appendChild(btn)

        const copyBtn = document.createElement('button')
        copyBtn.textContent = '📋'
        copyBtn.title = 'Copy to Clipboard'
        copyBtn.className = 'action-btn'
        copyBtn.style.marginLeft = '5px'
        copyBtn.onclick = () => {
            const text = `${id}: ${title.replace(':', ' ')}`
            navigator.clipboard.writeText(text).then(() => {
                const dialog = querySelectors.query(querySelectors.devopsDialog)
                if (dialog) dialog.close()

                const commentView = querySelectors.query(querySelectors.commentView)
                const textarea = querySelectors.queryFrom(commentView, querySelectors.commentTextarea)

                if (textarea) {
                    textarea.value = text
                    textarea.focus()
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                }
            })
        }
        actionTd.appendChild(copyBtn)

        tr.appendChild(actionTd)

        tbody.appendChild(tr)
    })
}

const addToTimeSheet = (id) => {
    const cachedData = sessionStorage.getItem(STORAGE_KEYS.SESSION.TASKS_CACHE)
    if (!cachedData) return

    const tasks = JSON.parse(cachedData)
    const task = tasks.find(t => t.fields[FIELD_KEYS.ID] == id)

    if (!task) {
        alert(MESSAGES.TASK_NOT_FOUND)
        return
    }

    startCompletionCheck(showDevOpsDialog)
    sessionStorage.setItem(STORAGE_KEYS.SESSION.ROW_JSON, JSON.stringify(task))

    const dialog = querySelectors.query(querySelectors.devopsDialog)
    if (dialog) dialog.close()
    processTaskInsertion(task)
}

const addDevOpsButton = () => {
    const checkAndInject = () => {
        const toolbarButtonsContainer = querySelectors.query(querySelectors.headerToolbar)
        if (toolbarButtonsContainer) {
            createAndAppendButton(toolbarButtonsContainer)
            return true
        }
        return false
    }

    // Start with interval directly effectively as requested
    const interval = setInterval(() => {
        if (checkAndInject()) {
            clearInterval(interval)
        }
    }, 500)
}

const createAndAppendButton = (container) => {
    if (querySelectors.queryFrom(container, querySelectors.devopsBtn)) return

    const button = document.createElement('button')
    button.textContent = BUTTON_CONFIG.TEXT
    button.classList.add(...BUTTON_CLASSES)
    button.style.borderRadius = BUTTON_CONFIG.BORDER_RADIUS
    button.style.fontWeight = BUTTON_CONFIG.FONT_WEIGHT
    button.onclick = showDevOpsDialog

    if (container.firstChild) {
        container.insertBefore(button, container.firstChild)
    } else {
        container.appendChild(button)
    }
}

export const initAzureDevOps = () => {
    addDevOpsButton()
}
