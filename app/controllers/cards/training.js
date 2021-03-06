const Card = require('../../models/training')
const CardJoinHistory = require('../../models/cardJoinHistory')
const UserController = require('../users/users')
const TeamController = require('../teams/teams')
const CardController = require('./cards')
const { matchedData } = require('express-validator')
const utils = require('../../middleware/utils')
const db = require('../../middleware/db')

/*********************
 * Private functions *
 *********************/

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async (req) => {
  return new Promise((resolve, reject) => {
    new Card(req).save(async (err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }

      if (item) {
        resolve(item.toObject())
      }
    })
  })
}

const getCreators = (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const ownerId = await utils.isIDGood(user._id)
      let creators = []
      if (user.role === 'user') {
        const teams = await TeamController.getUsersTeams(ownerId)
        creators = teams.map((team) => team.chief)
      } else {
        const groupUsers = await UserController.getGroupUsers(ownerId)
        creators = [ownerId, ...groupUsers.map((item) => item._id)]
      }
      resolve(creators)
    } catch (err) {
      reject(utils.buildErrObject(422, err.message))
    }
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    const creators = await getCreators(req.user)
    const latestQuery = {
      $and: [
        {
          creator: {
            $in: creators
          }
        },
        query
      ]
    }
    const result = await db.getItems(req, Card, latestQuery)
    for(let i = 0; i < result.docs.length; i++) {
      const teamId = result.docs[i].creator
      const team = await UserController.getTeamsProfile(teamId)
      result.docs[i].team = team.team
      result.docs[i].leader = team.leader
    }
    res.status(200).json(result)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    const creators = await getCreators(req.user)
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    const card = await db.getItem(id, Card)
    if (
      creators.map((item) => item.toString()).indexOf(card.creator.toString()) >
      -1
    ) {
      res.status(200).json(card)
    } else {
      utils.handleError(res, utils.buildErrObject(401, 'UNAUTHORIZED'))
    }
  } catch (error) {
    utils.handleError(res, utils.buildErrObject(402, error.message))
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    let creator = await utils.isIDGood(req.user._id)
    const role = req.user.role
    if (role !== 'team') {
      creator = await CardController.checkRoleForCard(req.body.creator)
    }
    req = matchedData(req)
    req.creator = creator
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.updateItem(id, Card, req))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    let creator = await utils.isIDGood(req.user._id)
    const role = req.user.role
    if (role !== 'team') {
      creator = await CardController.checkRoleForCard(req.body.creator)
    }
    req = matchedData(req)
    req.creator = creator
    const item = await createItem(req)
    res.status(201).json(item)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.deleteItem(id, Card))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Join card function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.joinItem = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    req = matchedData(req)
    const cardId = await utils.isIDGood(req.cardId)

    new CardJoinHistory({
      cardId,
      userId,
      status: true
    }).save((err) => {
      if (err) {
        utils.handleError(res, err)
      } else {
        res.status(200).json(utils.buildSuccObject('Joined'))
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Join card function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getJoinedUsers = async (req, res) => {
  try {
    // const userId = await utils.isIDGood(req.user._id)
    // req = matchedData(req)
    // const cardId = await utils.isIDGood(req.cardId)
    // CardJoinHistory({
    //   cardId
    // })
    // .populate
    // new CardJoinHistory({
    //   cardId,
    //   userId,
    //   status: false
    // }).save((err, history) => {
    //   if (err) {
    //     utils.handleError(res, err)
    //   } else {
    //     res.status(200).json(utils.buildSuccObject('Joined'))
    //   }
    // })
  } catch (error) {
    utils.handleError(res, error)
  }
}
