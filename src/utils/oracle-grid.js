import { querySelectors } from './selectors.js'
import { MESSAGES, UI_TEXT, STORAGE_KEYS, FIELD_KEYS } from './constants.js'
import { createCommentCommand, populateCommentTextarea } from '../app.js'
import { waitForEditorHost, simulateTypingAndCommit } from './dom.js'

export const findFirstEmptyCellByDate = (isoDateString) => {
    const dateObj = new Date(isoDateString)

    if (isNaN(dateObj.getTime())) return null

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const dayName = dayNames[dateObj.getUTCDay()]
    const monthName = monthNames[dateObj.getUTCMonth()]
    const dayNumber = String(dateObj.getUTCDate()).padStart(2, '0')

    const targetHeaderValidString = `${dayName},${monthName} ${dayNumber}`

    const headerContainer = document.getElementById(querySelectors.timecardDatagridColumnHeader[0].replace('#', ''))
    if (!headerContainer) return null

    const headerCells = Array.from(headerContainer.querySelectorAll(querySelectors.datagridHeaderCell[0]))

    const matchingHeader = headerCells.find(cell => cell.innerText.trim() === targetHeaderValidString)

    if (!matchingHeader) return null

    const targetLeftPos = matchingHeader.style.left

    const dataBody = document.getElementById(querySelectors.timecardDatagridDatabody[0].replace('#', ''))
    if (!dataBody) return null

    const allCells = Array.from(dataBody.querySelectorAll(querySelectors.datagridCell[0]))

    const columnCells = allCells.filter(cell => cell.style.left === targetLeftPos)

    columnCells.sort((a, b) => {
        const topA = parseFloat(a.style.top || 0)
        const topB = parseFloat(b.style.top || 0)
        return topA - topB
    })

    for (let cell of columnCells) {
        const textContent = cell.innerText.trim()
        const inputElement = querySelectors.queryFrom(cell, querySelectors.input)
        const inputValue = inputElement ? inputElement.value : ""

        const isEmpty = (textContent === "" && inputValue === "")

        if (isEmpty) return cell
    }

    return null
}

export const processTaskInsertion = (task) => {
    const taskDate = task.fields[FIELD_KEYS.CHANGED_DATE]
    const originalEstimate = task.fields[FIELD_KEYS.ORIGINAL_ESTIMATE] || ''
    const taskId = task.fields[FIELD_KEYS.ID]
    const taskTitle = task.fields[FIELD_KEYS.TITLE]

    setTimeout(() => {
        const emptyCell = findFirstEmptyCellByDate(taskDate)

        if (emptyCell) handleCellActivation(emptyCell, originalEstimate, taskId, taskTitle, taskDate)
    }, 300)
}

const handleCellActivation = async (emptyCell, value, taskId, taskTitle, taskDate) => {
    createCommentCommand(emptyCell)

    setTimeout(async () => {
        const commentAdded = await populateCommentTextarea(taskId, taskTitle)

        if (commentAdded) {
            const commentView = querySelectors.query(querySelectors.commentView)
            const saveBtn = querySelectors.queryFrom(commentView, querySelectors.saveBtn)
            saveBtn?.click()

            await new Promise(r => setTimeout(r, 350))

            const freshEmptyCell = findFirstEmptyCellByDate(taskDate)
            if (!freshEmptyCell) {
                alert(MESSAGES.CELL_NOT_FOUND)
                return
            }

            freshEmptyCell.focus()
            freshEmptyCell.dispatchEvent(new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 2
            }))

            const editorHost = await waitForEditorHost(freshEmptyCell, querySelectors)
            try {
                await simulateTypingAndCommit(editorHost || freshEmptyCell, value, querySelectors)
            } catch (e) { }

            await new Promise(r => setTimeout(r, 250))
            const dataBodyId = querySelectors.timecardDatagridDatabody[0].replace('#', '')
            const dataBody = document.getElementById(dataBodyId)
            const stringValue = String(value).trim()

            const cells = Array.from((dataBody || document.body).querySelectorAll(querySelectors.datagridCell[0]))
            const inserted = cells.some(c => {
                const txt = c.innerText.trim()
                const inp = querySelectors.queryFrom(c, querySelectors.input)
                const v = inp ? String(inp.value).trim() : ''
                return txt === stringValue || v === stringValue
            })

            if (inserted) {
                sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_TRUE)
            } else {
                try { document.activeElement && document.activeElement.blur && document.activeElement.blur() } catch (e) { }
                try { (dataBody || document.body).click() } catch (e) { }
                await new Promise(r => setTimeout(r, 200))
                const active = document.activeElement || freshEmptyCell
                try { active && active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true })) } catch (e) { }
                await new Promise(r => setTimeout(r, 200))

                const recheck = Array.from((dataBody || document.body).querySelectorAll(querySelectors.datagridCell[0]))
                const reinserted = recheck.some(c => {
                    const txt = c.innerText.trim()
                    const inp = querySelectors.queryFrom(c, querySelectors.input)
                    const v = inp ? String(inp.value).trim() : ''
                    return txt === stringValue || v === stringValue
                })
                if (reinserted) sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_TRUE)
            }
        } else {
            alert(MESSAGES.COMMENT_FAILED)
        }
    }, 300)
}

export const startCompletionCheck = (onSuccessCallback) => {
    sessionStorage.setItem(STORAGE_KEYS.SESSION.DATA_INSERTED, UI_TEXT.DATA_INSERTED_FALSE)

    const interval = setInterval(() => {
        const status = sessionStorage.getItem(STORAGE_KEYS.SESSION.DATA_INSERTED)

        if (status === UI_TEXT.DATA_INSERTED_TRUE) {
            clearInterval(interval)
            if (onSuccessCallback) onSuccessCallback()
        }
    }, 1000)
}
