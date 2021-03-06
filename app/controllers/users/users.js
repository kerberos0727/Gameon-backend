const model = require('../../models/user')
const Team = require('../../models/team')
const Game = require('../../models/game')
const uuid = require('uuid')
const { matchedData } = require('express-validator')
const utils = require('../../middleware/utils')
const facebook = require('../../middleware/facebook')
const db = require('../../middleware/db')
const emailer = require('../../middleware/emailer')
const User = require('../../models/user')

/*********************
 * Private functions *
 *********************/

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async (req, creator) => {
  return new Promise((resolve, reject) => {
    if (req.role === 'team') {
      delete req.availability
    }
    const user = new model({
      ...req,
      provider: 'local',
      verification: uuid.v4(),
      creator,
      profile: req
    })
    user.save(async (err, item) => {
      utils.itemNotFound(err, item, reject, 'FAILD_SAVE_USER')
      resolve(item)
    })
  })
}

const createTeam = async (chief, sport, availability) => {
  return new Promise((resolve, reject) => {
    Team.findOneAndUpdate(
      {
        chief
      },
      {
        chief,
        sport,
        availability
      },
      {
        upsert: true,
        new: true
      },
      (err, team) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        } else {
          resolve(team.toObject())
        }
      }
    )
  })
}

/**
 * get user's of a group
 * @param {ObjectId} userId - group owner
 */
const groupUsers = async (userId) => {
  return new Promise((resolve, reject) => {
    let users = []
    model.find(
      {
        creator: userId
      },
      (err, owners) => {
        if (err) {
          reject(utils.buildErrObject(402, err.message))
        } else {
          users = owners
          if (owners.length > 0) {
            const ids = users.map((user) => user._id)
            model.find(
              {
                creator: {
                  $in: ids
                }
              },
              (subErr, childs) => {
                if (subErr) {
                  console.log('error:', subErr)
                }

                if (childs) {
                  users = users.concat(childs)
                }
                resolve(users)
              }
            )
          } else {
            resolve([])
          }
        }
      }
    )
  })
}

/********************
 * Public functions *
 ********************/
exports.getItemById = (id) => {
  return db.getItem(id, model)
}

exports.checkExpectedRole = (id, role, msg) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await db.getItem(id, model)
      if (user.role === role) {
        resolve(user)
      } else {
        throw utils.buildErrObject(422, msg || 'WRONG_USER_ROLE')
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    let query = await db.checkQueryString(req.query)
    const { role } = req.user
    if (role === 'team') {
      query = {
        $and: [
          {
            role: 'user'
          },
          query
        ]
      }
    } else if (role === 'leader') {
      query = {
        $and: [
          {
            role: 'team'
          },
          {
            creator: req.user._id
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
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAllItems = async (req, res) => {
  try {
    if (req.query.role && req.query.role === 'user') {

    } else if (req.user.role !== 'admin') {
      req.query = {
        ...req.query,
        creator: req.user._id
      }
    }
    res.status(200).json(await model.find(req.query))
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
    const id = await utils.isIDGood(req.id)
    const user = await db.getItem(id, model)
    Team.findOne({chief: id}, (error, team) => {
      if (error) {
        utils.handleError(res, utils.buildErrObject(422, error.message))
      } else {
        const latest = user.toObject()
        if (team) {
          latest.availability = team.availability
        }
        res.status(200).json(latest)
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
// eslint-disable-next-line max-statements
exports.updateItem = async (req, res) => {
  try {
    const creator = await utils.isIDGood(req.user._id)
    const item = req.body
    if (!item.password || item.password.length <= 0) {
      delete item.password
    }
    const id = await utils.isIDGood(req.params.id)
    const doesEmailExists = await emailer.emailExistsExcludingMyself(
      id,
      item.email
    )
    if (!doesEmailExists) {
      const availability = item.availability
      if (item.role === 'team') {
        item.creator = item.leader || creator
        delete item.availability
        await db.updateItemWithQuery({chief: id}, Team, {...item, availability, sport: item.sports})
      }
      const user = await db.getItem(id, model)
      item.profile = {
        ...user.profile,
        ...item
      }
      res.status(200).json(await db.updateItem(id, model, item))
    }
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
    const locale = req.getLocale()
    req = matchedData(req)
    const doesEmailExists = await emailer.emailExists(req.email)
    if (!doesEmailExists) {
      if (req.role === 'team') {
        creator = req.leader || creator
      }
      const item = await createItem(req, creator)
      if (item.role === 'team') {
        await createTeam(item._id, req.sports, req.availability)
      }
      emailer.sendRegistrationEmailMessage(locale, item)
      res.status(201).json(item)
    }
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
    res.status(200).json(await db.deleteItem(id, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get group's users function called by cards
 * @param {ObjectId} userId - roles specified on the route
 */
exports.getGroupUsers = async (userId) => {
  return groupUsers(userId)
}

exports.getTeamsProfile = (userId) => {
  return new Promise((resolve, reject) => {
    model.findById(userId)
      .populate('creator')
      .exec((err, user) => {
        utils.itemNotFound(err, user, reject, 'USER_DOES_NOT_EXIST')
        resolve({
          team: {
            id: user._id,
            name: user.profile? `${user.profile.firstName} ${user.profile.lastName}`: ''
          },
          leader: {
            id: user.creator._id,
            name: user.creator.profile? `${user.creator.profile.firstName} ${user.creator.profile.lastName}`: ''
          }
        })
      })
  })
}

exports.getFacebookProfile = async (req, res) => {
  try {
    const fbRes = await facebook.getMutualFriends()
    res.status(200).json(fbRes)
  } catch (err) {
    utils.handleError(res, err)
  }
}

exports.getContacts = async (req, res) => {
  try {
    
    const userId = await utils.isIDGood(req.user._id)
    Game.find({
      enable: true,
      creator: userId
    }, (err, games) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(422, err.message))
      } else {
        const userIds = games.map(game => (game.partner)) 
        model.find({
          _id: {
            $in: userIds
          }
        }, (error, users) => {
          if (error) {
            utils.handleError(res, utils.buildErrObject(422, error.message))
          } else {
            res.status(200).json(users.map(user => user.profile))
          }
        })
      }
    })
  } catch (err) {
    utils.handleError(res, err)
  }
}

exports.getLikedUsers = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    return new Promise((resolve, reject) => {
      User.findById(
        userId,
        (err, user) => {
          if (err) {
            reject(utils.buildErrObject(422, err.message))
          } else {
            res.status(200).json({'users_who_liked_me':user.users_who_liked_me})
          }
        }
      )
    })
  } catch (err) {
    utils.handleError(res, err)
  }
}

exports.sendLike = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id) 
    const likedUserId = await utils.isIDGood(req.body.user_i_like)  
    
    return new Promise((resolve, reject) => {
      User.findById(
        userId,
        (err, user) => {
          user.users_i_liked.push(likedUserId)
          user.save((error) => {
            if (err) {
              reject(utils.buildErrObject(422, error.message))
            }
            resolve(utils.buildSuccObject('user added')) 
          })
        }
      ) 
      User.findById(
        likedUserId,
        (err, user) => {
          user.users_who_liked_me.push(userId)
          user.save((error) => {
            if (err) {
              reject(utils.buildErrObject(422, error.message))
            }
            res.status(200).json({'users_i_liked':user.users_who_liked_me}) 
            resolve(utils.buildSuccObject('user added')) 
          })
        }
      )
    }) 
  } catch (err) {
    utils.handleError(res, err)
  }
}
