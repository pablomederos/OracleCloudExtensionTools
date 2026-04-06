
export default function addStyles() {
    const style = document.createElement('style')
    style.textContent = `
            * {
                --color-primary: #008C99; /* teal_core */
                --color-primary-dark: #006B75; /* teal_deep */
                --color-primary-light: #00AABB; /* teal_bright */
                
                --color-secondary-light: #4DC8D4; /* teal_light */
                --color-secondary-pale: #B2E8EC; /* teal_pale */
                --color-secondary-dark: #0A2540; /* navy */
                
                --color-accent-coral: #FF6B5B;
                --color-accent-gold: #F5A623;
                
                --color-neutral-white: #FFFFFF;
                --color-neutral-light: #F4F6F8; /* gray_light */
                --color-neutral-mid: #9EAAB5; /* gray_mid */
                --color-neutral-dark: #3D4D5C; /* gray_dark */
                
                --color-semantic-success: #1FA87A;
                --color-semantic-warning: #F0A500;
                --color-semantic-error: #D93025;
                --color-semantic-info: #008C99;
                
                --PRIMARY-COLOR: var(--color-primary-dark);
            }
            .hidden {
                display: none;
            }
            .devops-dialog {
                padding: 0;
                border: none;
                border-radius: 4px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                max-width: 90vw;
                width: 80%;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .devops-dialog::backdrop {
                background: rgba(10, 37, 64, 0.4);
            }
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: var(--color-primary-dark);
                color: var(--color-neutral-white);
                border-bottom: 1px solid var(--color-neutral-mid);
            }
            .dialog-header h2 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
            }
            .close-btn {
                background: none;
                border: none;
                color: var(--color-neutral-white);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .close-btn:hover {
                opacity: 0.8;
                color: var(--color-accent-coral);
            }
            .dialog-body {
                padding: 20px;
                background: var(--color-neutral-white);
            }
            .controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
                background: var(--color-neutral-light);
                padding: 15px;
                border-radius: 4px;
                border: 1px solid var(--color-neutral-mid);
            }
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .control-group label {
                font-size: 0.85rem;
                color: var(--color-neutral-dark);
                font-weight: 500;
            }
            .control-group input, .control-group select {
                padding: 8px;
                border: 1px solid var(--color-neutral-mid);
                border-radius: 3px;
                font-size: 0.9rem;
            }
            .control-group input:focus, .control-group select:focus {
                border-color: var(--color-primary);
                outline: none;
            }
            .pat-link {
                font-size: 11px;
                margin-top: 4px;
                color: var(--color-primary);
                text-decoration: none;
                width: fit-content;
                transition: color 0.2s ease-in-out;
            }
            .pat-link:hover {
                color: var(--color-primary-dark);
                text-decoration: underline;
            }
            .btn-primary {
                background-color: var(--color-primary);
                color: var(--color-neutral-white);
                border: none;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            .btn-primary:hover {
                background-color: var(--color-primary-dark);
            }
            .btn-primary:disabled {
                background-color: var(--color-neutral-mid);
                cursor: not-allowed;
            }
            .btn-secondary {
                background-color: var(--color-neutral-white);
                color: var(--color-neutral-dark);
                border: 1px solid var(--color-neutral-mid);
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 500;
            }
            .btn-secondary:hover {
                background-color: var(--color-neutral-light);
                border-color: var(--color-primary);
                color: var(--color-primary-dark);
            }
            .tasks-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--color-neutral-mid);
                border-radius: 4px;
            }
            .tasks-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            .tasks-table th {
                background-color: var(--color-neutral-light);
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: var(--color-secondary-dark);
                position: sticky;
                top: 0;
                border-bottom: 2px solid var(--color-neutral-mid);
            }
            .tasks-table td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--color-neutral-light);
                color: var(--color-neutral-dark);
            }
            .tasks-table tr:hover {
                background-color: var(--color-secondary-pale);
            }
            .task-row-alt {
                background-color: var(--color-neutral-light);
            }
            .action-btn {
                background-color: var(--color-neutral-white);
                color: var(--color-primary);
                border: 1px solid var(--color-primary);
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            .action-btn:hover {
                background-color: var(--color-primary);
                color: var(--color-neutral-white);
            }
            .footer-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding-top: 15px;
                border-top: 1px solid var(--color-neutral-mid);
            }
            .oracle-tools-template-btn {
                background-color: transparent;
                border: 1px solid var(--color-primary);
                color: var(--color-primary);
                border-radius: 4px;
                font-weight: 600;
                transition: background-color 0.2s, color 0.2s;
            }
            .oracle-tools-template-btn:hover {
                background-color: var(--color-primary);
                color: var(--color-neutral-white);
            }

            .switch {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 20px;
                margin-left: 10px;
                vertical-align: middle;
            }
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--color-neutral-mid);
                transition: .3s;
                border-radius: 20px;
            }
            .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 2px;
                bottom: 2px;
                background-color: var(--color-neutral-white);
                transition: .3s;
                border-radius: 50%;
            }
            input:checked + .slider {
                background-color: var(--color-primary);
            }
            input:checked + .slider:before {
                transform: translateX(20px);
            }
            mark {
                background-color: var(--color-accent-gold);
                color: var(--color-secondary-dark);
                padding: 0 2px;
                border-radius: 2px;
            }
        `

    if (!window.ORACLE_TOOLS_CONFIG?.experimentalFeatures) {
        style.textContent += `
            .experimental-feature {
                display: none !important;
            }
        `
    }

    document.head.appendChild(style)
}
