import { querySelectors } from '../utils/selectors.js'

export const initCommentTemplates = () => {
    const observer = new MutationObserver(handleMutations)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

const handleMutations = (mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            const commentView = querySelectors.query(querySelectors.commentView)
            if (commentView) {
                injectTemplateButton(commentView)
            }
        }
    }
}

const injectTemplateButton = (container) => {
    if (querySelectors.queryFrom(container, querySelectors.templateBtn)) return

    const textarea = querySelectors.queryFrom(container, querySelectors.commentTextarea)
    if (!textarea) return

    const button = document.createElement('button')
    button.textContent = 'Comment Templates'
    button.classList.add(querySelectors.templateBtn[0].replace('.', ''))
    button.style.marginTop = '10px'
    button.style.padding = '5px 10px'
    button.style.cursor = 'pointer'

    // Insert after textarea
    if (textarea.nextSibling) {
        textarea.parentNode.parentNode.insertBefore(button, textarea.nextSibling)
    } else {
        textarea.parentNode.parentNode.appendChild(button)
    }
}
