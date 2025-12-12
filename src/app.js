import addStyles from './styles/dialog.js'
import { removeHeader, createCommentCommand, populateCommentTextarea, resetCommentTrigger } from './utils/dom.js'
import { showDevOpsDialog, initAzureDevOps } from './tasks/azure-devops-dialog.js'
import { querySelectors } from './utils/selectors.js'
import { getShortcutString } from './config/shortcuts.js'

import { initCommentTemplates } from './tasks/comment-templates.js'

addStyles()
removeHeader()

let ctrlBtnPressed = false
let ctrlKeyCode = 0
let shiftBtnPressed = false
let shiftKeyCode = 0
let altBtnPressed = false
let altKeyCode = 0
let actionkeyPressedCode = 0

const commands = {
    createComment: getShortcutString('createComment'),
    showDevOpsDialog: getShortcutString('showDevOpsDialog'),
    saveTimeCard: getShortcutString('saveTimeCard')
}

const pages = {
    timecardsPage: '/fscmUI/redwood/time/timecards/landing-page'
}

const isScriptCommand = () => {
    const keyCombinations = [
        ctrlBtnPressed, shiftBtnPressed, altBtnPressed,
        actionkeyPressedCode,
        window.location.pathname
    ].join(',')

    const scriptCommands = [
        `${commands.createComment},${pages.timecardsPage}`,
        `${commands.showDevOpsDialog},${pages.timecardsPage}`,
        `${commands.saveTimeCard},${pages.timecardsPage}`
    ]

    return scriptCommands.includes(keyCombinations)
}



const saveTimecard = () => {
    const commentView = querySelectors.query(querySelectors.commentView)

    if (commentView) {
        const commentSaveBtn = querySelectors.queryFrom(commentView, querySelectors.saveBtn)
        if (commentSaveBtn) commentSaveBtn.click()
    } else {
        const saveBtn = querySelectors.query(querySelectors.saveBtn)
        if (saveBtn) saveBtn.click()
    }
}

const checkCommand = () => {
    const keyCombinations = [
        ctrlBtnPressed, shiftBtnPressed, altBtnPressed,
        actionkeyPressedCode,
        window.location.pathname
    ].join(',')


    switch (keyCombinations) {
        case `${commands.createComment},${pages.timecardsPage}`:
            createCommentCommand()
            break
        case `${commands.showDevOpsDialog},${pages.timecardsPage}`:
            if (window.ORACLE_TOOLS_CONFIG?.azureDevOps) showDevOpsDialog()
            break
        case `${commands.saveTimeCard},${pages.timecardsPage}`:
            saveTimecard()
            break
    }
}

const clearCommands = () => {
    resetCommentTrigger()
}

const onKeyDown = (ev) => {
    if (
        [
            'control-group'
        ].some(it => ev.target.classList.contains('it'))
    ) return

    ctrlBtnPressed = ctrlBtnPressed || ev.ctrlKey
    shiftBtnPressed = shiftBtnPressed || ev.shiftKey
    altBtnPressed = altBtnPressed || ev.altKey

    if (!ctrlKeyCode && ev.ctrlKey) ctrlKeyCode = ev.keyCode

    if (!shiftKeyCode && ev.shiftKey) shiftKeyCode = ev.keyCode

    if (!altKeyCode && ev.altKey) altKeyCode = ev.keyCode

    if (
        ![ctrlKeyCode, shiftKeyCode, altKeyCode]
            .some(it => it === ev.keyCode)
    ) actionkeyPressedCode = parseInt(ev.keyCode)

    if (isScriptCommand()) {
        ev.preventDefault()
        checkCommand()
    }
}

const onKeyUp = (ev) => {
    switch (ev.keyCode) {
        case ctrlKeyCode: ctrlBtnPressed = false
            break
        case shiftKeyCode: shiftBtnPressed = false
            break
        case altKeyCode: altBtnPressed = false
            break
        case actionkeyPressedCode: actionkeyPressedCode = false
            break
    }

    clearCommands()
}

const initListeners = () => {
    if (window.ORACLE_TOOLS_CONFIG?.azureDevOps) {
        const tryInit = (attempts = 0) => {
            try {
                initAzureDevOps()
            } catch (error) {
                console.warn(`Error initializing AzureDevOps (attempt ${attempts + 1}):`, error)
                if (attempts < 3) {
                    setTimeout(() => tryInit(attempts + 1), 500)
                }
            }
        }
        tryInit()
    }
    initCommentTemplates()

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
}

initListeners()
