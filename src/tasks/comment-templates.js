import { querySelectors } from '../utils/selectors.js'
import { showTemplatesDialog } from './templates-dialog.js'
import { showDevOpsDialog } from './azure-devops-dialog.js'

export const initCommentTemplates = () => {
    const observer = new MutationObserver(handleMutations)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

const handleMutations = (mutations) => {
    try {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const commentView = querySelectors.query(querySelectors.commentView)
                if (commentView) injectButtons(commentView)
            }
        }
    } catch (e) { console.error('Error handling DOM mutations:', e) }
}

const injectButtons = (container) => {
    if (container.querySelector('.oracle-tools-buttons-container')) return

    const textarea = querySelectors.queryFrom(container, querySelectors.commentTextarea)
    if (!textarea) return

    const btnContainer = document.createElement('div')
    btnContainer.className = 'oracle-tools-buttons-container'
    btnContainer.style.marginTop = '10px'
    btnContainer.style.display = 'flex'
    btnContainer.style.gap = '10px'

    const templatesBtn = createButton('Comment Templates', () => showTemplatesDialog())
    const devopsBtn = createButton('Add from DevOps', () => showDevOpsDialog())

    btnContainer.appendChild(templatesBtn)
    btnContainer.appendChild(devopsBtn)

    // Insert after textarea
    if (textarea.nextSibling) {
        textarea.parentNode.parentNode.parentNode.insertBefore(btnContainer, textarea.nextSibling)
    } else {
        textarea.parentNode.parentNode.parentNode.appendChild(btnContainer)
    }
}

const createButton = (text, onClick) => {
    const button = document.createElement('button')
    button.textContent = text
    querySelectors.templateBtn.forEach(cls => {
        button.classList.add(cls.replace('.', ''))
    })
    button.style.padding = '5px 10px'
    button.style.cursor = 'pointer'

    button.onclick = (e) => {
        e.preventDefault()
        onClick()
    }
    return button
}
