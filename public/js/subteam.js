let timeRange = null;
let teamLeaders = [];
let selectedUserId = null;

$(document).ready(function () {
    getSportsData()
        .then(data => {
            $('.sports-dropdown').html(renderDropdown(data.map(item => ({
                id: item._id,
                title: item.name
            }))))
            $('.sports-dropdown').select2()
        })
        .catch(error => {
            if (error.status == 401) {
                logout()
            }
        })
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        /** leader */
        const request = makeRequestWithToken('/api/users/all?role=leader', 'GET')
        if (request) {
            request.done((data) => {
                teamLeaders = data.map(user => ({
                    id: user._id,
                    title: user.profile.firstName + ' ' + user.profile.lastName
                }))
                $('#leader').html(renderDropdown(teamLeaders))
                $('#leader').select2()
                initialize(user)
            })
                .fail(xhr => {
                    errorHandler(xhr)
                })
        }
    } else {
        initialize(user)
    }
})

function initialize(user) {
    // image drop zone
    const myDropzone = $("div#team-img").dropzone({
        url: "/api/image",
        paramName: 'image',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        sending: (file, xhr, formData) => {
            setTimeout(() => {
                const imagedata = $('.image-preview .dz-image img').attr('src');
                $('#team-img').css('background', `url("${imagedata}")`)
            }, 10)
        },
        success: (res) => {
            const result = JSON.parse(res.xhr.response)
            $('#image-url').val(result.imageUrl)            
        }
    });    

    timeRange = new PlayTimeComponent('div#training-time')
    timeRange.render()

    $('form.add-team').on('submit', function (e) {
        e.preventDefault();
    });
    const rules = {
        // simple rule, converted to {required:true}
        name: 'required',
        location: 'required',
        description: 'required',
        email: {
            required: true,
            email: true
        },
        sports: 'required',
        leader: 'required'
    }
    if (user.role != 'admin') {
        delete rules.leader
    }

    $('form.add-team').validate({
        rules,
        submitHandler(form) {
            const password = $('input[name="password"]').val()
            if (!selectedUserId && password == '') {
                return errorMsg('Please type a password.')
            }
            const leader = user.role != 'admin' ? user._id : $('select[name="leader"]').val();
            const address = $('input[name="location"]').val();
            getGeoLocation(address)
                .then(location => {
                    const name = $('input[name="name"]').val().split(' ')
                    const data = {
                        email: $('input[name="email"]').val(),
                        firstName: name[0],
                        lastName: name.length > 0 ? name.slice(1).join(' ') : ' ',
                        sports: $('select[name="sports"]').val(),
                        leader,
                        password,
                        imageUrl: $('input[name="imageUrl"]').val(),
                        role: 'team',
                        availability: timeRange.getValue(),
                        location,
                        bio: {
                            description: $('input[name="description"]').val()
                        }
                    }
                    const request = selectedUserId ? makeRequestWithToken('/api/users/' + selectedUserId, 'PATCH', data) : makeRequestWithToken('/api/users', 'POST', data)
                    if (request) {
                        request.done(() => {
                            successMsg('Saved successfuly!')
                            displayTable()
                            selectRow(null)
                        })
                            .fail(xhr => {
                                errorHandler(xhr)
                            })
                    }
                })
        }
    })

    const tblOption = {
        "columns": [
            { "data": "name" },
            {
                "data": "leader",
                render: function (data, type, row) {
                    const leader = teamLeaders.find(leader => (leader.id == data))
                    return leader ? leader.title : 'Unknown User';
                }
            },
            { "data": "edit" },
            { "data": "delete" }
        ],
        rowId: 'id'
    }

    if (user.role != 'admin') {
        tblOption.columns = tblOption.columns.slice(0, 1).concat(tblOption.columns.slice(2))
    }

    const resultTbl = $('table#result').DataTable(tblOption)

    displayTable()

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
        const deleteIndex = user.role === 'admin' ? 3 : 2;
        if (cellIndex.column == deleteIndex) { // delete row
            deleteRow(id)
        } else {
            selectRow(id)
        }
    });

    // init select dropdown
    
}

function displayTable() {
    const request = makeRequestWithToken('/api/users/all?role=team', 'GET')
    if (request) {
        request.done(data => {
            renderTable(data)
            selectRow(null)
        })
            .fail(xhr => {
                errorHandler(xhr)
            })
    }
}

function renderTable(data) {
    const resultTbl = $('table#result').DataTable()
    const tableData = []
    data.forEach(user => {
        if (user.profile) {
            tableData.push({
                id: user._id,
                name: `${user.profile.firstName} ${user.profile.lastName}`,
                leader: user.creator
            })
        }
    })
    resultTbl.clear().rows.add(tableData.map(item => ({
        'id': item.id,
        'name': item.name,
        'leader': item.leader,
        'edit': '<i class="fa fa-pencil"></i>',
        'delete': '<i class="fa fa-times-circle"></i>'
    }))).draw()
}

function selectRow(userId, pwFlag = false) {
    selectedUserId = userId
    if (userId) {
        const request = makeRequestWithToken('/api/users/' + userId, 'GET')
        if (request) {
            request.done(user => {
                $('input[name="email"]').val(user.email || '')
                $('input[name="phone"]').val(user.phone || '')
                $('select[name="leader"]').val(user.creator || '').trigger('change')
                if (user.profile) {
                    $('input[name="name"]').val(user.profile.firstName + ' ' + user.profile.lastName || '')
                    $('select[name="sports"]').val(user.profile.sports[0] || '').trigger('change')
                    $('input[name="location"]').val((user.profile.location && user.profile.location.address) || '')
                    $('input[name="description"]').val((user.profile.bio && user.profile.bio.description) || '')
                    $('input[name="imageUrl"]').val(user.profile.imageUrl)
                    // $('#team-img img').attr('src', user.profile.imageUrl)
                    if (user.profile.imageUrl)
                        $('#team-img').css('background', `url(${user.profile.imageUrl})`)
                    if (user.availability) {
                        timeRange.setValue(user.availability)
                    } else {
                        timeRange.initValue()
                    }
                }

            })
                .fail(xhr => {
                    errorHandler(xhr)
                })
        }
    } else {
        $('input[name="email"]').val('')
        $('input[name="location"]').val('')
        $('input[name="description"]').val('')
        $('input[name="name"]').val('')
        $('select[name="sports"]').val('').trigger('change')
        $('input[name="imageUrl"]').val('')
        $('#team-img').attr('background', 'none')
        $('select[name="leader"]').val('').trigger('change')
        timeRange.initValue()
    }
    $('input[name="password"]').val('')
}

function deleteRow(rowId) {
    const request = makeRequestWithToken('/api/users/' + rowId, 'DELETE')
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

function generatePassword() {
    $('input[name="password"]').val($.passGen())
}