// Styles for Oracle Cloud DevOps Extension

export default function addStyles() {
    const style = document.createElement('style')
    style.textContent = `
            * {
                --PRIMARY-COLOR: #cc1f20;
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
                background: rgba(0, 0, 0, 0.4);
            }
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: var(--PRIMARY-COLOR);
                color: white;
                border-bottom: 1px solid #eee;
            }
            .dialog-header h2 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
            }
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .close-btn:hover {
                opacity: 0.8;
            }
            .dialog-body {
                padding: 20px;
                background: #fff;
            }
            .controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .control-group label {
                font-size: 0.85rem;
                color: #666;
                font-weight: 500;
            }
            .control-group input {
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 3px;
                font-size: 0.9rem;
            }
            .control-group input:focus {
                border-color: var(--PRIMARY-COLOR);
                outline: none;
            }
            .btn-primary {
                background-color: var(--PRIMARY-COLOR);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            .btn-primary:hover {
                background-color: var(--PRIMARY-COLOR);
            }
            .btn-primary:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            .btn-secondary {
                background-color: #fff;
                color: #333;
                border: 1px solid #ccc;
                padding: 8px 16px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 500;
            }
            .btn-secondary:hover {
                background-color: #f8f9fa;
                border-color: #bbb;
            }
            .tasks-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #eee;
                border-radius: 4px;
            }
            .tasks-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            .tasks-table th {
                background-color: #f1f1f1;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #333;
                position: sticky;
                top: 0;
                border-bottom: 2px solid #ddd;
            }
            .tasks-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #eee;
                color: #444;
            }
            .tasks-table tr:hover {
                background-color: #fdfdfd;
            }
            .task-row-alt {
                background-color: #f9f9f9;
            }
            .action-btn {
                background-color: #fff;
                color: var(--PRIMARY-COLOR);
                border: 1px solid var(--PRIMARY-COLOR);
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            .action-btn:hover {
                background-color: var(--PRIMARY-COLOR);
                color: white;
            }
            .footer-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding-top: 15px;
                border-top: 1px solid #eee;
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
