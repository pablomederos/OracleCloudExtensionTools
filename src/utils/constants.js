export const STORAGE_KEYS = {
    SESSION: {
        TASKS_CACHE: 'devops_tasks_cache',
        COMPLETE_JSON: 'devOpsCompleteJSON',
        DATA_INSERTED: 'dataAlreadyInserted',
        ROW_JSON: 'devOpsRowJSON'
    },
    LOCAL: {
        USERNAME: 'devops_username',
        TOKEN: 'devops_token',
        ORG_URL: 'ado_orgUrl',
        PROJECT: 'ado_project',
        API_VERSION: 'ado_apiVersion',
        TEMPLATES: 'comment_templates',
        FILTER_START_DATE: 'ado_filter_start_date',
        FILTER_END_DATE: 'ado_filter_end_date',
        FILTER_ENABLED: 'ado_filter_enabled'
    }
};

export const MESSAGES = {
    SELECT_DATES: 'Please select both start and end dates',
    ENTER_USERNAME: 'Please enter a username',
    NO_TASKS_FOUND: 'No tasks found for the selected range.',
    ERROR_FETCHING: 'Error fetching tasks',
    ALL_TASKS_SAVED: 'All tasks saved to sessionStorage (devOpsCompleteJSON)!',
    NO_TASKS_TO_ADD: 'No tasks to add.',
    SETTINGS_SAVED: 'Settings saved!',
    FILL_REQUIRED: 'Please fill all required fields',
    TASK_NOT_FOUND: 'Task not found in cache.',
    CELL_NOT_FOUND: 'No se pudo encontrar la celda para insertar el valor.',
    COMMENT_FAILED: 'No se pudo agregar el comentario. Intente nuevamente.'
};

export const UI_TEXT = {
    SEARCHING: 'Searching...',
    SEARCH: 'Search',
    DATA_INSERTED_TRUE: '1',
    DATA_INSERTED_FALSE: '0'
};

export const BUTTON_CLASSES = [
    'BaseButtonStyles_styles_base__jvi3ds0',
    'devops-btn',
    'BaseButtonStyles_styles_sizes_sm__jvi3ds2d',
    'BaseButtonStyles_styles_variants_outlined_base__jvi3dso',
    'BaseButtonStyles_styles_styled__jvi3ds1',
    'BaseButtonStyles_styles_styledOutline__jvi3ds2',
    'BaseButtonStyles_styles_variants_outlined_pseudohover__jvi3dsv'
];

export const BUTTON_CONFIG = {
    TEXT: 'Add from DevOps',
    BORDER_RADIUS: '5px',
    FONT_WEIGHT: '600'
};

export const FIELD_KEYS = {
    ID: 'System.Id',
    TITLE: 'System.Title',
    CHANGED_DATE: 'System.ChangedDate',
    STATE: 'System.State',
    ORIGINAL_ESTIMATE: 'Microsoft.VSTS.Scheduling.OriginalEstimate'
};
