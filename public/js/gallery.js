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
    const resultTbl = $('table#result').DataTable({
        "processing": true,
        'serverSide': true,
        "columns": [
            { "data": "filename" },
            { "data": "created_at" },
            { "data": "name" },
            { "data": "type" },
            { "data": "view", render: () => {
                return '<i class="fa fa-envelope"></i>'
            }}
        ],
        rowId: 'id',
        "ajax": function (data, callback, settings) {            
            drawId = data.draw
            let query = 'filter=' + data.search.value;
            query += '&fields=name&page=' + data.start + 1
            query += '&limit=' + data.length;
            query += '&sort=name&order=-1&draw=' + data.draw
            $.ajax({
                "url": "/api/admin/gallery",
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
                        data: json.docs
                    };
                    callback(result)
                }
            })
        }
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
        selectedRowId = resultTbl.row(this).id()
        dialog.dialog('open')
    });

    dialog = $('.modal-preview').dialog({
        autoOpen: false,
        width: window.innerWidth * 0.8,
        height: window.innerHeight * 0.9,
        buttons: {
            Cancel: function () {
                dialog.dialog("close");
            }
        },
        open: (event) => {
            const row = resultData.find(item => (item.id === selectedRowId))
            if (row) {
                $(event.target).find('.image-preview').css('background', `url("${row.url}")`)
            }
        }
    })
}

function displayTable() {
    const request = makeRequestWithToken('/api/admin/gallery', 'GET')
    if (request) {
        request.done(data => {
            renderTable(data)
        })
        .fail(xhr => {
            errorHandler(xhr)
        })
    }
}

function renderTable(data) {
    const resultTbl = $('table#result').DataTable()    
    resultTbl.clear().rows.add(data).draw()    
}