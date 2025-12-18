
export const SHORTCUTS = {
    createComment: {
        ctrl: true,
        shift: false,
        alt: true,
        keyCode: 67,
        key: 'C',
        label: 'Open Comments Dialog',
        description: 'Open the comment dialog for the active cell'
    },
    showDevOpsDialog: {
        ctrl: true,
        shift: false,
        alt: false,
        keyCode: 68,
        key: 'D',
        label: 'Open Azure DevOps Dialog',
        description: 'Open the Azure DevOps tasks dialog'
    },
    saveTimeCard: {
        ctrl: true,
        shift: false,
        alt: false,
        keyCode: 83,
        key: 'S',
        label: 'Save Timecard/Comment',
        description: 'Save the current timecard or comment'
    }
}

export const getShortcutDisplay = (shortcutKey) => {
    const shortcut = SHORTCUTS[shortcutKey]
    if (!shortcut) return ''

    const keys = []
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.shift) keys.push('Shift')
    if (shortcut.alt) keys.push('Alt')
    if (shortcut.key) keys.push(shortcut.key)

    return keys
}

export const matchesShortcut = (event, shortcutKey) => {
    const shortcut = SHORTCUTS[shortcutKey]
    if (!shortcut) return false

    return event.ctrlKey === shortcut.ctrl &&
        event.shiftKey === shortcut.shift &&
        event.altKey === shortcut.alt &&
        event.keyCode === shortcut.keyCode
}

export const getShortcutString = (shortcutKey) => {
    const shortcut = SHORTCUTS[shortcutKey]
    if (!shortcut) return ''

    return `${shortcut.ctrl},${shortcut.shift},${shortcut.alt},${shortcut.keyCode}`
}
