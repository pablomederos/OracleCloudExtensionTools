import addStyles from './styles/dialog.js'
import { removeHeader } from './utils/dom.js'
import { showDevOpsDialog, initAzureDevOps } from './tasks/azure-devops-dialog.js'
import { querySelectors } from './utils/selectors.js'
import { getShortcutString } from './config/shortcuts.js'

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

const createCommentCommand = (cellElement) => {
    if (commentTriggered) return
    commentTriggered = true

    let focusedElement = cellElement || document.activeElement
    if (focusedElement.tagName != 'DIV')
        focusedElement = focusedElement.parentElement

    if (focusedElement?.tagName != 'DIV') return

    if (focusedElement?.dispatchEvent(
        new MouseEvent('contextmenu', {
            bubbles: true
        })
    )) openInsertCommentWindow()
}

const openInsertCommentWindow = () => {
    let commentBtn = querySelectors.query(querySelectors.commentOption)
    if (commentBtn) {
        commentBtn.click()
        return
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
                        return
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

let commentTriggered = false

const clearCommands = () => {
    commentTriggered = false
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
    if (window.ORACLE_TOOLS_CONFIG?.azureDevOps) initAzureDevOps()

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
}

initListeners()

export { createCommentCommand, populateCommentTextarea }

const populateCommentTextarea = (taskId, taskTitle) => {
    const commentText = `${taskId}: ${taskTitle}`

    return new Promise((resolve) => {
        const tryPopulate = (attempts = 0) => {
            if (attempts > 10) {
                console.warn('No se pudo encontrar el textarea de comentarios')
                resolve(false)
                return
            }

            const commentView = querySelectors.query(querySelectors.commentView)
            const textarea = commentView?.querySelector('textarea')

            if (textarea) {
                textarea.value = commentText
                textarea.focus()

                const inputEvent = new Event('input', { bubbles: true })
                textarea.dispatchEvent(inputEvent)
                resolve(true)
            } else {
                setTimeout(() => tryPopulate(attempts + 1), 200)
            }
        }

        tryPopulate()
    })
}
