$(document).ready(function() {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        initialize()
    }
})

let selectedRowId = null;
let dialog = null;
let resultData = []
const token = getAuthToken()
function initialize() {
    // get user history
    const request = makeRequestWithToken('/api/admin/logs/users', 'GET')
    if (request) {
        request.done(data => {
            $('.total-users p').html(data.total)
            $('.today-users p').html(data.todayUsers)
            $('.today-active-users p').html(data.todayActive)
        })
        .fail(xhr => {
            errorHandler(xhr)
        })
    }

    const totalRequest = makeRequestWithToken('/api/admin/logs/totals', 'GET')
    if (totalRequest) {
        totalRequest.done(data => {
            data.forEach(item => {
                const key = Object.keys(item)[0]
                $(`.total .${key} p`).html(item[key])
            })
        })
        .fail(xhr => {
            errorHandler(xhr)
        })
    }
}
