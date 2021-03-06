const controller = require('../controllers/users/profile')
const validate = require('../controllers/users/profile.validate')
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
 * Profile routes
 */

/*
 * Get profile route
 */
router.get('/', requireAuth, trimRequest.all, controller.getProfile)

router.patch(
  '/',
  requireAuth,
  trimRequest.all,
  validate.updateProfile,
  controller.updateProfile
)

/**
 * Bio of Profile
 */
// ================ get routing ================ //
router.get(
  '/bio',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getBioProfile
)

// ================ update routing ================ //
router.patch(
  '/bio',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.updateBio,
  controller.updateProfile
)

/**
 * Ability of Profile
 */
// ================ get routing ================ //
router.get(
  '/ability',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getAbilityProfile
)

// ================ update routing ================ //
router.patch(
  '/ability',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.updateAbility,
  controller.updateProfile
)

// ================ update routing ================ //
router.get(
  '/sports',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getSportsProfile
)

router.patch(
  '/sports',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.updateSports,
  controller.updateProfile
)

// ================ update routing ================ //
router.get(
  '/availability',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  controller.getAvailabilityProfile
)

router.patch(
  '/availability',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.updateAvailability,
  controller.updateProfile
)

/*
 * Change password route
 */
router.post(
  '/changePassword',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  validate.changePassword,
  controller.changePassword
)

/*
 * Change password route by admin
 */
router.post(
  '/changePassword/:userId',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin']),
  trimRequest.all,
  validate.changePasswordByAdmin,
  controller.changePasswordByAdmin
)
module.exports = router
