function PlayTimeComponent(container, range) {
  this.container = typeof container == 'string' ? document.querySelector(container) : container
  this.timeRange = range || []
}

PlayTimeComponent.prototype.render = function () {
  $(this.container).find('.tablecontainer').remove()
  const div = document.createElement('div');
  $(div).addClass('tablecontainer')
  const table = document.createElement('table');
  $(table).addClass('time-range').attr('border', 0);
  let tableContent = '<thead><tr style="border-bottom: 1px solid;"><th>No</th><th>Start Time</th><th>End Time</th><th>Duration (mins)</th><th>Action </th></tr></thead><tbody>'

  const timeRange = this.timeRange
  timeRange.forEach((time, index) => {
    tableContent += `<tr key="${index}">`;
    tableContent += '<td>' + (index + 1) + '</td>';
    tableContent += `<td class="time-td" key="start">${moment(parseInt(time.start)).format('YYYY-MM-DD HH:mm')}</td>`;
    tableContent += `<td class="time-td" key="date">${moment(parseInt(time.end)).format('YYYY-MM-DD HH:mm')}</td>`;
    tableContent += `<td class="time-td" key="duration">${moment.duration(moment(parseInt(time.end)).diff(moment(parseInt(time.start)))).as('minutes')}</td>`;
    tableContent += `<td class="time-td" key="action"><button type="button" class="delete loginform">Delete</button></td>`;
    tableContent += '</tr>'
  })

  tableContent += `<tr key="new">`;
  tableContent += '<td>' + (timeRange.length + 1) + '</td>';
  tableContent += `<td class="time-td" key="start"><input type="text" name="start"/></td>`;
  tableContent += `<td class="time-td" key="date"><input type="text" name="end"/></td>`;
  tableContent += `<td class="time-td" key="duration"></td>`;
  tableContent += `<td class="time-td" key="duration"><button type="button" class="add loginform">Add</button></td>`;
  tableContent += '</tr>'

  tableContent += "</tbody>"
  $(table).html(tableContent)
  $(table).appendTo(div)
  $(div).appendTo(this.container)
  this.initEvent()
}

PlayTimeComponent.prototype.getValue = function() {
    return this.timeRange
}

PlayTimeComponent.prototype.setValue = function(timeRange) {
    this.timeRange = timeRange
    this.render()     
}

PlayTimeComponent.prototype.initValue = function() {
    this.timeRange = []
    this.render()        
}

PlayTimeComponent.prototype.initEvent = function() {
    const that = this;

    $(this.container).find('table.time-range tbody input[name="start"]').datetimepicker({
        format:'Y-m-d H:i',
        onChangeDateTime:function(dp,$input){
            const temp = $input.val()
            const end =  $(that.container).find('table.time-range tbody input[name="end"]').val()
            if (end && end != '') {
                if (moment(end).isBefore(temp)) {
                    errorMsg('Wrong Date and Time!')
                    $input.val(moment(end).subtract(1, 'hour').format('YYYY-MM-DD HH:mm'))
                }
            }
            return true
        }
    });

    $(this.container).find('table.time-range tbody input[name="end"]').datetimepicker({
        format:'Y-m-d H:i',
        onChangeDateTime:function(dp,$input){
            const temp = $input.val()
            const start =  $(that.container).find('table.time-range tbody input[name="start"]').val()
            if (start && start != '') {
                if (moment(start).isAfter(temp)) {
                    errorMsg('Wrong Date and Time!')
                    $input.val(moment(start).add(1, 'hour').format('YYYY-MM-DD HH:mm'))
                }
            }
            return true
        }
    });

    $(this.container).find('table.time-range tbody button.add').click(() => {
        const start =  $(that.container).find('table.time-range tbody input[name="start"]').val()
        const end =  $(that.container).find('table.time-range tbody input[name="end"]').val()
        if (!start || start == '') {
            return errorMsg('Please input start time.')
        }

        if (!end || end == '') {
            return errorMsg('Please input end time.')
        }
        const obj = {
            start: moment(start).valueOf(),
            end: moment(end).valueOf()
        }
        this.timeRange.push(obj)
        this.render()
    })
    
    $(this.container).find('table.time-range tbody button.delete').click((event) => {
        let index = $(event.target).closest('tr').attr('key')            

        if (!isNaN(index)) {
            index = parseInt(index)
            that.timeRange = [...that.timeRange.slice(0, index), ...that.timeRange.slice(index + 1)]
            that.render()
        }
    })
    
}
