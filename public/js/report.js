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
            { "data": "violater" },
            { "data": "reporter_email" },
            { "data": "violater_email" },
            { "data": "category" },
            { "data": "respond" }
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
    const request = makeRequestWithToken('/api/reports/all', 'GET')
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
        'respond': '<i class="fa fa-envelope"></i>'
    }))).draw()    
}

function selectRow(itemId) {
    selectedRowId = itemId
    if (itemId) {
        const request = makeRequestWithToken('/api/sports/' + itemId, 'GET')
        if (request) {
            request.done(report => {
                
            })
            .fail(xhr => {
                errorHandler(xhr)
            })
        }        
    }
}
