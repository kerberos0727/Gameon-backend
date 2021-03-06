$(document).ready(function() {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        initialize()
    }
})

let selectedRowId = null;
function initialize() {
    $("div#sport-image").dropzone({
        url: "/api/image",
        paramName: 'image',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        sending: (file, xhr, formData) => {
            setTimeout(() => {
                const imagedata = $('.image-preview .dz-image img').attr('src');
                $('.image-preview').css('background', `url("${imagedata}")`)
            }, 10)
        },
        success: (res) => {
            const result = JSON.parse(res.xhr.response)
            $('#image-url').val(result.imageUrl)            
        }
    });
    // table init
    $('form.add-leader').validate({
        rules: {
          // simple rule, converted to {required:true}
          name: 'required'
        },
        submitHandler(form) {
            const data = {
                name: $('input[name="name"]').val(),
                imageUrl: $('input[name="imageUrl"]').val()
            }
            const request = selectedRowId?makeRequestWithToken('/api/sports/' + selectedRowId, 'PATCH', data): makeRequestWithToken('/api/sports', 'POST', data)
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
        if (cellIndex.column == 2) { // delete row
            deleteRow(id)
        } else {
            selectRow(id)
        }
    });
}

function displayTable() {
    const request = makeRequestWithToken('/api/sports/all', 'GET')
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
        'edit': '<i class="fa fa-pencil"></i>',
        'delete': '<i class="fa fa-times-circle"></i>'
    }))).draw()    
}

function selectRow(sportsId) {
    selectedRowId = sportsId
    if (sportsId) {
        const request = makeRequestWithToken('/api/sports/' + sportsId, 'GET')
        if (request) {
            request.done(sport => {
                $('input[name="name"]').val(sport.name || '')
                if (sport.imageUrl)
                    $('#sport-image.image-preview').css('background', `url(${sport.imageUrl})`)
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }        
    } else {
        $('input[name="name"]').val('')
        $('#sport-image.image-preview').attr('background', 'none')
    }
}

function deleteRow(rowId) {
    const request = makeRequestWithToken('/api/sports/' + rowId, 'DELETE')
    if (request) {
        request.done(() => {
            const resultTbl = $('table#result').DataTable()
            resultTbl.row('.selected').remove().draw( false );
        })
        .fail(xhr => {
            errorHandler(xhr)
        })
    }
}
