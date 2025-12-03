// Oracle Cloud Tools
// Main application logic

import addStyles from './styles/dialog.js';
import removeHeader from './utils/dom.js';
import { showDevOpsDialog, initAzureDevOps } from './tasks/azure-devops-dialog.js';

// Execute utilities immediately
addStyles();
removeHeader();

// Global variables for keyboard shortcuts
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

// Init listeners
initListeners();

function initListeners() {
    // Initialize Azure DevOps integration
    initAzureDevOps();

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

    // Prevent write on command
    if (isAlterKeyPressed() && isWellKnownAction()) {
        ev.preventDefault();
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
    ].join(',');

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
    ].join(',');


    switch (keyCombinations) {
        case `${commands.createComment},${pages.timecardsPage}`:
            createCommentCommand();
            break;
        case `${commands.showDevOpsDialog},${pages.timecardsPage}`:
            showDevOpsDialog();
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
