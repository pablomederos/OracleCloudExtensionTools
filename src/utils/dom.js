import { querySelectors } from './selectors.js'

export const removeHeader = () => {
    const bannerCheckIntervalMs = 200
    let banner, lookForInterval = setInterval((() => {
        banner ? (clearInterval(lookForInterval), banner.remove()) : banner = querySelectors.query(querySelectors.banner)
    }), bannerCheckIntervalMs)
}

export const waitForEditorHost = (cell, querySelectors, maxAttempts = 12, interval = 100) => {
    return new Promise((resolve) => {
        let attempts = 0
        const check = () => {
            const native = querySelectors.queryFrom(cell, querySelectors.input)
            const ojHost = querySelectors.queryFrom(cell, querySelectors.ojInputComponents)
            const contentEditable = querySelectors.queryFrom(cell, querySelectors.contentEditable)
            const host = native || ojHost || contentEditable || null
            if (host) return resolve(host)
            attempts++
            if (attempts >= maxAttempts) return resolve(null)
            setTimeout(check, interval)
        }
        check()
    })
}

export const simulateTypingAndCommit = async (editorHost, text, querySelectors) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    if (!editorHost) return

    const nativeInput = (editorHost.tagName === 'INPUT') ? editorHost : (editorHost.querySelector ? querySelectors.queryFrom(editorHost, querySelectors.input) : null)
    const target = nativeInput || editorHost

    try { if (target && typeof target.focus === 'function') target.focus() } catch (e) { }

    try {
        if (nativeInput) {
            nativeInput.value = ''
            nativeInput.dispatchEvent(new Event('input', { bubbles: true }))
        } else {
            try { editorHost.value = '' } catch (e) { }
            try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: '' }, bubbles: true })) } catch (e) { }
        }
    } catch (e) { }

    const canExec = typeof document.execCommand === 'function' && document.queryCommandSupported && document.queryCommandSupported('insertText')

    for (let ch of String(text)) {
        try {
            if (canExec) {
                if (target && typeof target.focus === 'function') target.focus()
                document.execCommand('insertText', false, ch)
            } else if (nativeInput) {
                nativeInput.value += ch
                nativeInput.dispatchEvent(new InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }))
            } else {
                try { editorHost.value = (editorHost.value || '') + ch } catch (err) { }
                try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: editorHost.value || '' }, bubbles: true })) } catch (err) { }
            }
        } catch (e) { }
        await sleep(20)
    }

    try {
        if (nativeInput) nativeInput.dispatchEvent(new Event('change', { bubbles: true }))
        else editorHost.dispatchEvent(new CustomEvent('ojValueChanged', { detail: { value: text }, bubbles: true }))
    } catch (e) { }

    try {
        const makeKey = (k, kc) => new KeyboardEvent('keydown', { key: k, code: k, keyCode: kc, which: kc, bubbles: true, cancelable: true })
        target.dispatchEvent(makeKey('Enter', 13))
        target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }))
    } catch (e) { }

    try { target && target.blur && target.blur() } catch (e) { }
    try {
        const dataBodyId = querySelectors.timecardDatagridDatabody[0].replace('#', '')
        const dataBody = document.getElementById(dataBodyId) || document.body
        dataBody.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        dataBody.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        dataBody.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    } catch (e) { }

    await sleep(220)

    try { editorHost.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: text }, bubbles: true })) } catch (e) { }
    try { editorHost.dispatchEvent(new CustomEvent('ojValueUpdated', { detail: { value: text }, bubbles: true })) } catch (e) { }

    await sleep(120)
}

let commentTriggered = false

export const resetCommentTrigger = () => {
    commentTriggered = false
}

export const createCommentCommand = (cellElement) => {
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
    )) openInsertCommentWindow(querySelectors)
}

const openInsertCommentWindow = (querySelectors) => {
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

export const populateCommentTextarea = (taskId, taskTitle) => {
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
