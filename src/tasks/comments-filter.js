import { querySelectors } from '../utils/selectors.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const createFilterHTML = () => {
    const container = document.createElement('div')
    container.className = 'oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-margin-2x-top'
    container.id = 'commentsDayFilter'
    container.style.position = 'relative' // Needed for absolute positioning of menu

    // Wrapper for the custom element
    const wrapper = document.createElement('div')
    wrapper.style.width = '200px'
    wrapper.style.position = 'relative'

    // Custom Button HTML provided by user, adapted
    const button = document.createElement('button')
    button.setAttribute('aria-label', 'Filter Day')
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-haspopup', 'true')
    button.setAttribute('tabindex', '0')
    button.type = 'button'
    button.className = 'BaseButtonStyles_styles_base__jvi3ds0 BaseButtonStyles_styles_sizes_sm__jvi3ds2d BaseButtonStyles_styles_variants_outlined_base__jvi3dso BaseButtonStyles_styles_styled__jvi3ds1 BaseButtonStyles_styles_min__jvi3ds6 BaseButtonStyles_styles_styledOutline__jvi3ds2 BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv'
    button.style.width = '100%'

    button.innerHTML = `
        <span class="ButtonLabelLayoutStyles_container__1g78mbna">
            <span id="filterLabel" class="ButtonLabelLayoutBaseTheme_baseTheme__1wxhc8g0 ButtonLabelLayoutStyles_base__1g78mbnb ButtonLabelLayoutVariants_multiVariantStyles_size_sm__7jj5291 ButtonLabelLayoutStyles_text__1g78mbn0 ButtonLabelLayoutStyles_startText__1g78mbn7">Day: All</span>
            <span class="ButtonLabelLayoutBaseTheme_baseTheme__1wxhc8g0 ButtonLabelLayoutStyles_base__1g78mbnb ButtonLabelLayoutVariants_multiVariantStyles_size_sm__7jj5291 ButtonLabelLayoutStyles_icon__1g78mbn4 ButtonLabelLayoutStyles_endIcon__1g78mbn6">
                <svg height="1em" width="1em" viewBox="0 0 24 24" class="IconStyle_currentColor__sdo2n67" style="font-size: 1em;"><path d="M6.35 8 5 9.739 12 16l7-6.261L17.65 8 12 13.054z" fill="currentcolor" fill-rule="evenodd"></path></svg>
            </span>
        </span>
    `

    // Dropdown Menu
    const menu = document.createElement('div')
    menu.className = 'oj-menu oj-component oj-complete'
    menu.style.position = 'absolute'
    menu.style.top = '100%'
    menu.style.left = '0'
    menu.style.width = '100%'
    menu.style.zIndex = '1000'
    menu.style.display = 'none'
    menu.style.backgroundColor = 'var(--oj-core-bg-color-content, #ffffff)' // Fallback white
    menu.style.border = '1px solid var(--oj-core-border-color-enabled, #dce1e4)'
    menu.style.borderRadius = 'var(--oj-core-border-radius-md, 4px)'
    menu.style.boxShadow = 'var(--oj-core-box-shadow-md, 0 4px 8px rgba(0,0,0,0.1))'
    menu.style.padding = '4px 0'

    const options = ['All', ...DAYS]
    options.forEach(day => {
        const item = document.createElement('div')
        item.role = 'menuitem'
        item.style.padding = '8px 12px'
        item.style.cursor = 'pointer'
        item.style.fontSize = '14px'
        item.className = 'oj-menu-item'
        item.textContent = day

        // Hover effect helper
        item.onmouseenter = () => item.style.backgroundColor = 'var(--oj-core-bg-color-hover, #f0f0f0)'
        item.onmouseleave = () => item.style.backgroundColor = 'transparent'

        item.onclick = (e) => {
            e.stopPropagation()
            // Update label
            button.querySelector('#filterLabel').textContent = `Day: ${day}`
            // Close menu
            menu.style.display = 'none'
            button.setAttribute('aria-expanded', 'false')
            // Apply filter
            filterComments(day)
        }
        menu.appendChild(item)
    })

    // Toggle logic
    button.onclick = (e) => {
        e.stopPropagation()
        const isExpanded = button.getAttribute('aria-expanded') === 'true'
        if (isExpanded) {
            menu.style.display = 'none'
            button.setAttribute('aria-expanded', 'false')
        } else {
            menu.style.display = 'block'
            button.setAttribute('aria-expanded', 'true')
        }
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            menu.style.display = 'none'
            button.setAttribute('aria-expanded', 'false')
        }
    })

    wrapper.appendChild(button)
    wrapper.appendChild(menu)
    container.appendChild(wrapper)
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
