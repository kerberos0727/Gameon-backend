const controller = require('../controllers/teams/teams')
const validate = require('../controllers/teams/teams.validate')
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
  '/',
  requireAuth,
  AuthController.roleAuthorization(['user', 'leader', 'admin']),
  trimRequest.all,
  controller.getItems
)

/*
 * Add Team member route
 */
router.post(
  '/:chief/members',
  requireAuth,
  trimRequest.all,
  validate.addMember,
  controller.addTeamMember
)

/*
 * Get Team members route
 */
router.get(
  '/:chief/members',
  requireAuth,
  trimRequest.all,
  validate.getItem,
  controller.getTeamMembers
)

/*
 * Remove Team member route
 */
router.delete(
  '/:chief/members',
  requireAuth,
  trimRequest.all,
  validate.addMember,
  controller.removeTeamMember
)

/*
 * Get item route
 */
router.get(
  '/:chief',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  validate.getItem,
  controller.getItem
)

/*
 * Update item route
 */
router.patch(
  '/:chief',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

module.exports = router
