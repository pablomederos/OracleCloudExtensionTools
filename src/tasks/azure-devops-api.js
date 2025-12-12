const FIELD_KEYS = {
    ID: 'System.Id',
    TITLE: 'System.Title',
    CHANGED_DATE: 'System.ChangedDate',
    STATE: 'System.State',
    WORK_ITEM_TYPE: 'System.WorkItemType',
    TEAM_PROJECT: 'System.TeamProject',
    CHANGED_BY: 'System.ChangedBy',
    ORIGINAL_ESTIMATE: 'Microsoft.VSTS.Scheduling.OriginalEstimate'
}

export const ADO_CONFIG = {
    orgUrl: localStorage.getItem('ado_orgUrl') || '',
    project: localStorage.getItem('ado_project') || '',
    apiVersion: localStorage.getItem('ado_apiVersion') || ''
}

export const getAuthHeader = () => {
    const storedToken = localStorage.getItem('devops_token')
    if (!storedToken) alert('Azure DevOps Token not found. Please set it.')

    const devopsToken = atob(storedToken).substring(1)

    return {
        'Authorization': 'Bearer ' + devopsToken,
        'Content-Type': 'application/json'
    }
}

export const fetchTaskIds = async (startDate, endDate, username) => {
    const query = `
    SELECT [${FIELD_KEYS.ID}]
    FROM workitems
    WHERE [${FIELD_KEYS.WORK_ITEM_TYPE}] = 'Task'
    AND [${FIELD_KEYS.TEAM_PROJECT}] = '${ADO_CONFIG.project}'
    AND [${FIELD_KEYS.CHANGED_DATE}] >= '${startDate}'
    AND [${FIELD_KEYS.CHANGED_DATE}] <= '${endDate}'
    AND [${FIELD_KEYS.CHANGED_BY}] = '${username}'
`

    const url = `${ADO_CONFIG.orgUrl}/${ADO_CONFIG.project}/_apis/wit/wiql?api-version=${ADO_CONFIG.apiVersion}`
    const authToken = getAuthHeader()

    if (!authToken) return

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: authToken,
            body: JSON.stringify({ query })
        })

        if (!response.ok) {
            const text = await response.text()
            console.error('API Error Response:', text)
            throw new Error(`WIQL Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.workItems.map(item => item.id)
    } catch (error) {
        console.error('Error fetching task IDs:', error)
        alert('Error fetching tasks. Check console for details.')
        return []
    }
}

export const fetchWorkItemDetails = async (ids) => {
    if (!ids || ids.length === 0) return []

    const fields = [
        FIELD_KEYS.ID,
        FIELD_KEYS.TITLE,
        FIELD_KEYS.CHANGED_DATE,
        FIELD_KEYS.STATE,
        FIELD_KEYS.ORIGINAL_ESTIMATE
    ].join(',')

    const url = `${ADO_CONFIG.orgUrl}/${ADO_CONFIG.project}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=${ADO_CONFIG.apiVersion}`

    try {
        const response = await fetch(url, {
            headers: getAuthHeader()
        })

        if (!response.ok) throw new Error(`Details Error: ${response.statusText}`)

        const data = await response.json()
        return data.value
    } catch (error) {
        console.error('Error fetching details:', error)
        return []
    }
}
