function TimeRangeComponent(container, range) {
  this.timeRange = range || {
    "sun": [0, 0, 0],
    "mon": [0, 0, 0],
    "tue": [0, 0, 0],
    "wed": [0, 0, 0],
    "thu": [0, 0, 0],
    "fri": [0, 0, 0],
    "sat": [0, 0, 0]
  }
  this.container = typeof container == 'string' ? document.querySelector(container) : container
}

TimeRangeComponent.prototype.render = function () {
  $(this.container).find('.tablecontainer').remove()
  const div = document.createElement('div');
  $(div).addClass('tablecontainer')
  const table = document.createElement('table');
  $(table).addClass('time-range').attr('border', 0);
  let tableContent = '<thead><tr style="border-bottom: 1px solid;"><th>Day</th><th>06:00 ~ 12:00</th><th>12:00 ~ 18:00</th><th>18:00 ~ 23:00 </th></tr></thead><tbody>'
  const days = [{
      key: 'sun',
      'title': 'Sunday'
    },
    {
      key: 'mon',
      'title': 'Monday'
    },
    {
      key: 'tue',
      'title': 'Tuesday'
    },
    {
      key: 'wed',
      'title': 'Wednesday'
    },
    {
      key: 'thu',
      'title': 'Thursday'
    },
    {
      key: 'fri',
      'title': 'Friday'
    },
    {
      key: 'sat',
      'title': 'Saturday'
    }
  ];

  const timeRange = this.timeRange
  days.forEach(day => {
    tableContent += `<tr key="${day.key}">`;
    tableContent += '<td><div class="day">' + day.title + '</div></td>';
    const amClass = timeRange[day.key][0] > 0 ? 'active' : ''
    const pmClass = timeRange[day.key][1] > 0 ? 'active' : ''
    const eveClass = timeRange[day.key][2] > 0 ? 'active' : ''
    tableContent += `<td class="time-td" key="0"><div class="time ${amClass}"><span>AM</span></div></td>`;
    tableContent += `<td class="time-td" key="1"><div class="time ${pmClass}"><span>PM</span></div></td>`;
    tableContent += `<td class="time-td" key="2"><div class="time ${eveClass}"><span>EVE</span></div></td>`;
    tableContent += '</tr>'
  })

  tableContent += "</tbody>"
  $(table).html(tableContent)
  $(table).appendTo(div)
  $(div).appendTo(this.container)
  this.initEvent()
}

TimeRangeComponent.prototype.getValue = function() {
  return this.timeRange
}

TimeRangeComponent.prototype.setValue = function(timeRange) {
  this.timeRange = timeRange
  this.render()
}

TimeRangeComponent.prototype.initValue = function() {
  this.timeRange = {
    "sun": [0, 0, 0],
    "mon": [0, 0, 0],
    "tue": [0, 0, 0],
    "wed": [0, 0, 0],
    "thu": [0, 0, 0],
    "fri": [0, 0, 0],
    "sat": [0, 0, 0]
  }
  this.render()
}

TimeRangeComponent.prototype.initEvent = function() {
  const that = this;
  $(this.container).find('table.time-range tbody').on('click', 'td', function () {
    const day = $(this).parent('tr').attr('key')
    const time = $(this).attr('key')
    const timeDiv = $(this).find('.time')
    if ($(timeDiv).hasClass('active')) {
      $(timeDiv).removeClass('active')
      that.timeRange[day][parseInt(time)] = 0;
    } else {
      $(timeDiv).addClass('active')
      that.timeRange[day][parseInt(time)] = 1;
    }
  })
}
