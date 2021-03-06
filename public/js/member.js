let timeRange = null;
let teamLeaders = [];
let selectedUserId = null;
let selectUser = null;
$(document).ready(function () {
    const user = getUserInfo()
    getUsersList()
    initialize(user)
    if (user.role === 'leader')
        renderTeam()
})

function getUsersList() {
    const request = makeRequestWithToken('/api/users/all?role=user', 'GET')
    if (request) {
        request.done((data) => {
            renderUsersDropdown(data.map(user => ({
                id: user._id,
                text: (user.profile && user.profile.firstName + ' ' + user.profile.lastName) || user.email
            })))
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}

function renderUsersDropdown(data) {
    $('.users-dropdown').empty()
    $('.users-dropdown').select2({
        data
    })
}

function initialize(user) {
    $('form.user-form').on('submit', function (e) {
        e.preventDefault();
    });
    const rules = {
        user: 'required',
        team: 'required'
    }
    if (user.role === 'team') {
        delete rules.team
    }
    $('form.user-form').validate({
        rules,
        submitHandler(form) {
            const data = {
                player: $('select.users-dropdown').val()
            }
            const team = user.role === 'leader'? $('select#team').val(): user._id;
            const request = makeRequestWithToken(`/api/teams/${team}/members`, 'POST', data)
            if (request) {
                request.done(() => {
                    successMsg('Saved successfuly!')
                    $('select.users-dropdown').val('').trigger('change')
                    getTeamMembers(team)
                })
                    .fail(xhr => {
                        errorHandler(xhr)
                    })
            }
        }
    })

    if (user.role === 'team') {
        getTeamMembers(user._id)
    }
    $('select#team').on('change', function() {
        const teamId = $(this).val();
        getTeamMembers(teamId)
    })

    const resultTbl = $('table#result').DataTable({
        "columns": [
            { "data": "name" },
            { "data": "delete" }
        ],
        rowId: 'id'
    })

    $('table#result tbody').on( 'click', 'td', function () {
        if ( $(this).parent().hasClass('selected') ) {
            $(this).parent().removeClass('selected');
        }
        else {
            resultTbl.$('tr.selected').removeClass('selected');
            $(this).parent().addClass('selected');            
        }
        const cellIndex = resultTbl.cell(this).index()
        const id = resultTbl.row(this).id()
        if (cellIndex.column == 1) { // delete row
            deleteRow(id)
        }
    });
}

function renderTeam() {
    const user = getUserInfo()
    const request = makeRequestWithToken('/api/users/all?role=team&creator=' + user._id, 'GET')
    if (request) {
        request.done((data) => {
            teams = data.map(user => ({
                id: user._id,
                text: (user.profile && user.profile.firstName + ' ' + user.profile.lastName) || user.email
            }))
            $('select#team').empty()
            $('select#team').select2({
                data: teams
            })

            if (teams.length > 0) {
                $('select#team').val(teams[0].id).trigger('change')
            }
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}

function getTeamMembers(teamId) {
    const request = makeRequestWithToken(`/api/teams/${teamId}/members`, 'GET')
    if (request) {
        request.done((data) => {
            renderTable(data)
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}

function renderTable(team) {
    const resultTbl = $('table#result').DataTable()
    resultTbl.clear().rows.add(team.map(item => ({
        'id': item.id,
        'name': item.name,
        'delete': '<i class="fa fa-times-circle"></i>'
    }))).draw()    
}

function deleteRow(rowId) {
    const user = getUserInfo()
    const team = user.role === 'leader'? $('select#team').val(): user._id
    const request = makeRequestWithToken(`/api/teams/${team}/members`, 'DELETE', {player: rowId})
    if (request) {
        request.done(user => {
            const resultTbl = $('table#result').DataTable()
            resultTbl.row('.selected').remove().draw( false );
        })
        .fail(xhr => {
            errorHandler(xhr)
        })
    }
}