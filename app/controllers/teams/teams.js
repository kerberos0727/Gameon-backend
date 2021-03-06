const model = require('../../models/team')
const CardJoinHistory = require('../../models/cardJoinHistory')
const ProfileController = require('../users/profile')
const UserController = require('../users/users')
const { matchedData } = require('express-validator')
const utils = require('../../middleware/utils')
const db = require('../../middleware/db')
const emailer = require('../../middleware/emailer')
/*********************
 * Private functions *
 *********************/
const getUsersTeams = async (userId) => {
  return new Promise((resolve, reject) => {
    model.find(
      {
        players: { $elemMatch: {$eq: userId } }
      },
      (err, teams) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        }
        if (teams) {
          resolve(teams)
        }
      }
    )
  })
}

const addMember = (chief, player) => {
  return new Promise((resolve, reject) => {
    model.findOneAndUpdate(
      {
        chief
      },
      {
        chief,
        $addToSet: {
          players: player
        }
      },
      { new: true },
      async (err, team) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        } else {
          resolve(team)
        }
      }
    )
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
    const userId = await utils.isIDGood(req.user._id)
    let query = await db.checkQueryString(req.query)
    if (req.user.role === 'user') {
      query = {
        $and: [
          {
            players: userId
          },
          query
        ]
      }
    }
    res.status(200).json(await db.getItems(req, model, query))
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
    req = matchedData(req)
    const chief = await utils.isIDGood(req.chief)
    model.findOne({chief}, async (err, team) => {
      if (err) {
        throw utils.buildErrObject(422, err.message)
      } else if (team) {
        const teamObj = team.toObject()
        teamObj.members = await ProfileController.getUserLists(team.players)
        res.status(201).json(teamObj)
      } else {
        throw utils.buildErrObject(422, 'WRONG_TEAM_ID')
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    req = matchedData(req)
    const chief = await utils.isIDGood(req.chief)
    model.findOneAndUpdate(
      {chief},
      req,
      {
        new: true,
        runValidators: true
      },
      (err, item) => {
        if (err) {
          utils.handleError(res, this.buildErrObject(422, err.message))
        } else if (!item) {
          utils.handleError(res, this.buildErrObject(404, 'NOT_FOUND'))
        } else {
          res.status(200).json(item)
        }
      }
    )
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.addMember = addMember
/**
 * Add a user to team function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.addTeamMember = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale()
    req = matchedData(req)

    const chief = await utils.isIDGood(req.chief)
    const player = await utils.isIDGood(req.player)
    await UserController.checkExpectedRole(player, 'user', 'WRONG_USER_ID')

    model.findOneAndUpdate(
      {chief},
      {
        $addToSet: {
          players: player
        }
      },
      { new: true },
      async (err, team) => {
        if (err) {
          utils.handleError(res, utils.buildErrObject(422, err.message))
        } else if (team) {
          const chiefInfo = await ProfileController.getUserProfile(team.chief)
          if (chiefInfo) {
            emailer.sendConfirmAddedTeamEmailMessage(locale, chiefInfo)
          }
          const members = await ProfileController.getUserLists(team.players)
          CardJoinHistory.findOneAndUpdate({
            cardId: team._id,
            userId: player,
            cardType: 'team'
          }, {
            cardId: team._id,
            userId: player,
            cardType: 'team',
            status: true
          }, { new: true, upsert: true }, async (error) => {
            if (error) {
              utils.handleError(res, error)
            } else {
              res.status(201).json(members)
            }
          })
        } else {
          utils.handleError(res, utils.buildErrObject(422, 'WRONG_TEAM_ID'))
        }
      }
    )
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get members of team function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getTeamMembers = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'

    req = matchedData(req)
    const chief = await utils.isIDGood(req.chief)

    model.findOne({chief}, async (err, team) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(422, err.message))
      } else if (team) {
        const members = await ProfileController.getUserLists(team.players)
        res.status(201).json(members)
      } else {
        utils.handleError(res, utils.buildErrObject(422, 'WRONG_TEAM_ID'))
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Add a user to team function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.removeTeamMember = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    req = matchedData(req)
    const chief = await utils.isIDGood(req.chief)
    const player = await utils.isIDGood(req.player)
    model.findOneAndUpdate(
      {chief},
      {
        $pull: {
          players: player
        }
      },
      { new: true },
      async (err, team) => {
        if (err) {
          utils.handleError(res, utils.buildErrObject(422, err.message))
        } else if (team) {
          const members = await ProfileController.getUserLists(team.players)
          CardJoinHistory.findOneAndUpdate({
            cardId: team._id,
            userId: player,
            cardType: 'team'
          }, {
            cardId: team._id,
            userId: player,
            cardType: 'team',
            status: false
          }, { new: true, upsert: true }, async (error) => {
            if (error) {
              utils.handleError(res, error)
            } else {
              res.status(201).json(members)
            }
          })
          // res.status(201).json(members)
        } else {
          utils.handleError(res, utils.buildErrObject(422, 'WRONG_TEAM_ID'))
        }
      }
    )
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.getUsersTeams = getUsersTeams

exports.getTeamOfChief = (chief) => {
  return new Promise((resolve, reject) => {
    model.findOne({chief}, (error, team) => {
      utils.itemNotFound(error, team, reject, 'NOT_FOUND')
      resolve(team)
    })
  })
}
