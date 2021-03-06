$(document).ready(() => {
  // check the login status
  const authToken = localStorage.getItem('gameon_auth_token')
  const userToken = localStorage.getItem('gameon_user')
  const user = userToken ? JSON.parse(userToken) : null

  if (!user) {
    window.location.replace('/dashboard/login')
  }
})

function getUserInfo() {
  const userToken = localStorage.getItem('gameon_user')
  const user = userToken ? JSON.parse(userToken) : null
  return user
}

function getAuthToken() {
  const authToken = localStorage.getItem('gameon_auth_token')
  return authToken || ''
}

function logout() {
  localStorage.removeItem('gameon_auth_token')
  localStorage.removeItem('gameon_user')
  window.location.replace('/dashboard/login')
}