const controller = require('../controllers/users/auth')
const validate = require('../controllers/users/auth.validate')
const AuthController = require('../controllers/users/auth')
const express = require('express')
const router = express.Router()
const utils = require('../middleware/utils')
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

/*
 * Auth routes
 */

/*
 * Register route
 */
router.post(
  '/register',
  trimRequest.all,
  validate.register,
  controller.register
)

/*
 * Register route
 */
// router.post(
//   '/admin/register',
//   requireAuth,
//   AuthController.roleAuthorization(['admin']),
//   trimRequest.all,
//   validate.registerOnWeb,
//   controller.registerOnWeb
// )

/*
 * Verify route
 */
router.post(
  '/verify',
  requireAuth,
  trimRequest.all,
  validate.verify,
  controller.verify
)

/*
 * Get new refresh token
 */
router.get(
  '/token',
  requireAuth,
  AuthController.roleAuthorization(['user', 'team', 'leader', 'admin']),
  trimRequest.all,
  controller.getRefreshToken
)

/*
 * Resend verification code
 */
router.get(
  '/resendcode',
  requireAuth,
  AuthController.roleAuthorization(['user', 'team', 'leader', 'admin']),
  trimRequest.all,
  controller.getVerifiyCode
)

/*
 * Login route
 */
router.post('/login',
 trimRequest.all,
  validate.login,
   controller.login
   
   )

router.post('/social_login', trimRequest.all, validate.login, controller.socialLogin)
router.post(
  '/admin_login',
  trimRequest.all,
  validate.loginWeb,
  (req, res, next) => {
    // eslint-disable-next-line consistent-return
    passport.authenticate('local', (err, user) => {
      if (err) {
        return utils.handleError(res, utils.buildErrObject(401, err.message))
      }
      // eslint-disable-next-line consistent-return
      req.login(user, async (err1) => {
        if (err1) {
          utils.handleError(res, utils.buildErrObject(401, err1.message))
        } else {
          return next()
        }
      })
    })(req, res, next)
  },
  controller.loginWeb
)

/**
 * image uploading route
 */
router.post('/image', requireAuth, controller.uploadImage)
router.post('/imagebase64', requireAuth, controller.uploadImageAsBase64)

/*
 * Reset password route
 */
router.post(
  '/reset',
  requireAuth,
  AuthController.roleAuthorization(['leader', 'admin', 'team']),
  trimRequest.all,
  validate.resetPassword,
  controller.resetPassword
)

/*
 * Reset password route
 */
router.post(
  '/reset/email',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  validate.resetEmail,
  controller.resetEmail
)

/*
 * Send sms verification code
 */
router.post(
  '/sendsmscode',
  trimRequest.all,
  validate.sendCode,
  controller.sendVerificationCode
)

/*
 * Send sms verification code
 */
router.post(
  '/verifycode',
  trimRequest.all,
  validate.verifyCode,
  controller.verifyCode
)
module.exports = router
