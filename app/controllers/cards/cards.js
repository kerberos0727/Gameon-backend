const moment = require('moment')
const Training = require('../../models/training')
const Team = require('../../models/team')
const Event = require('../../models/event')
const Trial = require('../../models/trial')
const Sport = require('../../models/sport')
const User = require('../../models/user')
const CardJoinHistory = require('../../models/cardJoinHistory')
const UserController = require('../users/users')
const TeamController = require('../teams/teams')
const ProfileController = require('../users/profile')
const { matchedData } = require('express-validator')
const utils = require('../../middleware/utils')
const facebook = require('../../middleware/facebook')
const db = require('../../middleware/db')

/*********************
 * Private functions *
 *********************/
const getCard = (id, type) => {
  let cardModel = Event
  if (type === 'trial') {
    cardModel = Trial
  } else if (type === 'training') {
    cardModel = Training
  }

  return db.getItem(id, cardModel)
}

const getSports = () => {
  return new Promise((resolve, reject) => {
    Sport.find({ enable: true }, (err, sports) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        const results = sports.map(sport => ({
          id: sport._id,
          name: sport.name,
          thumbnail: sport.imageUrl
        }))
        resolve(results)
      }
    })
  })
}

const rejectedHistory = (type, userId) => {
  let sbTime = 6
  if (type === 'trial' || type === 'training') {
    sbTime = 6
  } else if (type === 'user') {
    sbTime = 24 * 5
  } else if (type === 'event') {
    sbTime = 24
  } else {
    sbTime = 27 * 7
  }
  const expectTime = moment().subtract(sbTime, 'hours').format()
  return new Promise((resolve, reject) => {
    CardJoinHistory.find({
      userId,
      cardType: type,
      $or: [
        {
          updatedAt: {
            $gt: expectTime
          }
        },
        {
          status: true
        }
      ]
    }, (err, histories) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        resolve(histories.map(history => (history.cardId)))
      }
    })
  })
}

const getTeamCards = async (spIds, userId, sports) => {
  const rejected = await rejectedHistory('team', userId)
  return new Promise((resolve, reject) => {
    Team.find({
      _id: {
        $nin: rejected
      },
      sport: { $in: spIds }
    }, (err, teams) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        const pms = teams.filter(team => (team.players.indexOf(userId.toString())<0)).map((team) => {
          return new Promise(async (resolve1, reject1) => {
            try {
              const teamProfile = await ProfileController.getUserProfile(team.chief)
              resolve1({
                type: 'team',
                id: team._id,
                chief: team.chief,
                name: `${teamProfile.firstName} ${teamProfile.lastName}`,
                availability: team.availability,
                location: teamProfile.location,
                description: teamProfile.bio && teamProfile.bio.description,
                friends: [],
                sport: sports.find(sport => (sport.id.toString() === team.sport.toString())),
                imageUrl: teamProfile.imageUrl,
                priority: 0
              })
            } catch (error) {
              reject1(error)
            }
          })
        })
        Promise.all(pms).then((result) => {
          resolve({'team': result})
        }, (error) => {
          reject(error)
        })
      }
    })
  })
}

const calculateDistance = (pos1, pos2) => {
  const R = 6371e3 // metres
  const Pi1 = pos1.lat * Math.PI/180 // φ, λ in radians
  const Pi2 = pos2.lat * Math.PI/180
  const deltaPi = (pos2.lat - pos1.lat) * Math.PI/180
  const deltaRamda = (pos2.lng - pos1.lng) * Math.PI/180

  const a = Math.sin(deltaPi/2) * Math.sin(deltaPi/2) +
            Math.cos(Pi1) * Math.cos(Pi2) *
            Math.sin(deltaRamda/2) * Math.sin(deltaRamda/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const makeUserCard = (users, owner, sports, mFriends = []) => {
  const latestUsers = users.map(user => {
    const userSports = user.profile? user.profile.sports.map(id => {
      const sport = sports.find(sp => (sp.id.toString() === id))
      return sport || {}
    }): []
    const mFriend = mFriends.find(item => (item.id === user._id.toString()))
    let aPriority = 0
    for(const day of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      for(let i = 0; i < 3; i++) {
        aPriority += owner.profile.availability[day][i] === user.profile.availability[day][i]? 1: 0
      }
    }
    const distance = (owner.profile.location && owner.profile.location.lat && user.profile.location && user.profile.location.lat)? calculateDistance(owner.profile.location, user.profile.location): 10000000
    return {
      type: 'user',
      id: user._id,
      ...user.profile,
      email: user.email,
      phone: user.phone,
      sport: userSports,
      imageUrl: user.profile.imageUrl,
      aPriority,
      priority: 4,
      distance,
      mFriends: (mFriend && mFriend.data) || []
    }
  })

  // eslint-disable-next-line max-statements
  latestUsers.sort((a, b) => {
    if (a.mFriends.length > b.mFriends.length) {return -1}
    if (a.mFriends.length < b.mFriends.length) {return 1}

    // availability
    if (a.aPriority > b.aPriority) { return -1}
    if (a.aPriority < b.aPriority) { return 1 }

    // gps distance
    if (a.distance < b.distance) { return -1}
    if (a.distance > b.distance) { return 1 }

    // university
    if (a.bio.university !== b.bio.universitiy) { return 1}
    else if (a.age !== b.age) { return 1}  // age
    else if (a.sports.length > b.sports.length) { return -1}
    else if (a.sports.length < b.sports.length) { return 1 }
    return -1
  })

  return latestUsers
}

const getTrialCards = async (userId, sports) => {
  const rejected = await rejectedHistory('trial', userId)
  return new Promise((resolve, reject) => {
    Trial.find({
      _id: {
        $nin: rejected
      }
    }, (err, trials) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        const pms = trials.map((trial) => {
          return new Promise(async (resolve1, reject1) => {
            try {
              const team = await TeamController.getTeamOfChief(trial.creator)
              resolve1({
                type: 'trial',
                id: trial._id,
                name: trial.name,
                description: trial.description,
                friends: [],
                sport: sports.find(sp => sp.id.toString() === team.sport.toString()),
                imageUrl: trial.imageUrl,
                priority: 1
              })
            } catch (error) {
              reject1(error)
            }
          })
        })
        Promise.all(pms).then((result) => {
          resolve({trial: result})
        }, (error) => {
          reject(error)
        })
      }
    })
  })
}

const getTrainingCards = async (userId, sports, teamIds) => {
  const rejected = await rejectedHistory('trianing', userId)
  return new Promise((resolve, reject) => {
    Training.find({
      _id: {
        $nin: rejected
      },
      creator: {
        $in: teamIds
      }
    }, (err, trainings) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        const pms = trainings.map((training) => {
          return new Promise(async (resolve1, reject1) => {
            try {
              const team = await TeamController.getTeamOfChief(training.creator)
              resolve1({
                type: 'training',
                id: training._id,
                name: training.name,
                location: training.location,
                availability: training.availability,
                sport: sports.find(sp => sp.id.toString() === team.sport.toString()),
                imageUrl: training.imageUrl,
                priority: 2
              })
            } catch (error) {
              reject1(error)
            }
          })
        })
        Promise.all(pms).then((result) => {
          resolve({traning: result})
        }, (error) => {
          reject(error)
        })
      }
    })
  })
}

const getEventCards = async (userId, sports, teamIds) => {
  const rejected = await rejectedHistory('event', userId)
  return new Promise((resolve, reject) => {
    Event.find({
      _id: {
        $nin: rejected
      },
      creator: {
        $in: teamIds
      }
    }, (err, events) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        const pms = events.map((event) => {
          return new Promise(async (resolve1, reject1) => {
            try {
              const team = await TeamController.getTeamOfChief(event.creator)
              resolve1({
                type: 'event',
                ...event,
                id: event._id,
                sport: sports.find(sp => sp.id.toString() === team.sport.toString()),
                priority: 3
              })
            } catch (error) {
              reject1(error)
            }
          })
        })
        Promise.all(pms).then((result) => {
          resolve({event: result})
        }, (error) => {
          reject(error)
        })
      }
    })
  })
}

const getUserCards = async (userId, sports, owner) => {
  const rejected = await rejectedHistory('user', userId)
  return new Promise((resolve, reject) => {
    User.find({
      role: 'user',
      _id: { $nin: [...rejected, owner._id]},
      'profile.sports': { $elemMatch: {$in: sports.map(sport => (sport.id.toString())) } }
  }, (err, users) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else if (owner.facebookAuth && owner.facebookAuth.id) {
        const fbUsers = users.filter(user => (user.facebookAuth && user.facebookAuth.id)).map(user => (user.facebookAuth.id))
        if (fbUsers.length > 0) {
          facebook.getMutualFriends(owner.facebookAuth.token, fbUsers)
          .then((mFriends) => {
            resolve({users: makeUserCard(users, owner, sports, mFriends)})
          })
        } else {
          resolve({users: makeUserCard(users, owner, sports)})
        }
      } else {
        resolve({users: makeUserCard(users, owner, sports)})
      }
    })
  })
}
/********************
 * Public functions *
 ********************/

exports.checkRoleForCard = (userId) => {
  return new Promise(async (resolve, reject) => {
    if (typeof userId === 'undefined') {
      reject(
        utils.buildErrObject(422, [
          { msg: 'MISSING', param: 'creator', location: 'body' }
        ])
      )
    } else {
      try {
        const creator = await utils.isIDGood(userId)
        const owner = await UserController.getItemById(creator)

        if (owner.role !== 'team') {
          reject(utils.buildErrObject(422, 'WRONG_CREATOR_ID'))
        } else {
          resolve(creator)
        }
      } catch (error) {
        reject(utils.buildErrObject(422, error.message))
      }
    }
  })
}

/**
 * Get Card lists route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.listItems = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    const profile = await ProfileController.getUserProfile(userId)
    const teams = await TeamController.getUsersTeams(userId)
    const attendedTeams = teams.map(team => (team.chief))
    const sports = await getSports()
    const availableSports = []
    profile.sports.map(id => {
      const sport = sports.find(item => (item.id.toString() === id))
      if (sport) {
        availableSports.push(sport)
      }
    })
    const pms = [
      getTeamCards(profile.sports, userId, sports),
      getTrialCards(userId, availableSports),
      getTrainingCards(userId, availableSports, attendedTeams),
      getEventCards(userId, availableSports, attendedTeams),
      getUserCards(userId, availableSports, req.user)
    ]
    Promise.all(pms).then((results) => {
      res.status(200).json(results)
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
exports.joinItem = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    req = matchedData(req)
    const cardId = await utils.isIDGood(req.cardId)
    const card = await getCard(cardId, req.cardType)
    if (card) {
      CardJoinHistory.findOneAndUpdate({
        cardId,
        userId,
        cardType: req.cardType
      }, {
        cardId,
        userId,
        cardType: req.cardType,
        status: req.status
      }, { new: true, upsert: true }, async (err) => {
        if (err) {
          utils.handleError(res, err)
        } else {
          await TeamController.addMember(card.creator, userId)
          res.status(200).json(utils.buildSuccObject('Joined'))
        }
      })
    } else {
      utils.handleError(res, utils.buildErrObject(402, 'WRONG_CARD_ID'))
    }
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
