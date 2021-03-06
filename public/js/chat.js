$(document).ready(function() {
    const user = getUserInfo()
    if (user && user.role === 'admin') {
        initialize()
    }
})

let selectedRowId = null;
function initialize() {
    const resultTbl = $('table#result').DataTable({
        "columns": [
            { "data": "name" },
            { "data": "created_at" },
            { "data": "updated_at" },
            { "data": "email" },
            { "data": "view" }
        ],
        rowId: 'id'
    })   

    // displayTable()

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
        selectRow(id)
    });
}

function displayTable() {
    const request = makeRequestWithToken('/api/chats/all', 'GET')
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
