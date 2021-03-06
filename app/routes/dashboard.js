const express = require('express')
const router = express.Router()

// route middleware to make sure
// eslint-disable-next-line func-style
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		{return next()}

	// if they aren't redirect them to the home page
	return res.redirect('/')
}

router.get('/', isLoggedIn, (req, res) => {
  const {role} = req.user
  const option = {
    title: 'WebAccess Dashboard',
    page: 'Dashboard',
    pageTitle: 'Dashboard',
    role,
  }

  if (role === 'admin') {
    option.menus = [
      {
        title: 'Content Management',
        submenu: [
          { title: 'Users', url: 'users', icon: 'all-users.png' },
          { title: 'Groups', url: 'teams', icon: 'subteams.png' },
          { title: 'Team Leaders', url: 'leaders', icon: 'user.png' },
          { title: 'Training', url: 'training', icon: 'training.png' },
          { title: 'Trials', url: 'trials', icon: 'trials.png' },
          { title: 'Events', url: 'events', icon: 'events.png' },
          { title: 'Universities', url: 'universities', icon: 'school.png' },
          { title: 'Sports', url: 'sports', icon: 'sports.png' }
        ]
      },
      {
        title: 'Interaction Management',
        submenu: [
          { title: 'Chat Transcripts', url: 'chats', icon: 'chat.png' },
          { title: 'User Reports', url: 'reports', icon: 'report.png' },
          { title: 'Matches', url: 'matches', icon: 'match.png' },
          { title: 'File gallery', url: 'gallery', icon: 'file.png' }
        ]
      },
      {
        title: 'Technical',
        submenu: [
          { title: 'Login logs', url: 'logs/login', icon: 'login-logs.png' },
          { title: 'Server logs', url: 'logs/server', icon: 'server.png' },
          { title: `Today's Numbers`, url: 'logs/numbers', icon: 'bars.png' }
        ]
      },
      {
        title: 'External Areas',
        extra: true,
        submenu: [
          {
            title: 'Webmail',
            url:
              'https://accounts.zoho.eu/signin?servicename=VirtualOffice&signupurl=https://www.zoho.eu/mail/zohomail-pricing.html&serviceurl=https://mail.zoho.eu',
            icon: 'webmail.png'
          },
          {
            title: 'Facebook API',
            url: 'http://developer.facebook.com',
            icon: 'facebook.png'
          },
          {
            title: 'Google API',
            url: 'http://console.developers.google.com',
            icon: 'google.png'
          },
          {
            title: 'Live chat support',
            url: 'http://dashboard.tawk.to/login',
            icon: 'live-chat.png'
          },
          {
            title: 'StatCounter Analytics',
            url: 'http://statcounter.com/login',
            icon: 'statcounter.png'
          }
        ]
      }
    ]
    res.render('dashboard', option)
  } else if (role === 'leader') {
    option.menus = [
      {
        title: 'Content Management',
        submenu: [
          { title: 'Sub Teams', url: 'teams', icon: 'subteams.png' },
          { title: 'Members', url: 'members', icon: 'user.png' },
          { title: 'Training', url: 'training', icon: 'training.png' },
          { title: 'Trials', url: 'trials', icon: 'trials.png' },
          { title: 'Events', url: 'events', icon: 'events.png' }
        ]
      }
    ]
    option.clubName = `${req.user.profile.firstName  } ${  req.user.profile.lastName}`
    res.render('new-dashboard', option)
  } else {
    option.menus = [
      {
        title: 'Content Management',
        submenu: [
          { title: 'Members', url: 'members', icon: 'user.png' },
          { title: 'Training', url: 'training', icon: 'training.png' },
          { title: 'Trials', url: 'trials', icon: 'trials.png' },
          { title: 'Events', url: 'events', icon: 'events.png' }
        ]
      }
    ]
    option.clubName = `${req.user.profile.firstName  } ${  req.user.profile.lastName}`
    res.render('new-dashboard', option)
  }
})

router.get('/users', (req, res) => {
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Members',
    pageTitle: 'Members'
  }
  res.render('pages/user-manage', renderOption)
})

router.get('/teams', isLoggedIn, (req, res) => {
  const { role } = req.user
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Groups',
    pageTitle: 'Group Manage',
    googleApiKey: process.env.GOOGLE_API_KEY,
    isAdminPage: role === 'admin'
  }
  res.render('pages/subteam-manage', renderOption)
})

router.get('/leaders', (req, res) => {
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Team Leaders',
    pageTitle: 'Team Leaders',
    googleApiKey: process.env.GOOGLE_API_KEY
  }
  res.render('pages/leaders', renderOption)
})

router.get('/training', isLoggedIn, (req, res) => {
  const { role } = req.user
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Training',
    pageTitle: 'Training',
    googleApiKey: process.env.GOOGLE_API_KEY,
    isAdminPage: role === 'admin',
    isLeaderPage: ['admin', 'leader'].indexOf(role) > -1
  }
  res.render('pages/training-card', renderOption)
})

router.get('/trials', isLoggedIn, (req, res) => {
  const { role } = req.user
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Trials',
    pageTitle: 'Trials',
    isAdminPage: role === 'admin',
    isLeaderPage: ['admin', 'leader'].indexOf(role) > -1
  }
  res.render('pages/trial-card', renderOption)
})

router.get('/events', isLoggedIn, (req, res) => {
  const { role } = req.user
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Events',
    pageTitle: 'Events',
    googleApiKey: process.env.GOOGLE_API_KEY,
    isAdminPage: role === 'admin',
    isLeaderPage: ['admin', 'leader'].indexOf(role) > -1
  }
  res.render('pages/event-card', renderOption)
})

router.get('/settings', isLoggedIn, (req, res) => {
  const { role } = req.user
  let pageTitle = 'Superadmin Settings'
  if (role === 'leader') {
    pageTitle = 'Team Leader Settings'
  } else if (role === 'team') {
    pageTitle = 'Subteam Settings'
  }
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Settings',
    pageTitle
  }
  res.render('pages/setting', renderOption)
})

router.get('/members', isLoggedIn, (req, res) => {
  const {role} = req.user
  const renderOption = {
    title: 'WebAccess Dashboard',
    page: 'Members',
    pageTitle: 'Members',
    isLeaderPage: role === 'leader'
  }
  res.render('pages/members', renderOption)
})

router.get('/universities', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Universities',
      page: 'Universities',
      pageTitle: 'University Manage'
    }
    res.render('pages/university', renderOption)
  }
})

router.get('/sports', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Sports',
      page: 'Sports',
      pageTitle: 'Sport Manage'
    }
    res.render('pages/sport', renderOption)
  }
})

router.get('/chats', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Chat Transcripts',
      page: 'Chat Transcripts',
      pageTitle: 'Chat Transcripts'
    }
    res.render('pages/chats', renderOption)
  }
})

router.get('/reports', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Chat Transcripts',
      page: 'Chat Transcripts',
      pageTitle: 'Chat Transcripts'
    }
    res.render('pages/reports', renderOption)
  }
})

router.get('/matches', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Matches',
      page: 'Matches',
      pageTitle: 'Matches'
    }
    res.render('pages/match', renderOption)
  }
})

router.get('/gallery', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - File List',
      page: 'File List',
      pageTitle: 'File List'
    }
    res.render('pages/gallery', renderOption)
  }
})

router.get('/logs/login', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Login Logs',
      page: 'Login Logs',
      pageTitle: 'Login Logs'
    }
    res.render('pages/login_logs', renderOption)
  }
})

router.get('/logs/server', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Server Logs',
      page: 'Server Logs',
      pageTitle: 'Server Logs'
    }
    res.render('pages/server_logs', renderOption)
  }
})

router.get('/logs/numbers', isLoggedIn, (req, res) => {
  const { role } = req.user
  if (role !== 'admin') {
    res.redirect('/')
  } else {
    const renderOption = {
      title: 'GameOn Sport - Today\'s Numbers',
      page: 'Today\'s Numbers',
      pageTitle: 'Today\'s Numbers'
    }
    res.render('pages/numbers', renderOption)
  }
})
module.exports = router
