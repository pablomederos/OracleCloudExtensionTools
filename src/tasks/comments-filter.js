import { querySelectors } from '../utils/selectors.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const createFilterHTML = () => {
    const container = document.createElement('div')
    container.className = 'oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-margin-2x-top'
    container.id = 'commentsDayFilter'

    // All button
    const allBtn = document.createElement('button')
    allBtn.textContent = 'All'
    allBtn.className = 'oj-button-sm oj-button oj-component oj-enabled oj-default oj-button-full-chrome oj-complete oj-active'
    allBtn.onclick = () => filterComments('All')
    container.appendChild(allBtn)

    // Day buttons
    DAYS.forEach(day => {
        const btn = document.createElement('button')
        btn.textContent = day
        btn.className = 'oj-button-sm oj-button oj-component oj-enabled oj-default oj-button-outlined-chrome oj-complete'
        btn.style.marginLeft = '5px'
        btn.onclick = () => filterComments(day)
        container.appendChild(btn)
    })

    return container
}

const filterComments = (day) => {
    const comments = querySelectors.queryFrom(document, querySelectors.commentItems) || []
    // querySelectors.queryFrom returns a single element if find(it => it) is used, but commentItems is likely meant to be a list for this specific usage if we want all.
    // However, selectors.js definitions are designed for querySelector (single).
    // Use document.querySelectorAll for the list items.
    // Wait, let's look at selectors.js again. item 12: commentItems: ['#currentComments li'].
    // querySelectors.query uses document.querySelector.
    // We need all li.

    const commentList = document.querySelectorAll(querySelectors.commentItems[0])

    commentList.forEach(li => {
        // Remove hidden class if present (from "All" logic or reset)
        li.classList.remove('hidden')

        if (day === 'All') return

        const dateElement = querySelectors.queryFrom(li, querySelectors.commentDate)
        if (dateElement) {
            const dateText = dateElement.textContent.trim() // e.g., "Mon,Jan 12"
            if (!dateText.startsWith(day)) {
                li.classList.add('hidden')
            }
        }
    })

    // Update button styles
    const buttons = document.querySelectorAll('#commentsDayFilter button')
    buttons.forEach(btn => {
        if (btn.textContent === day) {
            btn.classList.remove('oj-button-outlined-chrome')
            btn.classList.add('oj-button-full-chrome')
        } else {
            btn.classList.remove('oj-button-full-chrome')
            btn.classList.add('oj-button-outlined-chrome')
        }
    })
}

const injectFilterUI = () => {
    // Check if already injected
    if (document.getElementById('commentsDayFilter')) return

    const header = querySelectors.query(querySelectors.commentsDrawerHeader)
    if (header) {
        header.parentElement.insertBefore(createFilterHTML(), header.nextSibling)
    }
}

const handleViewCommentsClick = () => {
    // Wait for drawer to open
    const checkDrawer = setInterval(() => {
        const header = querySelectors.query(querySelectors.commentsDrawerHeader)
        if (header) {
            clearInterval(checkDrawer)
            injectFilterUI()
        }
    }, 500)

    // Safety timeout
    setTimeout(() => clearInterval(checkDrawer), 10000)
}

let pollingInterval = null

export const initCommentsFilter = () => {
    // Stop any existing polling
    if (pollingInterval) clearInterval(pollingInterval)

    const pollBtn = () => {
        const btn = querySelectors.query(querySelectors.viewCommentsBtn)
        if (btn && !btn.dataset.hasFilterListener) {
            btn.addEventListener('click', handleViewCommentsClick)
            btn.dataset.hasFilterListener = 'true'
            clearInterval(pollingInterval)
        }
    }

    // Start polling
    pollingInterval = setInterval(pollBtn, 1000)
}
