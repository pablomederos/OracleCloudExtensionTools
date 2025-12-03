// Oracle Cloud Tools

import addStyles from './styles/dialog.js';
import removeHeader from './utils/dom.js';
import { showDevOpsDialog, initAzureDevOps } from './tasks/azure-devops-dialog.js';

addStyles();
removeHeader();

let ctrlBtnPressed = false;
let ctrlKeyCode = 0;
let shiftBtnPressed = false;
let shiftKeyCode = 0;
let altBtnPressed = false;
let altKeyCode = 0;
let actionkeyPressedCode = 0;

const commands = {
    createComment: "true,false,true,67", // Ctrl + Alt + c
    showDevOpsDialog: "true,false,false,68", // Ctrl + d
    saveTimeCard: "true,false,false,83" // Ctrl + s
};

const commandValues = Object.values(commands);

const querySelectors = {
    commentOption: ['#insertComment', '#editComment'],
    saveBtn: ['button[aria-label=Save]'],
    commentView: ['.oj-sp-create-edit-drawer-template-main-container'],
    query: function (selectorList) { return selectorList.map(it => document.querySelector(it)).find(it => it) },
};

const pages = {
    timecardsPage: '/fscmUI/redwood/time/timecards/landing-page'
};

initListeners();

function initListeners() {
    // Initialize Azure DevOps integration (if enabled)
    // Config is injected by loader.js as window.ORACLE_TOOLS_CONFIG
    if (window.ORACLE_TOOLS_CONFIG?.azureDevOps) {
        initAzureDevOps();
    }

    // Register key pressed
    document.addEventListener('keydown', onKeyDown);

    // Clear key pressed
    document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(ev) {
    // Ignore with class name
    if (
        [
            'control-group'
        ].some(it => ev.target.classList.contains('it'))
    ) return;

    // Enable
    ctrlBtnPressed = ctrlBtnPressed || ev.ctrlKey;
    shiftBtnPressed = shiftBtnPressed || ev.shiftKey;
    altBtnPressed = altBtnPressed || ev.altKey;

    // Save Keycode
    if (!ctrlKeyCode && ev.ctrlKey) ctrlKeyCode = ev.keyCode;

    if (!shiftKeyCode && ev.shiftKey) shiftKeyCode = ev.keyCode;

    if (!altKeyCode && ev.altKey) altKeyCode = ev.keyCode;

    // Register other keys
    if (
        ![ctrlKeyCode, shiftKeyCode, altKeyCode]
            .some(it => it === ev.keyCode)
    ) actionkeyPressedCode = parseInt(ev.keyCode);

    // Check if this is a script command
    if (isScriptCommand()) {
        // Prevent browser default behavior for our commands
        ev.preventDefault();
        checkCommand();
    }
    // Otherwise, let browser handle it normally (Ctrl+C, Ctrl+V, etc.)
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

function isScriptCommand() {
    const keyCombinations = [
        ctrlBtnPressed, shiftBtnPressed, altBtnPressed, // alter keys
        actionkeyPressedCode, // action key
        window.location.pathname // context
    ].join(',');

    // Check if it matches any of our defined commands
    const scriptCommands = [
        `${commands.createComment},${pages.timecardsPage}`,
        `${commands.showDevOpsDialog},${pages.timecardsPage}`,
        `${commands.saveTimeCard},${pages.timecardsPage}`
    ];

    return scriptCommands.includes(keyCombinations);
}

function checkCommand() {

    const keyCombinations = [
        ctrlBtnPressed, shiftBtnPressed, altBtnPressed, // alter keys
        actionkeyPressedCode, // action key
        window.location.pathname // context
    ].join(',');


    switch (keyCombinations) {
        case `${commands.createComment},${pages.timecardsPage}`:
            createCommentCommand();
            break;
        case `${commands.showDevOpsDialog},${pages.timecardsPage}`:
            // Only show if Azure DevOps is enabled
            if (window.ORACLE_TOOLS_CONFIG?.azureDevOps) {
                showDevOpsDialog();
            }
            break;
        case `${commands.saveTimeCard},${pages.timecardsPage}`:
            saveTimecard();
            break;
    }
}

let commentTriggered = false;

function clearCommands() {
    commentTriggered = false;
}

function createCommentCommand() {
    if (commentTriggered) return;
    commentTriggered = true;

    let focusedElement = document.activeElement;
    if (focusedElement.tagName != 'DIV')
        focusedElement = focusedElement.parentElement;

    if (focusedElement?.tagName != 'DIV') return;

    if (focusedElement?.dispatchEvent(
        new MouseEvent('contextmenu', {
            bubbles: true
        })
    )) openInsertCommentWindow();
}

function openInsertCommentWindow() {
    let commentBtn = querySelectors.query(querySelectors.commentOption);
    if (commentBtn) {
        commentBtn.click();
        return;
    }

    let intervalCount = 0;
    const searchBtnInterval = setInterval(() => {
        commentBtn = querySelectors.query(querySelectors.commentOption);
        if (commentBtn) {
            commentBtn.click();
            intervalCount = 0;
            clearInterval(searchBtnInterval);

            let commentView = querySelectors.query(querySelectors.commentView);
            commentView?.querySelector('textarea')?.focus();
            if (!commentView) {
                const commentInputInterval = setInterval(() => {
                    commentView = querySelectors.query(querySelectors.commentView);
                    if (commentView) {
                        clearInterval(commentInputInterval);
                        commentView.querySelector('textarea')?.focus();
                        return;
                    }
                    intervalCount++;
                    if (intervalCount > 5) clearInterval(commentInputInterval);
                }, 300);
            }
        } else {
            intervalCount++;
            if (intervalCount > 10) clearInterval(searchBtnInterval);
        }
    }, 200);
}

function saveTimecard() {
    const saveBtn = querySelectors.query(querySelectors.saveBtn);
    if (saveBtn) saveBtn.click();
}
