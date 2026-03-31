export const injectFilterStyles = () => {
    if (document.getElementById('comments-filter-styles')) return

    const style = document.createElement('style')
    style.id = 'comments-filter-styles'
    style.textContent = `
        .comments-day-filter {
            position: relative;
        }
        .comments-day-wrapper {
            width: 200px;
            position: relative;
        }
        .comments-day-wrapper button {
            width: 100%;
        }
        .comments-day-menu {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            z-index: 1000;
            display: none;
            background-color: var(--oj-core-bg-color-content, #ffffff);
            border: 1px solid var(--oj-core-border-color-enabled, #dce1e4);
            border-radius: var(--oj-core-border-radius-md, 4px);
            box-shadow: var(--oj-core-box-shadow-md, 0 4px 8px rgba(0,0,0,0.1));
            padding: 4px 0;
        }
        .comments-menu-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
        }
        .comments-menu-item:hover {
            background-color: var(--oj-core-bg-color-hover, #f0f0f0);
        }
    `
    document.head.appendChild(style)
}
