export const querySelectors = {
    // Oracle Cloud UI Elements
    commentOption: ['#insertComment', '#editComment'],
    saveBtn: ['button[aria-label=Save]'],
    commentView: ['.oj-sp-create-edit-drawer-template-main-container'],
    commentTextarea: ['textarea'],
    banner: ['div:has(>table[role=presentation])', '.oj-sp-banner-container.oj-sp-banner-layout.oj-private-scale-lg.oj-sp-common-banner-content-layout'],

    // Oracle JET Data Grid
    timecardDatagridColumnHeader: ['#timecard-datagrid:columnHeader'],
    timecardDatagridDatabody: ['#timecard-datagrid:databody'],
    datagridHeaderCell: ['.oj-datagrid-header-cell'],
    datagridCell: ['.oj-datagrid-cell'],

    // Azure DevOps Dialog
    devopsDialog: ['.devops-dialog'],
    devopsBtn: ['.devops-btn'],
    closeBtn: ['.close-btn'],
    tabBtn: ['.tab-btn'],
    settingsTabBtn: ['.tab-btn:nth-child(2)'],
    tasksTab: ['[data-tab="tasks"]'],
    settingsTab: ['[data-tab="settings"]'],
    tasksContent: ['[data-content="tasks"]'],
    settingsContent: ['[data-content="settings"]'],
    tasksTableHeader: ['.tasks-table th'],
    sortableTableHeader: ['th[data-column]'],

    // Form Elements - Azure DevOps
    tasksBody: ['#tasksBody'],
    startDate: ['#startDate'],
    endDate: ['#endDate'],
    username: ['#username'],
    searchBtn: ['#searchBtn'],
    addAllBtn: ['#addAllBtn'],
    adoOrgUrl: ['#adoOrgUrl'],
    adoProject: ['#adoProject'],
    adoApiVersion: ['#adoApiVersion'],
    adoToken: ['#adoToken'],
    saveSettingsBtn: ['#saveSettingsBtn'],

    // Toolbar
    headerToolbar: ['oj-toolbar[aria-label="Header Toolbar"]'],

    // Helper function
    query: function (selectorList) {
        return selectorList.map(it => document.querySelector(it)).find(it => it);
    },
    queryFrom: function (node, selectorList) {
        return selectorList.map(it => node?.querySelector(it)).find(it => it);
    }
};
