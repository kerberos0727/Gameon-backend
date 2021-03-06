let timeRange = null;
let teamLeaders = [];
let teams = [];
let selectedRow = null;
let selectedTeam = null;
let resultData = null;

$(document).ready(function () {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        /** leader */
        const request = makeRequestWithToken('/api/users/all?role=leader', 'GET')
        if (request) {
            request.done((data) => {
                teamLeaders = data.map(user => ({
                    id: user._id,
                    text: (user.profile && user.profile.firstName + ' ' + user.profile.lastName) || user.email
                }))
                renderTeamLeaders(teamLeaders)                
            })
                .fail(xhr => {
                    errorHandler(xhr)
                })
        }        
    }
    initialize(user)
})

function initialize(user) {
    $("select#leader").on('change', (event) => {
        const leader = $(event.target).val()
        renderTeam(leader)
    })

    if (user.role === 'leader') {
        renderTeam(user._id)
    }
    // image drop zone
    $("div#card-image").dropzone({
        url: "/api/image",
        paramName: 'image',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        sending: (file, xhr, formData) => {
            setTimeout(() => {
                const imagedata = $('.image-preview .dz-image img').attr('src');
                $('.image-preview').css('background', `url("${imagedata}")`)
            }, 100)
        },
        success: (res) => {
            const result = JSON.parse(res.xhr.response)
            $('#image-url').val(result.imageUrl)            
        }
    });

    timeRange = new PlayTimeComponent('div#training-time')
    timeRange.render()

    $('form.add-card').on('submit', function (e) {
        e.preventDefault();
    });

    const rules = {
        name: 'required',
        location: 'required',
        description: 'required',
        team: 'required',
        formLink: 'required'
    }
    if (user.role === 'team') {
        delete rules.team
    }

    $('form.add-card').validate({
        rules,
        submitHandler() {
            const address = $('input[name="location"]').val();
            getGeoLocation(address)
                .then(location => {
                    const creator = user.role === 'team'? user._id: $('select[name="team"]').val()
                    const data = {
                        name: $('input[name="name"]').val(),
                        creator,
                        imageUrl: $('input[name="imageUrl"]').val(),
                        availability: timeRange.getValue(),
                        location,
                        formUrl: $('input[name="formLink"]').val(),
                        description: $('input[name="description"]').val()
                    }
                    const request = selectedRow ? makeRequestWithToken('/api/cards/training/' + selectedRow, 'PATCH', data) : makeRequestWithToken('/api/cards/training', 'POST', data)
                    if (request) {
                        request.done(() => {
                            successMsg('Saved successfuly!')
                            refreshTable()
                            selectRow(null)
                        })
                            .fail(xhr => {
                                errorHandler(xhr)
                            })
                    }
                })
        }
    })

    const token = getAuthToken()
    let drawId = 0;
    let columns = [
        { "data": "name" },
        { "data": "leader" },
        { "data": 'team' },
        { "data": "edit" },
        { "data": "delete"}
    ];
    if (user.role === 'leader') {
        columns = [
            { "data": "name" },
            { "data": 'team' },
            { "data": "edit" },
            { "data": "delete"}
        ]
    } else if (user.role === 'team') {
        columns = [
            { "data": "name" },
            { "data": "edit" },
            { "data": "delete"}
        ]
    }
    const resultTbl = $('table#result').DataTable({
        "processing": true,
        'serverSide': true,
        mData: 'dataSet',
        columns,
        rowId: 'id',
        "ajax": function (data, callback, settings) {
            drawId = data.draw
            let query = 'filter=' + data.search.value;
            query += '&fields=name&page=' + data.start + 1
            query += '&limit=' + data.length;
            query += '&sort=name&order=-1&draw=' + data.draw
            $.ajax({
                "url": "/api/cards/training",
                "beforeSend": function( xhr ) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
                },
                type: 'GET',
                success: function(json) {
                    resultData = json.docs
                    const result =  {
                        draw: drawId,
                        recordsTotal: json.totalDocs,
                        recordsFiltered: json.totalDocs,
                        data: json.docs.map(doc => ({                            
                            "id": doc._id,
                            "name": doc.name,
                            "leader": doc.leader && doc.leader.name || 'Unknown Team Leader',
                            "team": doc.team && doc.team.name || 'Unknown Team',
                            "edit": '<i class="fa fa-pencil"></i>',
                            "delete": '<i class="fa fa-times-circle"></i>'                            
                        }))
                    };
                    callback(result)
                }
            })
        }
    })

    // displayTable()

    $('table#result tbody').on('click', 'td', function () {
        if ($(this).parent().hasClass('selected')) {
            $(this).parent().removeClass('selected');
        }
        else {
            resultTbl.$('tr.selected').removeClass('selected');
            $(this).parent().addClass('selected');
        }
        const cellIndex = resultTbl.cell(this).index()
        const id = resultTbl.row(this).id()
        const deleteIndex = user.role === 'admin'? 4: (user.role === 'leader'? 3: 2);
        if (cellIndex.column == deleteIndex) { // delete row
            deleteRow(id)
        } else {
            selectRow(id)
        }
    });
}

function refreshTable() {
    const resultTbl = $('table#result').DataTable()
    resultTbl.ajax.reload(null, false)
}

function selectRow(rowId, pwFlag = false) {
    selectedRow = rowId
    if (rowId) {
        if (resultData) {
            const row = resultData.find(item => (item._id == rowId));            
            if (row) {
                initValues({
                    name: row.name,
                    location: row.location.address,
                    formLink: row.formUrl,
                    imageUrl: row.imageUrl,
                    leader: row.leader.id,
                    team: row.team.id,
                    timeRange: row.availability
                })
            }
        } else {
            const request = makeRequestWithToken('/api/cards/training/' + rowId, 'GET')
            if (request) {
                request.done(row => {
                    initValues({
                        name: row.name,
                        location: row.location,
                        formLink: row.formLink,
                        imageUrl: row.imageUrl,
                        leader: row.leader.id,
                        team: row.team.id
                    })
                })
                    .fail(xhr => {
                        errorHandler(xhr)
                    })
            }
        }        
    } else {
        initValues({})
    }
}

function initValues(data) {
    selectedTeam = data.team? data.team: null;
    $('input[name="name"]').val(data.name || '')
    $('input[name="location"]').val(data.location || '')
    $('input[name="formLink"]').val(data.formLink || '')
    $('input[name="imageUrl"]').val(data.imageUrl || '')
    $('select[name="leader"]').val(data.leader || '')
    $('select[name="leader"]').trigger('change')
    $('#card-image').css('background', data.imageUrl? `url(${data.imageUrl})`: 'none')
    $('select[name="team"]').val(data.team || '').trigger('change')
    if (data.timeRange)
        timeRange.setValue(data.timeRange)
    else
        timeRange.initValue()
}

function deleteRow(rowId) {
    const request = makeRequestWithToken('/api/cards/training/' + rowId, 'DELETE')
    if (request) {
        request.done(user => {
            const resultTbl = $('table#result').DataTable()
            resultTbl.row('.selected').remove().draw(false);
            selectRow(null)
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}

function renderTeamLeaders(data) {
    $('select#leader').empty()
    $('select#leader').select2({
        data
    })
    if (data.length > 0) {
        $('select#leader').val(data[0].id).trigger('change')
    }

}

function renderTeam(leader) {
    const request = makeRequestWithToken('/api/users/all?role=team&creator=' + leader, 'GET')
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
                $('select#team').val(selectedTeam || teams[0].id).trigger('change')
            }
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}