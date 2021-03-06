$(document).ready(function() {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        initialize()
    }
})

let selectedRowId = null;
function initialize() {
    // table init
    $('form.add-leader').validate({
        rules: {
          // simple rule, converted to {required:true}
          name: 'required'
        },
        submitHandler(form) {
            const data = {
                name: $('input[name="name"]').val()
            }
            const request = selectedRowId?makeRequestWithToken('/api/university/' + selectedRowId, 'PATCH', data): makeRequestWithToken('/api/university', 'POST', data)
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
        if (cellIndex.column == 1) { // delete row
            deleteRow(id)
        } else if (cellIndex.column == 2) { // update password
            selectRow(id, true)
        } else {
            selectRow(id)
        }
    });
}

function displayTable() {
    const request = makeRequestWithToken('/api/university/all', 'GET')
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
    resultTbl.clear().rows.add(data.map(item => ({
        'id': item._id,
        'name': item.name,
        'delete': '<i class="fa fa-times-circle"></i>'
    }))).draw()    
}

function selectRow(universityId, pwFlag = false) {
    selectedRowId = universityId
    if (universityId) {
        const request = makeRequestWithToken('/api/university/' + universityId, 'GET')
        if (request) {
            request.done(user => {
                $('input[name="name"]').val(user.name || '')
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }        
    } else {
        $('input[name="name"]').val('')
    }
}

function deleteRow(rowId) {
    const request = makeRequestWithToken('/api/university/' + rowId, 'DELETE')
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
