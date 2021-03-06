$(document).ready(function() {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        getSportsData()
        .then(data => {
            $('.sports-dropdown').html(renderDropdown(data.map(item => ({
                id: item._id,
                title: item.name
            })))).select2()
        })
        .catch(error => {
            if(error.status == 401) {
                logout()
            }
        })
        initialize()
    }
})

let selectedUserId = null;
function initialize() {
    // table init
    $('form.add-leader').validate({
        rules: {
          // simple rule, converted to {required:true}
          clubname: 'required',
          email: {
              required: true,
              email: true
          },
          password: 'required',
          phone: 'required',
          sports: 'required',

        },
        submitHandler(form) {
            const clubname = $('input[name="clubname"]').val().split(' ')
            const data = {
                email: $('input[name="email"]').val(),
                firstName: clubname[0],
                lastName: clubname.length > 0? clubname.slice(1).join(' '): ' ',
                phone: $('input[name="phone"]').val(),
                sports: $('select[name="sports"]').val(),
                password: $('input[name="password"]').val(),
                role: 'leader'
            }
            const request = selectedUserId?makeRequestWithToken('/api/users/' + selectedUserId, 'PATCH', data): makeRequestWithToken('/api/users', 'POST', data)
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

        }
    })

    const resultTbl = $('table#result').DataTable({
        "columns": [
            { "data": "name" },
            { "data": "edit" },
            { "data": "change" },
            { "data": "delete" }
        ],
        rowId: 'id'
    })   

    displayTable()

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
        if (cellIndex.column == 3) { // delete row
            deleteRow(id)
        } else if (cellIndex.column == 2) { // update password
            selectRow(id, true)
        } else {
            selectRow(id)
        }
    });
}

function displayTable() {
    const request = makeRequestWithToken('/api/users/all?role=leader', 'GET')
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
                name: `${user.profile.firstName} ${user.profile.lastName}`
            })
        }
    })
    resultTbl.clear().rows.add(tableData.map(item => ({
        'id': item.id,
        'name': item.name,
        'edit': '<i class="fa fa-pencil"></i>',
        'change': '<i class="fa fa-database"></i>',
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
                $('input[name="clubname"]').val(user.profile.firstName + ' ' + user.profile.lastName || '')
                $('select[name="sports"]').val((user.profile.sports.length > 0 && user.profile.sports[0]) || '').trigger('change')
                $('input[name="password"]').val('')
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }        
    } else {
        $('input[name="email"]').val('')
        $('input[name="phone"]').val('')
        $('input[name="clubname"]').val('')
        $('select[name="sports"]').val('').trigger('change')
        $('input[name="password"]').val('')
    }   
    
    if (!userId || pwFlag) {
        $('input[name="password"]').parent('.form-group').css('display', 'block')
    } else {
        $('input[name="password"]').parent('.form-group').css('display', 'none')
    }
}

function deleteRow(rowId) {
    const request = makeRequestWithToken('/api/users/' + rowId, 'DELETE')
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

function generatePassword() {
    $('input[name="password"]').val($.passGen())
}