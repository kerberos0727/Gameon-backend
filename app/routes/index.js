const express = require('express')
const router = express.Router()
// const fs = require('fs')
// const routesPath = `${__dirname}/`
// const { removeExtensionFromFile } = require('../middleware/utils')

/*
 * Load routes statically and/or dynamically
 */

// api routing
router.use('/api', require('./auth'))
router.use('/api/profile', require('./profile'))
router.use('/api/cards', require('./cards'))
router.use('/api/users', require('./users'))
router.use('/api/setting', require('./setting'))
router.use('/api/teams', require('./teams'))
router.use('/api/sports', require('./sports'))
router.use('/api/university', require('./university'))
router.use('/api/admin', require('./admin'))

// public view routing
router.use('/dashboard', require('./dashboard'))
router.get('/dashboard/login', (req, res) => {
  res.render('index', { title: 'Web Login' })
})
router.get('/dashboard/attributes', (req, res) => {
  res.render('attributes', { title: 'Webaccess' })
})

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})
/*
 * Setup routes for index
 */
router.get('/', (req, res) => {
  res.render('index', { title: 'Web Login' })
})

router.get('/chatroom', (req, res) => {
  res.render('chatroom', { title: 'Web Chat' })
})
/*
 * Handle 404 error
 */
router.use('*', (req, res) => {
  res.status(404).json({
    errors: {
      msg: 'URL_NOT_FOUND'
    }
  })
})

module.exports = router
