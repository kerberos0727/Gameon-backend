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
        mData: 'dataSet',
        columns: [
            { "data": "name" },
            { "data": "login_at" },
            { "data": "created_at" }
        ],
        rowId: 'id',
        "ajax": function (data, callback, settings) {            
            drawId = data.draw
            let query = 'filter=' + data.search.value;
            query += '&fields=name&page=' + data.start + 1
            query += '&limit=' + data.length;
            query += '&sort=name&order=-1&draw=' + data.draw
            $.ajax({
                "url": "/api/admin/logs/login?" + query,
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

    $('table#result tbody').on( 'click', 'td', function () {
        if ( $(this).parent().hasClass('selected') ) {
            $(this).parent().removeClass('selected');
        }
        else {
            resultTbl.$('tr.selected').removeClass('selected');
            $(this).parent().addClass('selected');            
        }
    });
}