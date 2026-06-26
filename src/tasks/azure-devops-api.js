const FIELD_KEYS = {
    ID: 'System.Id',
    TITLE: 'System.Title',
    DESCRIPTION: 'System.Description',
    CHANGED_DATE: 'System.ChangedDate',
    STATE: 'System.State',
    WORK_ITEM_TYPE: 'System.WorkItemType',
    TEAM_PROJECT: 'System.TeamProject',
    ASSIGNED_TO: 'System.AssignedTo',
    ORIGINAL_ESTIMATE: 'Microsoft.VSTS.Scheduling.OriginalEstimate'
}

export const ADO_CONFIG = {
    orgUrl: localStorage.getItem('ado_orgUrl') || '',
    project: localStorage.getItem('ado_project') || '',
    apiVersion: localStorage.getItem('ado_apiVersion') || ''
}

export const getAuthHeader = () => {
    const storedToken = localStorage.getItem('devops_token')
    if (!storedToken) {
        alert('Azure DevOps Token not found. Please set it.')
        return null
    }

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
    AND [${FIELD_KEYS.ASSIGNED_TO}] = '${username}'
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

const isEmpty = (ids) => !ids || ids.length === 0

const fetchWorkItemComments = async (workItemId) => {
    const authHeader = getAuthHeader()
    if (!authHeader) return []

    const url = `${ADO_CONFIG.orgUrl}/${ADO_CONFIG.project}/_apis/wit/workItems/${workItemId}/comments?api-version=${ADO_CONFIG.apiVersion}&$top=2`

    try {
        const response = await fetch(url, {
            headers: authHeader
        })

        if (!response.ok) {
            const text = await response.text()
            console.error(`Comments Error for work item ${workItemId}:`, response.status, response.statusText, text)
            return []
        }

        const data = await response.json()
        const comments = Array.isArray(data.comments) ? data.comments.slice(0, 2) : []

        return comments.map(comment => ({
            id: comment.id,
            text: comment.text || '',
            revisedBy: comment.revisedBy || null,
            revisedDate: comment.revisedDate || null
        }))
    } catch (error) {
        console.error(`Error fetching comments for work item ${workItemId}:`, error)
        return []
    }
}

export const fetchWorkItemDetails = async (ids) => {
    if (isEmpty(ids)) return []

    const fields = [
        FIELD_KEYS.ID,
        FIELD_KEYS.TITLE,
        FIELD_KEYS.DESCRIPTION,
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
        const workItems = Array.isArray(data.value) ? data.value : []

        return await Promise.all(workItems.map(async (item) => {
            const comments = await fetchWorkItemComments(item.id)
            return {
                ...item,
                comments
            }
        }))
    } catch (error) {
        console.error('Error fetching details:', error)
        return []
    }
}
