$(document).ready(() => {
  // check the login status
  const authToken = localStorage.getItem('gameon_auth_token')
  const userToken = localStorage.getItem('gameon_user')
  const user = userToken ? JSON.parse(userToken) : null

  $('.login').validate({
    rules: {
      // simple rule, converted to {required:true}
      uname: 'required',
      // compound rule
      psw: 'required'
    },
    submitHandler(form) {
      $.post('/api/admin_login', {
        email: $('.login input[name="uname"]').val(),
        password: $('.login input[name="psw"]').val()
      })
        .done((res) => {
          if (res.token) {
            localStorage.setItem('gameon_auth_token', res.token)
          }

          if ($('.login input[name="remember"]').is(':checked')) {
            localStorage.setItem('gameon_user', JSON.stringify(res.user))

            if (res.user.role != '') {
              window.location.replace('/dashboard')
            } else {
              localStorage.removeItem('gameon_auth_token')
              localStorage.removeItem('gameon_user')
              $.toast({
                heading: 'Error',
                text: 'Wrong User access',
                icon: 'error'
              })
            }
          }
        })
        .fail((xhr, status, error) => {
          const { msg } = xhr.responseJSON.errors
          if (msg) {
            const messages =
              typeof msg === 'Array'
                ? msg.map((err) => `'${err.param}' - ${err.msg}`)
                : msg
            $.toast({
              heading: 'Error',
              text: messages,
              icon: 'error'
            })
          }
        })
    }
  })
})
