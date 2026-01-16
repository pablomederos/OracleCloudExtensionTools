import { querySelectors } from '../utils/selectors.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const createFilterHTML = () => {
    const container = document.createElement('div')
    container.className = 'oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-margin-2x-top'
    container.id = 'commentsDayFilter'

    const select = document.createElement('select')
    select.className = 'oj-select-one oj-component oj-enabled oj-form-control oj-complete'
    select.style.maxWidth = '200px'
    select.onchange = (e) => filterComments(e.target.value)

    const options = ['All', ...DAYS]
    options.forEach(day => {
        const option = document.createElement('option')
        option.value = day
        option.textContent = day
        select.appendChild(option)
    })

    container.appendChild(select)
    return container
}

const filterComments = (day) => {
    const commentList = document.querySelectorAll(querySelectors.commentItems[0])

    commentList.forEach(li => {
        li.classList.remove('hidden')

        if (day === 'All') return

        const dateElement = querySelectors.queryFrom(li, querySelectors.commentDate)
        if (dateElement) {
            const dateText = dateElement.textContent.trim()
            if (!dateText.startsWith(day)) {
                li.classList.add('hidden')
            }
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
