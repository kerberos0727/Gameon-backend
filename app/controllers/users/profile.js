const User = require('../../models/user')
const Sports = require('../../models/sport')
const utils = require('../../middleware/utils')
const { matchedData } = require('express-validator')
const auth = require('../../middleware/auth')

/*********************
 * Private functions *
 *********************/

/**
 * Updates profile in database
 * @param {Object} req - request object
 * @param {string} id - user id
 */
const updateProfileInDB = async (req, id) => {
  return new Promise((resolve, reject) => {
    let objData = {
      profile: req
    }
    if (req.fullfilled) {
      objData.fullfilled = req.fullfilled
    }
    User.findByIdAndUpdate(id, objData, { new: true }, (err, user) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        resolve(user.profile)
      }
    })
  })
}

/**
 * Finds user by id
 * @param {string} email - user id
 */
const findUser = async (id) => {
  return new Promise((resolve, reject) => {
    User.findById(id, 'password email')
      .populate('creator')
      .exec((err, user) => {
        utils.itemNotFound(err, user, reject, 'USER_DOES_NOT_EXIST')
        resolve(user)
      })
  })
}

/**
 * Build passwords do not match object
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async () => {
  return new Promise((resolve) => {
    resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'))
  })
}

/**
 * Changes password in database
 * @param {string} id - user id
 * @param {Object} req - request object
 */
const changePasswordInDB = async (id, req) => {
  return new Promise((resolve, reject) => {
    User.findById(id, '+password', (err, user) => {
      utils.itemNotFound(err, user, reject, 'NOT_FOUND')

      // Assigns new password to user
      user.password = req.newPassword

      // Saves in DB
      user.save((error) => {
        if (err) {
          reject(utils.buildErrObject(422, error.message))
        }
        resolve(utils.buildSuccObject('PASSWORD_CHANGED'))
      })
    })
  })
}

/********************
 * Public functions *
 ********************/

exports.getUserProfile = (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(
      userId,
      (err, user) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        } else {
          resolve(user.profile)
        }
      }
    )
  })
}

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getProfile = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)
    res.status(200).json(req.user.profile || {})
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Update profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateProfile = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)
    const phone = req.user.phone
    const profile = req.user.profile
    req = matchedData(req, { includeOptionals: false })
    req.phone = phone
    res.status(200).json(await updateProfileInDB({ ...profile, ...req}, id))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get bio profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getBioProfile = async (req, res) => {
  try {
    res.status(200).json(req.user.profile.bio || {})
  } catch (error) {
    utils.handleError(res, error)
  }
}

// ============= ability routes ============== //
/**
 * Get bio profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAbilityProfile = async (req, res) => {
  try {
    const sportIds = req.user.profile.ability.map(item => (item.sportId))
    Sports.find({
      _id: { $in: sportIds}
    }, (err, sports) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(401, err.message))
      } else {
        const abilities = req.user.profile.ability.map(ability => {
          const sport = sports.find(item => (item._id.toString() === ability.sportId.toString()))
          return {
            ...ability.toObject(),
            sport: {
              name: sport.name,
              id: sport._id,
              imageUrl: sport.imageUrl
            }
          }
        })
        res.status(200).json(abilities || [])
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

// ============= sports routes ============== //
/**
 * Get bio profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getSportsProfile = async (req, res) => {
  try {
    Sports.find({
      _id: { $in: req.user.profile.sports}
    }, (err, sports) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(401, err.message))
      } else {
        const result = sports.map(sport => ({
          id: sport._id,
          name: sport.name,
          imageUrl: sport.imageUrl
        }))
        res.status(200).json(result || [])
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

// ============= availability routes ============== //
/**
 * Get bio profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAvailabilityProfile = async (req, res) => {
  try {
    res.status(200).json(req.user.profile.availability || {})
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Change password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.changePassword = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)
    const user = await findUser(id)
    req = matchedData(req)
    const isPasswordMatch = await auth.checkPassword(req.oldPassword, user)
    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch())
    } else {
      // all ok, proceed to change password
      res.status(200).json(await changePasswordInDB(id, req))
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Change password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.changePasswordByAdmin = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.params.userId)
    const user = await findUser(id)
    const creator = await utils.isIDGood(req.user._id)
    if (
      user.creator._id.toString() === creator.toString() ||
      user.creator.creator.toString() === creator.toString()
    ) {
      req = matchedData(req)
      res.status(200).json(await changePasswordInDB(id, req))
    } else {
      utils.handleError(res, utils.buildErrObject(401, 'UNAUTHORIZED'))
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.getUserLists = (userIds) => {
  return new Promise((resolve, reject) => {
    User.find({_id: {
      $in: userIds
    }}, (err, users) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        resolve(users.map(user => ({
          id: user._id,
          name: user.profile? `${user.profile.firstName} ${user.profile.lastName}`: ''
        })))
      }
    })
  })
}
