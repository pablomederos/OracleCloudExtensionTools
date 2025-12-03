// ==UserScript==
// @name         Oracle Cloud
// @namespace    http://tampermonkey.net/
// @version      0.1.12
// @description  Ayuda para cargar las tareas de DevOps en Oracle Cloud
// Oracle Cloud DevOps Helper Script
; (function () {
    'use strict';

    // Global variables

    let ctrlBtnPressed = false
    let ctrlKeyCode = 0
    let shiftBtnPressed = false
    let shiftKeyCode = 0
    let altBtnPressed = false
    let altKeyCode = 0
    let actionkeyPressedCode = 0

    const commands = {
        createComment: "true,false,true,67", // Ctrl + Alt + c
        showDevOpsDialog: "true,false,false,68", // Ctrl + d
        saveTimeCard: "true,false,false,83" // Ctrl + s
    }

    const commandValues = Object.values(commands)

    const ADO_CONFIG = {
        orgUrl: localStorage.getItem('ado_orgUrl') || '',
        project: localStorage.getItem('ado_project') || '',
        apiVersion: localStorage.getItem('ado_apiVersion') || ''
    }

    const querySelectors = {
        commentOption: ['#insertComment', '#editComment'],
        devopsDialog: ['.devops-dialog'],
        toolbarButtonsContainer: ['oj-toolbar[aria-label="Header Toolbar"]'],
        saveBtn: ['button[aria-label=Save]'],
        commentView: ['.oj-sp-create-edit-drawer-template-main-container'],
        query: function (selectorList) { return selectorList.map(it => document.querySelector(it)).find(it => it) },
    }

    const pages = {
        timecardsPage: '/fscmUI/redwood/time/timecards/landing-page'
    }

    addStyles();
    removeHeader();
    // Init listeners
    initListeners()

    function initListeners() {

        addDevOpsButton();

        // Register key pressed
        document.addEventListener('keydown', onKeyDown)

        // Clear key pressed
        document.addEventListener('keyup', onKeyUp)
    }

    function onKeyDown(ev) {
        // Ignore with class name
        if (
            [
                'control-group'
            ].some(it => ev.target.classList.contains('it'))
        ) return

        // Enable
        ctrlBtnPressed = ctrlBtnPressed || ev.ctrlKey
        shiftBtnPressed = shiftBtnPressed || ev.shiftKey
        altBtnPressed = altBtnPressed || ev.altKey

        // Save Keycode
        if (!ctrlKeyCode && ev.ctrlKey) ctrlKeyCode = ev.keyCode

        if (!shiftKeyCode && ev.shiftKey) shiftKeyCode = ev.keyCode

        if (!altKeyCode && ev.altKey) altKeyCode = ev.keyCode

        // Register other keys
        if (
            ![ctrlKeyCode, shiftKeyCode, altKeyCode]
                .some(it => it === ev.keyCode)
        ) actionkeyPressedCode = parseInt(ev.keyCode)

        // Prevent write on command
        if (isAlterKeyPressed() && isWellKnownAction()) {
            ev.preventDefault()
            checkCommand();
        }
    }
    function onKeyUp(ev) {
        // Clear key registers

        switch (ev.keyCode) {
            case ctrlKeyCode: ctrlBtnPressed = false;
                break;
            case shiftKeyCode: shiftBtnPressed = false;
                break;
            case altKeyCode: altBtnPressed = false;
                break;
            case actionkeyPressedCode: actionkeyPressedCode = false;
                break;
        }

        clearCommands();
    }

    function isAlterKeyPressed() { return ctrlBtnPressed || shiftBtnPressed || altBtnPressed }

    function isWellKnownAction() {
        const keyCombinations = [
            ctrlBtnPressed, shiftBtnPressed, altBtnPressed, // alter keys
            actionkeyPressedCode // action key
        ].join(',')

        if (
            shiftBtnPressed
            && 65 <= actionkeyPressedCode
            && actionkeyPressedCode <= 90
        ) return true; // mayus

        if (
            ctrlBtnPressed
            && 37 <= actionkeyPressedCode
            && actionkeyPressedCode <= 40
        ) return true; // ctrl + arrows

        if (commandValues.includes(keyCombinations)) return true;

        // Please add an action name (comment) at the end
        switch (keyCombinations) {
            // other action i.e. || 'false,false,false,0'
            case 'true,false,false,82': // Ctrl + r : Reload page
            case 'true,true,false,82': // Ctrl + Shift + r : Reload page, clean cache
            case 'true,false,false,65': // Ctrl + a : Select All
            case 'true,false,false,67': // Ctrl + c : Copy
            case 'true,false,false,86': // Ctrl + v : Paste
            case 'false,true,false,186': // Shift + : Semicolon
                return true;
                break;
            default: return false;
        }


    }

    function checkCommand() {

        const keyCombinations = [
            ctrlBtnPressed, shiftBtnPressed, altBtnPressed, // alter keys
            actionkeyPressedCode, // action key
            window.location.pathname // context
        ].join(',')


        switch (keyCombinations) {
            case `${commands.createComment},${pages.timecardsPage}`:
                createCommentCommand()
                break
            case `${commands.showDevOpsDialog},${pages.timecardsPage}`:
                showDevOpsDialog()
                break
            case `${commands.saveTimeCard},${pages.timecardsPage}`:
                saveTimecard()
                break
        }
    }

    let commentTriggered = false

    function clearCommands() {
        commentTriggered = false
    }

    function createCommentCommand() {
        if (commentTriggered) return;
        commentTriggered = true;

        let focusedElement = document.activeElement
        if (focusedElement.tagName != 'DIV')
            focusedElement = focusedElement.parentElement

        if (focusedElement?.tagName != 'DIV') return

        if (focusedElement?.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true
            })
        )) openInsertCommentWindow();
    }

    function openInsertCommentWindow() {
        let commentBtn = querySelectors.query(querySelectors.commentOption)
        if (commentBtn) {
            commentBtn.click()
            return;
        }

        let intervalCount = 0
        const searchBtnInterval = setInterval(() => {
            commentBtn = querySelectors.query(querySelectors.commentOption)
            if (commentBtn) {
                commentBtn.click()
                intervalCount = 0
                clearInterval(searchBtnInterval)

                let commentView = querySelectors.query(querySelectors.commentView)
                commentView?.querySelector('textarea')?.focus()
                if (!commentView) {
                    const commentInputInterval = setInterval(() => {
                        commentView = querySelectors.query(querySelectors.commentView)
                        if (commentView) {
                            clearInterval(commentInputInterval)
                            commentView.querySelector('textarea')?.focus()
                            return;
                        }
                        intervalCount++
                        if (intervalCount > 5) clearInterval(commentInputInterval)
                    }, 300)
                }
            } else {
                intervalCount++
                if (intervalCount > 10) clearInterval(searchBtnInterval)
            }
        }, 200)
    }

    function saveTimecard() {
        const saveBtn = querySelectors.query(querySelectors.saveBtn)
        if (saveBtn) saveBtn.click()
    }

    function showDevOpsDialog() {
        let dialog = querySelectors.query(querySelectors.devopsDialog)
        if (!dialog) {
            dialog = createDevopsDialog()
            document.body.appendChild(dialog)
        }
        dialog.showModal()
        loadInitialData(dialog)
    }

    async function loadInitialData(dialog) {
        const startDateInput = dialog.querySelector('#startDate')
        const endDateInput = dialog.querySelector('#endDate')
        const usernameInput = dialog.querySelector('#username') // New input
        const searchBtn = dialog.querySelector('#searchBtn')

        // Set default dates if not set
        if (!startDateInput.value || !endDateInput.value) {
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            startDateInput.value = yesterday.toISOString().split('T')[0]
            endDateInput.value = today.toISOString().split('T')[0]
        }

        // Load username
        const storedUsername = localStorage.getItem('devops_username')
        if (storedUsername) {
            usernameInput.value = storedUsername
        }

        updateSearchButtonState(dialog) // Initial check

        const cachedData = sessionStorage.getItem('devops_tasks_cache')
        if (cachedData) {
            renderTable(JSON.parse(cachedData))
        } else {
            // Only auto-click if we have all requirements
            if (!searchBtn.disabled) searchBtn.click()
            else {
                // If disabled, check if it's because of missing settings
                const hasToken = !!localStorage.getItem('devops_token')
                const hasOrg = !!ADO_CONFIG.orgUrl
                const hasProject = !!ADO_CONFIG.project
                const hasApi = !!ADO_CONFIG.apiVersion

                if (!hasToken || !hasOrg || !hasProject || !hasApi) {
                    // Switch to Settings tab
                    const settingsTabBtn = dialog.querySelector('.tab-btn:nth-child(2)')
                    if (settingsTabBtn) settingsTabBtn.click()
                }
            }
        }
    }

    function updateSearchButtonState(dialog) {
        const searchBtn = dialog.querySelector('#searchBtn')
        const usernameInput = dialog.querySelector('#username')
        const hasToken = !!localStorage.getItem('devops_token')
        const hasUsername = !!usernameInput.value.trim()
        const hasOrg = !!ADO_CONFIG.orgUrl
        const hasProject = !!ADO_CONFIG.project
        const hasApi = !!ADO_CONFIG.apiVersion

        searchBtn.disabled = !(hasToken && hasUsername && hasOrg && hasProject && hasApi)

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

    function addDevOpsButton() {
        let toolbarButtonsContainer = querySelectors.query(querySelectors.toolbarButtonsContainer)

        if (toolbarButtonsContainer) {
            createAndAppendButton(toolbarButtonsContainer)
        } else {
            let interval = setInterval(() => {
                toolbarButtonsContainer = querySelectors.query(querySelectors.toolbarButtonsContainer)
                if (toolbarButtonsContainer) {
                    clearInterval(interval)
                    createAndAppendButton(toolbarButtonsContainer)
                }
            }, 200)
        }
    }

    function createAndAppendButton(container) {
        if (container.querySelector('.devops-btn')) return // Prevent duplicates

        const button = document.createElement('button')
        button.textContent = 'Add from DevOps'
        button.classList.add('BaseButtonStyles_styles_base__jvi3ds0', 'devops-btn') // Added marker class
        button.classList.add('BaseButtonStyles_styles_sizes_sm__jvi3ds2d')
        button.classList.add('BaseButtonStyles_styles_variants_outlined_base__jvi3dso')
        button.classList.add('BaseButtonStyles_styles_styled__jvi3ds1')
        button.classList.add('BaseButtonStyles_styles_styledOutline__jvi3ds2')
        button.classList.add('BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv')
        button.style.borderRadius = '5px'
        button.style.fontWeight = '600'
        button.onclick = showDevOpsDialog

        if (container.firstChild) {
            container.insertBefore(button, container.firstChild)
        } else {
            container.appendChild(button)
        }
    }

    function createDevopsDialog() {
        const dialog = document.createElement('dialog')
        dialog.classList.add('devops-dialog') // Use new class

        // Create Header
        const header = document.createElement('div')
        header.className = 'dialog-header'

        const title = document.createElement('h2')
        title.textContent = 'Azure DevOps Tasks'
        title.style.color = 'white'

        const closeBtn = document.createElement('button')
        closeBtn.className = 'close-btn'
        closeBtn.innerHTML = '&times;' // X symbol
        closeBtn.onclick = () => dialog.close()

        header.appendChild(title)
        header.appendChild(closeBtn)
        dialog.appendChild(header)

        // Tabs Navigation
        const tabsNav = document.createElement('div')
        tabsNav.className = 'tabs-nav'
        tabsNav.style.display = 'flex'
        tabsNav.style.borderBottom = '1px solid #ccc'
        tabsNav.style.marginBottom = '15px'

        const tasksTabBtn = document.createElement('button')
        tasksTabBtn.textContent = 'Tasks'
        tasksTabBtn.className = 'tab-btn active'
        tasksTabBtn.style.padding = '10px 20px'
        tasksTabBtn.style.border = 'none'
        tasksTabBtn.style.background = 'none'
        tasksTabBtn.style.cursor = 'pointer'
        tasksTabBtn.style.borderBottom = '2px solid #0078d4'
        tasksTabBtn.style.fontWeight = 'bold'

        const settingsTabBtn = document.createElement('button')
        settingsTabBtn.textContent = 'Settings'
        settingsTabBtn.className = 'tab-btn'
        settingsTabBtn.style.padding = '10px 20px'
        settingsTabBtn.style.border = 'none'
        settingsTabBtn.style.background = 'none'
        settingsTabBtn.style.cursor = 'pointer'

        tabsNav.appendChild(tasksTabBtn)
        tabsNav.appendChild(settingsTabBtn)
        dialog.appendChild(tabsNav)

        // Create Body
        const body = document.createElement('div')
        body.className = 'dialog-body'

        // Tasks Content
        const tasksContent = document.createElement('div')
        tasksContent.className = 'tab-content'
        createTasksContent(tasksContent, dialog)
        body.appendChild(tasksContent)

        // Settings Content
        const settingsContent = document.createElement('div')
        settingsContent.className = 'tab-content'
        settingsContent.style.display = 'none'
        createSettingsContent(settingsContent, dialog)
        body.appendChild(settingsContent)

        dialog.appendChild(body)

        // Tab Switching Logic
        tasksTabBtn.onclick = () => {
            tasksTabBtn.classList.add('active')
            tasksTabBtn.style.borderBottom = '2px solid #0078d4'
            tasksTabBtn.style.fontWeight = 'bold'

            settingsTabBtn.classList.remove('active')
            settingsTabBtn.style.borderBottom = 'none'
            settingsTabBtn.style.fontWeight = 'normal'

            tasksContent.style.display = 'block'
            settingsContent.style.display = 'none'
        }

        settingsTabBtn.onclick = () => {
            settingsTabBtn.classList.add('active')
            settingsTabBtn.style.borderBottom = '2px solid #0078d4'
            settingsTabBtn.style.fontWeight = 'bold'

            tasksTabBtn.classList.remove('active')
            tasksTabBtn.style.borderBottom = 'none'
            tasksTabBtn.style.fontWeight = 'normal'

            settingsContent.style.display = 'block'
            tasksContent.style.display = 'none'
        }

        return dialog
    }

    function createTasksContent(container, dialog) {
        // Controls Section
        const controls = document.createElement('div')
        controls.className = 'controls'

        // Start Date
        const startGroup = createControlGroup('Start Date', 'date', 'startDate')
        controls.appendChild(startGroup)

        // End Date
        const endGroup = createControlGroup('End Date', 'date', 'endDate')
        controls.appendChild(endGroup)



        // Search Button
        const searchBtn = document.createElement('button')
        searchBtn.textContent = 'Search'
        searchBtn.id = 'searchBtn'
        searchBtn.className = 'btn-primary' // New class
        searchBtn.style.alignSelf = 'end' // Align with inputs
        searchBtn.disabled = true // Initially disabled
        controls.appendChild(searchBtn)

        container.appendChild(controls)

        // Table Section
        const tableContainer = document.createElement('div')
        tableContainer.className = 'tasks-table-container'

        const table = document.createElement('table')
        table.className = 'tasks-table' // New class

        const thead = document.createElement('thead')
        const headerRow = document.createElement('tr')
        const headers = ['Task ID', 'Title', 'Changed Date', 'Status', 'Original Estimate', 'Action']
        headers.forEach(text => {
            const th = document.createElement('th')
            th.textContent = text
            headerRow.appendChild(th)
        })
        thead.appendChild(headerRow)
        table.appendChild(thead)

        const tbody = document.createElement('tbody')
        tbody.id = 'tasksBody'
        table.appendChild(tbody)

        tableContainer.appendChild(table)
        container.appendChild(tableContainer)

        // Footer Actions
        const footer = document.createElement('div')
        footer.className = 'footer-actions'

        // const addAllButton = document.createElement('button')
        // addAllButton.textContent = 'Add all to Time Sheet'
        // addAllButton.id = 'addAllBtn'
        // addAllButton.className = 'btn-secondary' // New class

        // footer.appendChild(addAllButton)
        container.appendChild(footer)

        // Re-attach logic for buttons
        const startDateInput = startGroup.querySelector('input')
        const endDateInput = endGroup.querySelector('input')

        searchBtn.onclick = async () => {
            const start = startDateInput.value
            const end = endDateInput.value
            const username = localStorage.getItem('devops_username')

            if (!start || !end) {
                alert('Please select both start and end dates')
                return
            }
            if (!username) {
                alert('Please enter a username')
                return
            }

            searchBtn.textContent = 'Searching...'
            searchBtn.disabled = true

            try {
                const ids = await fetchTaskIds(start, end, username)

                if (ids?.length) {
                    const details = await fetchWorkItemDetails(ids)
                    // Save to cache
                    sessionStorage.setItem('devops_tasks_cache', JSON.stringify(details))
                    renderTable(details)
                } else {
                    renderTable([])
                    alert('No tasks found for the selected range.')
                }
            } catch (error) {
                console.error(error)
                alert('Error fetching tasks')
            } finally {
                searchBtn.textContent = 'Search'
                searchBtn.disabled = false
            }
        }

        // addAllButton.onclick = () => {
        //     const cachedData = sessionStorage.getItem('devops_tasks_cache')
        //     if (cachedData) {
        //         sessionStorage.setItem('devOpsCompleteJSON', cachedData)
        //         alert('All tasks saved to sessionStorage (devOpsCompleteJSON)!')

        //         // Close dialog and start check
        //         if (dialog) dialog.close()

        //         startCompletionCheck()
        //         simulateExternalScript()
        //     } else {
        //         alert('No tasks to add.')
        //     }
        // }
    }

    function createSettingsContent(container, dialog) {
        container.style.padding = '15px'

        const orgUrlGroup = createControlGroup('Org URL', 'text', 'adoOrgUrl')
        orgUrlGroup.querySelector('input').value = ADO_CONFIG.orgUrl
        orgUrlGroup.querySelector('input').placeholder = 'e.g. https://dev.azure.com/yourorg'

        const projectGroup = createControlGroup('Project', 'text', 'adoProject')
        projectGroup.querySelector('input').value = ADO_CONFIG.project
        projectGroup.querySelector('input').placeholder = 'e.g. YourProject'

        const apiVersionGroup = createControlGroup('API Version', 'text', 'adoApiVersion')
        apiVersionGroup.querySelector('input').value = ADO_CONFIG.apiVersion
        apiVersionGroup.querySelector('input').placeholder = 'e.g. 7.1'

        // Username Input
        const usernameGroup = createControlGroup('Username', 'text', 'username')
        const usernameInput = usernameGroup.querySelector('input')
        usernameInput.placeholder = 'e.g. Gabriel Mederos <email>'
        usernameInput.value = localStorage.getItem('devops_username') || ''
        usernameInput.oninput = () => {
            localStorage.setItem('devops_username', usernameInput.value)
            updateSearchButtonState(dialog)
        }

        const tokenGroup = createControlGroup('DevOps Token (PAT)', 'password', 'adoToken')
        const tokenInput = tokenGroup.querySelector('input')
        tokenInput.placeholder = 'Leave empty to keep existing token'

        const saveSettingsBtn = document.createElement('button')
        saveSettingsBtn.textContent = 'Save Settings'
        saveSettingsBtn.className = 'btn-primary'
        saveSettingsBtn.style.marginTop = '20px'
        saveSettingsBtn.onclick = () => {
            const newOrgUrl = orgUrlGroup.querySelector('input').value.trim()
            const newProject = projectGroup.querySelector('input').value.trim()
            const newApiVersion = apiVersionGroup.querySelector('input').value.trim()
            const newToken = tokenInput.value.trim()

            if (newOrgUrl && newProject && newApiVersion) {
                localStorage.setItem('ado_orgUrl', newOrgUrl)
                localStorage.setItem('ado_project', newProject)
                localStorage.setItem('ado_apiVersion', newApiVersion)

                ADO_CONFIG.orgUrl = newOrgUrl
                ADO_CONFIG.project = newProject
                ADO_CONFIG.apiVersion = newApiVersion

                if (newToken) {
                    const encoded = btoa(':' + newToken)
                    localStorage.setItem('devops_token', encoded)
                    tokenInput.value = '' // Clear input
                }

                alert('Settings saved!')
                updateSearchButtonState(dialog)
            } else {
                alert('Please fill all required fields')
            }
        }

        container.appendChild(orgUrlGroup)
        container.appendChild(projectGroup)
        container.appendChild(apiVersionGroup)
        container.appendChild(usernameGroup)
        container.appendChild(tokenGroup)
        container.appendChild(saveSettingsBtn)
    }

    function createControlGroup(labelText, type, id) {
        const group = document.createElement('div')
        group.className = 'control-group'

        const label = document.createElement('label')
        label.textContent = labelText
        label.htmlFor = id

        const input = document.createElement('input')
        input.type = type
        input.id = id

        group.appendChild(label)
        group.appendChild(input)
        return group
    }

    function renderTable(workItems) {
        const tbody = document.getElementById('tasksBody')
        tbody.innerHTML = ''

        let lastDate = null
        let useGray = false

        workItems
            .sort((a, b) => new Date(b.fields['System.ChangedDate']) - new Date(a.fields['System.ChangedDate']))
            .forEach(item => {
                const tr = document.createElement('tr')

                const fields = item.fields
                const id = fields['System.Id']
                const title = fields['System.Title']
                const date = new Date(fields['System.ChangedDate']).toLocaleDateString()
                const status = fields['System.State']
                const estimate = fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || '-'

                // Date grouping logic
                if (date !== lastDate) {
                    useGray = !useGray
                    lastDate = date
                }

                if (useGray) {
                    tr.classList.add('task-row-alt')
                }

                const cells = [id, title, date, status, estimate]
                cells.forEach(text => {
                    const td = document.createElement('td')
                    td.textContent = text
                    tr.appendChild(td)
                })

                const actionTd = document.createElement('td')
                // const btn = document.createElement('button')
                // btn.textContent = '⏱️'
                // btn.title = 'Add to Time Sheet'
                // btn.className = 'action-btn' // New class
                // btn.onclick = () => addToTimeSheet(id)
                // actionTd.appendChild(btn)

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
                    })
                }
                actionTd.appendChild(copyBtn)

                tr.appendChild(actionTd)

                tbody.appendChild(tr)
            })
    }

    function addToTimeSheet(id) {
        const cachedData = sessionStorage.getItem('devops_tasks_cache')
        if (cachedData) {
            const tasks = JSON.parse(cachedData)

            const task = tasks.find(t => t.fields['System.Id'] == id)

            if (task) {
                sessionStorage.setItem('devOpsRowJSON', JSON.stringify(task))

                const dialog = querySelectors.query(querySelectors.devopsDialog)
                if (dialog) dialog.close()

                startCompletionCheck()
                simulateExternalScript() // For testing purposes
            } else {
                alert('Task not found in cache.')
            }
        }
    }

    function startCompletionCheck() {
        sessionStorage.setItem('dataAlreadyInserted', '0')

        const interval = setInterval(() => {
            const status = sessionStorage.getItem('dataAlreadyInserted')

            if (status === '1') {
                clearInterval(interval)
                showDevOpsDialog()
            }
        }, 1000)
    }

    function simulateExternalScript() {
        setTimeout(() => {
            sessionStorage.setItem('dataAlreadyInserted', '1')
        }, 3000) // Wait 3 seconds
    }

    function getAuthHeader() {
        const storedToken = localStorage.getItem('devops_token')
        if (!storedToken)
            alert('Azure DevOps Token not found. Please set it.')

        const devopsToken = atob(storedToken).substring(1)

        return {
            'Authorization': 'Bearer ' + devopsToken,
            'Content-Type': 'application/json'
        }
    }

    async function fetchTaskIds(startDate, endDate, username) {
        const query = `
        SELECT [System.Id]
        FROM workitems
        WHERE [System.WorkItemType] = 'Task'
        AND [System.TeamProject] = '${ADO_CONFIG.project}'
        AND [System.ChangedDate] >= '${startDate}'
        AND [System.ChangedDate] <= '${endDate}'
        AND [System.ChangedBy] = '${username}'
    `

        const url = `${ADO_CONFIG.orgUrl}/${ADO_CONFIG.project}/_apis/wit/wiql?api-version=${ADO_CONFIG.apiVersion}`
        const authToken = getAuthHeader()

        if (!authToken) return

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: authToken,
                body: JSON.stringify({ query })
            })

            if (!response.ok) {
                const text = await response.text()
                console.error('API Error Response:', text)
                throw new Error(`WIQL Error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            return data.workItems.map(item => item.id)
        } catch (error) {
            console.error('Error fetching task IDs:', error)
            alert('Error fetching tasks. Check console for details.')
            return []
        }
    }

    async function fetchWorkItemDetails(ids) {
        if (!ids || ids.length === 0) return []

        const fields = [
            'System.Id',
            'System.Title',
            'System.ChangedDate',
            'System.State',
            'Microsoft.VSTS.Scheduling.OriginalEstimate'
        ].join(',')

        const url = `${ADO_CONFIG.orgUrl}/${ADO_CONFIG.project}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=${ADO_CONFIG.apiVersion}`

        try {
            const response = await fetch(url, {
                headers: getAuthHeader()
            })

            if (!response.ok) throw new Error(`Details Error: ${response.statusText}`)

            const data = await response.json()
            return data.value
        } catch (error) {
            console.error('Error fetching details:', error)
            return []
        }
    }

    function removeHeader() {
        const bannerCheckIntervalMs = 200
        // Oracle banner
        let banner, lookForInterval = setInterval((() => { banner ? (clearInterval(lookForInterval), banner.remove()) : banner = document.querySelectorAll('div:has(>table[role=presentation])')?.[0] || document.querySelector('.oj-sp-banner-container.oj-sp-banner-layout.oj-private-scale-lg.oj-sp-common-banner-content-layout') }), bannerCheckIntervalMs);
    }

    function addStyles() {
        const style = document.createElement('style')
        style.textContent = `
            * {
                --PRIMARY-COLOR: #cc1f20;
            }
            .devops-dialog {
                padding: 0;
                border: none;
                border-radius: 4px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                max-width: 90vw;
                width: 80%;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .devops-dialog::backdrop {
                background: rgba(0, 0, 0, 0.4);
            }
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: var(--PRIMARY-COLOR);
                color: white;
                border-bottom: 1px solid #eee;
            }
            .dialog-header h2 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
            }
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .close-btn:hover {
                opacity: 0.8;
            }
            .dialog-body {
                padding: 20px;
                background: #fff;
            }
            .controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .control-group label {
                font-size: 0.85rem;
                color: #666;
                font-weight: 500;
            }
            .control-group input {
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 3px;
                font-size: 0.9rem;
            }
            .control-group input:focus {
                border-color: var(--PRIMARY-COLOR);
                outline: none;
            }
            .btn-primary {
                background-color: var(--PRIMARY-COLOR);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            .btn-primary:hover {
                background-color: var(--PRIMARY-COLOR);
            }
            .btn-primary:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            .btn-secondary {
                background-color: #fff;
                color: #333;
                border: 1px solid #ccc;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 500;
            }
            .btn-secondary:hover {
                background-color: #f8f9fa;
                border-color: #bbb;
            }
            .tasks-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #eee;
                border-radius: 4px;
            }
            .tasks-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            .tasks-table th {
                background-color: #f1f1f1;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #333;
                position: sticky;
                top: 0;
                border-bottom: 2px solid #ddd;
            }
            .tasks-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #eee;
                color: #444;
            }
            .tasks-table tr:hover {
                background-color: #fdfdfd;
            }
            .task-row-alt {
                background-color: #f9f9f9;
            }
            .action-btn {
                background-color: #fff;
                color: var(--PRIMARY-COLOR);
                border: 1px solid var(--PRIMARY-COLOR);
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            .action-btn:hover {
                background-color: var(--PRIMARY-COLOR);
                color: white;
            }
            .footer-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }
        `
        document.head.appendChild(style)
    }
})();