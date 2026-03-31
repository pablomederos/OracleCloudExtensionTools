import { querySelectors } from '../utils/selectors.js'
import { injectFilterStyles } from '../styles/comments-filter.js'

let currentDayFilter = 'All'

const FILTER_TEMPLATE = `
<div class="comments-day-wrapper">
    <button aria-label="Filter Day" aria-expanded="false" aria-haspopup="true" tabindex="0" type="button" class="BaseButtonStyles_styles_base__jvi3ds0 BaseButtonStyles_styles_sizes_sm__jvi3ds2d BaseButtonStyles_styles_variants_outlined_base__jvi3dso BaseButtonStyles_styles_styled__jvi3ds1 BaseButtonStyles_styles_min__jvi3ds6 BaseButtonStyles_styles_styledOutline__jvi3ds2 BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv">
        <span class="ButtonLabelLayoutStyles_container__1g78mbna">
            <span id="filterLabel" class="ButtonLabelLayoutBaseTheme_baseTheme__1wxhc8g0 ButtonLabelLayoutStyles_base__1g78mbnb ButtonLabelLayoutVariants_multiVariantStyles_size_sm__7jj5291 ButtonLabelLayoutStyles_text__1g78mbn0 ButtonLabelLayoutStyles_startText__1g78mbn7">Day: All</span>
            <span class="ButtonLabelLayoutBaseTheme_baseTheme__1wxhc8g0 ButtonLabelLayoutStyles_base__1g78mbnb ButtonLabelLayoutVariants_multiVariantStyles_size_sm__7jj5291 ButtonLabelLayoutStyles_icon__1g78mbn4 ButtonLabelLayoutStyles_endIcon__1g78mbn6">
                <svg height="1em" width="1em" viewBox="0 0 24 24" class="IconStyle_currentColor__sdo2n67" style="font-size: 1em;"><path d="M6.35 8 5 9.739 12 16l7-6.261L17.65 8 12 13.054z" fill="currentcolor" fill-rule="evenodd"></path></svg>
            </span>
        </span>
    </button>
    <div class="oj-menu oj-component oj-complete comments-day-menu">
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="All">All</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Mon">Mon</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Tue">Tue</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Wed">Wed</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Thu">Thu</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Fri">Fri</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Sat">Sat</div>
        <div role="menuitem" class="oj-menu-item comments-menu-item" data-day="Sun">Sun</div>
    </div>
</div>
`

const createFilterContainer = () => {
    // Inject styles
    injectFilterStyles()

    const container = document.createElement('div')
    container.className = 'oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-margin-2x-top comments-day-filter'
    container.id = 'commentsDayFilter'
    
    container.innerHTML = FILTER_TEMPLATE

    // Hydration
    const wrapper = container.querySelector('.comments-day-wrapper')
    const button = wrapper.querySelector('button')
    const menu = wrapper.querySelector('.comments-day-menu')
    const label = wrapper.querySelector('#filterLabel')
    const menuItems = wrapper.querySelectorAll('.comments-menu-item')

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            menu.style.display = 'none'
            button.setAttribute('aria-expanded', 'false')
        }
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

    // Option selection
    menuItems.forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation()
            const day = item.dataset.day
            currentDayFilter = day
            label.textContent = `Day: ${day}`
            menu.style.display = 'none'
            button.setAttribute('aria-expanded', 'false')
            filterComments(day)
        }
    })

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
    if (document.getElementById('commentsDayFilter')) {
        filterComments(currentDayFilter)
        return
    }

    const header = querySelectors.query(querySelectors.commentsDrawerHeader)
    if (header) {
        header.parentElement.insertBefore(createFilterContainer(), header.nextSibling)
    }
}

let pollingInterval = null

export const initCommentsFilter = () => {
    // Stop any existing polling
    if (pollingInterval) clearInterval(pollingInterval)

    // Poll directly for the drawer to be open
    pollingInterval = setInterval(() => {
        const header = querySelectors.query(querySelectors.commentsDrawerHeader)
        if (header) {
            injectFilterUI()
        }
    }, 500)
}
