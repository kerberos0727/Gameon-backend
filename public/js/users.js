let timeRange = null;
let teamLeaders = [];
let selectedUserId = null;
let selectUser = null;
$(document).ready(function () {
  const user = getUserInfo()
  if (user && user.role === 'admin') {
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
    getUniversityData()
      .then(data => {
        $('.university-dropdown').html(renderDropdown(data.map(item => ({
          id: item._id,
          title: item.name
        }))))
        $('.university-dropdown').select2()
      })
      .catch(error => {
        if (error.status == 401) {
          logout()
        }
      })
    getUsersList()
    initialize()
  }
})

function getUsersList() {
  const request = makeRequestWithToken('/api/users/all?role=user', 'GET')
  if (request) {
    request.done((data) => {
        renderUsersDropdown(data.map(user => ({
          id: user._id,
          text: (user.profile && user.profile.firstName + ' ' + user.profile.lastName) || user.email
        })))
      })
      .fail(xhr => {
        errorHandler(xhr)
      })
  }
}

function renderUsersDropdown(data) {
  $('.users-dropdown').empty()
  $('.users-dropdown').select2({
    data
  })
}

function initialize() {
  $('#enable').select2()
  // image drop zone
  $("div#img-viewer").dropzone({
    url: "/api/image",
    paramName: 'image',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    success: (res) => {
      const result = JSON.parse(res.xhr.response)
      $('#image-url').val(result.imageUrl)
      $('#img-viewer').css('background', `url(${result.imageUrl})`)
    }
  });

  timeRange = new TimeRangeComponent('div#training-time')
  timeRange.render()

  $('form.user-form').on('submit', function (e) {
    e.preventDefault();
  });
  $('form.user-form').validate({
    rules: {
      // simple rule, converted to {required:true}
      firstName: 'required',
      lastName: 'required',
      university: 'required',
      description: 'required',
      age: 'required',
      sports: 'required',
      enable: 'required'
    },
    submitHandler(form) {
      const data = {
        email: selectUser.email,
        firstName: $('input[name="firstName"]').val(),
        lastName: $('input[name="lastName"]').val(),
        sports: $('select[name="sports"]').val(),
        enable: $('select[name="enable"]').val(),
        imageUrl: $('input[name="imageUrl"]').val(),
        age: $('input[name="age"]').val(),
        role: 'user',
        availability: timeRange.getValue(),
        bio: {
          description: $('input[name="description"]').val(),
          university: $('select[name="university"]').val()
        }
      }
      const request = makeRequestWithToken('/api/users/' + selectedUserId, 'PATCH', data)
      if (request) {
        request.done(() => {
            successMsg('Saved successfuly!')
            selectRow(null)
            getUsersList()
          })
          .fail(xhr => {
            errorHandler(xhr)
          })
      }
    }
  })

  $('#edit-btn').click(() => {
    const user = $('.users-dropdown').val()
    selectRow(user)
  })

  $('#remove-btn').click(() => {
    const user = $('.users-dropdown').val()
    removeRow(user)
  })
}

function selectRow(userId) {
  selectedUserId = userId
  if (userId) {
    const request = makeRequestWithToken('/api/users/' + userId, 'GET')
    if (request) {
      request.done(user => {
          selectUser = user;
          $('select[name="enable"]').val(user.enable ? '1' : '0' || 1)
          if (user.profile) {
            $('input[name="firstName"]').val(user.profile.firstName || '')
            $('input[name="lastName"]').val(user.profile.lastName || '')
            $('input[name="age"]').val(user.profile.age || 18)
            $('select[name="sports"]').val(user.profile.sports[0] || '').trigger('change')
            $('input[name="location"]').val((user.profile.location && user.profile.location.address) || '')
            $('input[name="description"]').val((user.profile.bio && user.profile.bio.description) || '')
            $('select[name="university"]').val((user.profile.bio && user.profile.bio.university) || '').trigger('change')
            $('select[name="enable"]').val(user.enable? 1: 0).trigger('change'),
            $('input[name="imageUrl"]').val(user.profile.imageUrl)
            $('#img-viewer').css('background', `url(${user.profile.imageUrl})`)
            if (user.profile.availability) {
              timeRange.setValue(user.profile.availability)
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
    $('input[name="firstName"]').val('')
    $('input[name="lastName"]').val('')
    $('input[name="age"]').val(18)
    $('select[name="sports"]').val('').trigger('change')
    $('select[name="enable"]').val(true).trigger('change')
    $('input[name="location"]').val('')
    $('input[name="description"]').val('')
    $('select[name="university"]').val('').trigger('change')
    $('input[name="imageUrl"]').val('')
    $('#img-viewer').css('background', `none`)
    timeRange.initValue()
  }
}

function removeRow(userId) {
  if (userId) {
    const request = makeRequestWithToken('/api/users/' + userId, 'DELETE')
    if (request) {
      request.done(user => {
            getUsersList()
          $('input[name="firstName"]').val('')
          $('input[name="lastName"]').val('')
          $('input[name="age"]').val(18)
          $('select[name="sports"]').val('').trigger('change')
          $('select[name="enable"]').val(true).trigger('change')
          $('input[name="location"]').val('')
          $('input[name="description"]').val('')
          $('select[name="university"]').val('').trigger('change')
          $('input[name="imageUrl"]').val('')
          $('#img-viewer').css('background', `none`)
          timeRange.initValue()
        })
        .fail(xhr => {
          errorHandler(xhr)
        })
    }
  }
}
