const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')

const MatchesController = require('../controllers/cards/matches')
const MatchesValidate = require('../controllers/cards/matches.validate')
const TrainingController = require('../controllers/cards/training')
const TrainingValidate = require('../controllers/cards/training.validate')
const TrialController = require('../controllers/cards/trial')
const TrialValidate = require('../controllers/cards/trial.validate')
const EventController = require('../controllers/cards/event')
const EventValidate = require('../controllers/cards/event.validate')
const CardController = require('../controllers/cards/cards')
const CardValidate = require('../controllers/cards/cards.validate')
const AuthController = require('../controllers/users/auth')

const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

/*
 * Cards routes
 */
/** Get Cards matched */
router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  CardController.listItems
)
/*
 * Join card route
 */
router.post(
  '/join',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  CardValidate.joinItem,
  CardController.joinItem
)

/**
 * create a card with admin and team leader
 */
// router.get(
//   '/',
//   requireAuth,
//   AuthController.roleAuthorization(['user']),
//   trimRequest.all,
//   CardController.listItems
// )

/*
 * Get items route
 */
router.get(
  '/training',
  requireAuth,
  trimRequest.all,
  TrainingController.getItems
)

/*
 * Create new item route
 */
router.post(
  '/training',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrainingValidate.createItem,
  TrainingController.createItem
)

/*
 * Get item route
 */
router.get(
  '/training/:id',
  requireAuth,
  trimRequest.all,
  TrainingValidate.getItem,
  TrainingController.getItem
)

/*
 * Update item route
 */
router.patch(
  '/training/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrainingValidate.updateItem,
  TrainingController.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/training/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrainingValidate.deleteItem,
  TrainingController.deleteItem
)

// ======================================================= //
// =================== trial routes ====================== //
// ======================================================= //

/*
 * Get items route
 */
router.get('/trial', requireAuth, trimRequest.all, TrialController.getItems)

/*
 * Create new item route
 */
router.post(
  '/trial',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrialValidate.createItem,
  TrialController.createItem
)

/*
 * Get item route
 */
router.get(
  '/trial/:id',
  requireAuth,
  trimRequest.all,
  TrialValidate.getItem,
  TrialController.getItem
)

/*
 * Update item route
 */
router.patch(
  '/trial/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrialValidate.updateItem,
  TrialController.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/trial/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  TrialValidate.deleteItem,
  TrialController.deleteItem
)

// ======================================================= //
// =================== event routes ====================== //
// ======================================================= //

/*
 * Get items route
 */
router.get('/event', requireAuth, trimRequest.all, EventController.getItems)

/*
 * Create new item route
 */
router.post(
  '/event',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  EventValidate.createItem,
  EventController.createItem
)

/*
 * Get item route
 */
router.get(
  '/event/:id',
  requireAuth,
  trimRequest.all,
  EventValidate.getItem,
  EventController.getItem
)

/*
 * Update item route
 */
router.patch(
  '/event/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  EventValidate.updateItem,
  EventController.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/event/:id',
  requireAuth,
  AuthController.roleAuthorization(['team', 'leader', 'admin']),
  trimRequest.all,
  EventValidate.deleteItem,
  EventController.deleteItem
)

router.post(
  '/game',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  MatchesValidate.joinItem,
  MatchesController.joinItem
)
module.exports = router
