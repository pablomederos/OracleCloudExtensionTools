import { querySelectors } from '../utils/selectors.js'
import { STORAGE_KEYS, BUTTON_CLASSES } from '../utils/constants.js'
import { getTemplatesDialogTemplate } from './templates/index.js'

export const showTemplatesDialog = async () => {
    try {
        let dialog = document.querySelector('.templates-dialog')
        if (!dialog) {
            dialog = await createTemplatesDialog()
            document.body.appendChild(dialog)
        }

        dialog.showModal()
        renderTemplatesList(dialog)
    } catch (e) { console.error('Error showing templates dialog:', e) }
}

const createTemplatesDialog = async () => {
    const dialog = document.createElement('dialog')
    dialog.classList.add('devops-dialog', 'templates-dialog')
    dialog.style.width = '800px';
    dialog.style.maxWidth = '90vw';

    dialog.innerHTML = await getTemplatesDialogTemplate()

    const closeBtn = dialog.querySelector('.close-btn')
    closeBtn.onclick = () => dialog.close()

    setupEventListeners(dialog)

    return dialog
}

const setupEventListeners = (dialog) => {
    const addTemplateBtn = dialog.querySelector('#addTemplateBtn')
    const cancelTemplateBtn = dialog.querySelector('#cancelTemplateBtn')
    const saveTemplateBtn = dialog.querySelector('#saveTemplateBtn')
    const editorPanel = dialog.querySelector('#editorPanel')
    const emptyState = dialog.querySelector('#emptyState')


    addTemplateBtn.classList.add(...BUTTON_CLASSES)
    saveTemplateBtn.classList.add(...BUTTON_CLASSES)

    addTemplateBtn.onclick = () => {
        resetEditor(dialog)
        editorPanel.style.display = 'flex'
        emptyState.style.display = 'none'
        dialog.querySelector('#templateTitle').focus()
    }

    cancelTemplateBtn.onclick = () => {
        editorPanel.style.display = 'none'
        emptyState.style.display = 'flex'
        resetEditor(dialog)
    }

    saveTemplateBtn.onclick = () => {
        saveTemplate(dialog)
    }
}

const getTemplates = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.LOCAL.TEMPLATES)
    return stored ? JSON.parse(stored) : []
}

const saveTemplates = (templates) => {
    localStorage.setItem(STORAGE_KEYS.LOCAL.TEMPLATES, JSON.stringify(templates))
}

const renderTemplatesList = (dialog) => {
    const listContainer = dialog.querySelector('#templatesList')
    listContainer.innerHTML = ''

    const templates = getTemplates()

    templates.forEach((template, index) => {
        const item = document.createElement('div')
        item.style.padding = '10px'
        item.style.borderBottom = '1px solid #eee'
        item.style.cursor = 'pointer'
        item.style.display = 'flex'
        item.style.justifyContent = 'space-between'
        item.style.alignItems = 'center'
        item.onmouseenter = () => item.style.backgroundColor = '#f9f9f9'
        item.onmouseleave = () => item.style.backgroundColor = 'transparent'

        const titleSpan = document.createElement('span')
        titleSpan.textContent = template.title
        titleSpan.style.fontWeight = '500'
        titleSpan.onclick = () => loadTemplateForEditing(dialog, index)

        const actionsDiv = document.createElement('div')
        actionsDiv.style.display = 'flex'
        actionsDiv.style.gap = '5px'

        const useBtn = document.createElement('button')
        useBtn.textContent = '📋'
        useBtn.title = 'Use Template'
        useBtn.className = 'action-btn'
        useBtn.onclick = (e) => {
            e.stopPropagation()
            useTemplate(template.content, dialog)
        }

        const deleteBtn = document.createElement('button')
        deleteBtn.textContent = '🗑️'
        deleteBtn.title = 'Delete'
        deleteBtn.className = 'action-btn'
        deleteBtn.style.color = '#d9534f'
        deleteBtn.onclick = (e) => {
            e.stopPropagation()
            if (confirm('Delete this template?')) {
                deleteTemplate(index, dialog)
            }
        }

        actionsDiv.appendChild(useBtn)
        actionsDiv.appendChild(deleteBtn)

        item.appendChild(titleSpan)
        item.appendChild(actionsDiv)

        listContainer.appendChild(item)
    })
}

const loadTemplateForEditing = (dialog, index) => {
    const templates = getTemplates()
    const template = templates[index]

    dialog.querySelector('#templateTitle').value = template.title
    dialog.querySelector('#templateContent').value = template.content
    dialog.dataset.editingIndex = index

    dialog.querySelector('#editorPanel').style.display = 'flex'
    dialog.querySelector('#emptyState').style.display = 'none'
    dialog.querySelector('#editorTitle').textContent = 'Edit Template'
}

const resetEditor = (dialog) => {
    dialog.querySelector('#templateTitle').value = ''
    dialog.querySelector('#templateContent').value = ''
    delete dialog.dataset.editingIndex
    dialog.querySelector('#editorTitle').textContent = 'New Template'
}

const saveTemplate = (dialog) => {
    const title = dialog.querySelector('#templateTitle').value.trim()
    const content = dialog.querySelector('#templateContent').value.trim()

    if (!title || !content) {
        alert('Please fill both title and content.')
        return
    }

    const templates = getTemplates()
    const editingIndex = dialog.dataset.editingIndex

    if (editingIndex !== undefined) {
        templates[editingIndex] = { title, content }
    } else {
        templates.push({ title, content })
    }

    saveTemplates(templates)
    renderTemplatesList(dialog)
    dialog.querySelector('#cancelTemplateBtn').click()
}

const deleteTemplate = (index, dialog) => {
    const templates = getTemplates()
    templates.splice(index, 1)
    saveTemplates(templates)
    renderTemplatesList(dialog)

    if (dialog.dataset.editingIndex == index) {
        dialog.querySelector('#cancelTemplateBtn').click()
    }
}

const useTemplate = (content, dialog) => {
    navigator.clipboard.writeText(content).then(() => {
        dialog.close()

        const commentView = querySelectors.query(querySelectors.commentView)
        const textarea = querySelectors.queryFrom(commentView, querySelectors.commentTextarea)

        if (textarea) {
            textarea.value = content
            textarea.focus()
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }
    })
}
