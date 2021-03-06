const controller = require('../controllers/users/users')
const validate = require('../controllers/users/users.validate')
const AuthController = require('../controllers/users/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

/*
 * Users routes
 */

/*
 * Get items route
 */
router.get(
  '/facebook',
   controller.getFacebookProfile
   )

router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  controller.getItems
)

router.get(
  '/all',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  controller.getAllItems
)

/**
 * Get contact route
 */
router.get(
  '/contacts',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getContacts
)

router.get(
  '/likedUsers',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getLikedUsers
)


router.post(
  '/sendLike',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.sendLike
)


/*
 * Create new item route
 */
router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin']),
  trimRequest.all,
  validate.createItem,
  controller.createItem
)

/*
 * Get item route
 */
router.get(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin']),
  trimRequest.all,
  validate.getItem,
  controller.getItem
)

/*
 * Update item route
 */
router.patch(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin']),
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)

module.exports = router
