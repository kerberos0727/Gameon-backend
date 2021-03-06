const model = require('../../models/setting')
const User = require('../../models/user')
const utils = require('../../middleware/utils')
const { matchedData } = require('express-validator')

/*********************
 * Private functions *
 *********************/

/**
 * Gets profile from database by id
 * @param {string} id - user id
 */
const getItemFromDb = async (id, field) => {
  return new Promise((resolve, reject) => {
    model.findOne({ userId: id }, (err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (field && item) {
        resolve(item[field])
      } else {
        resolve(item)
      }
    })
  })
}

/**
 * Updates profile in database
 * @param {Object} req - request object
 * @param {string} id - user id
 */
const updateItemInDB = async (req) => {
  return new Promise((resolve, reject) => {
    model.findOneAndUpdate({ userId: req.userId }, req, { new: true, upsert: true},  (err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        resolve(item)
      }
    })
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    res.status(200).json(await getItemFromDb(userId))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Create Setting function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    req = matchedData(req)
    req.userId = userId
    res.status(200).json(await updateItemInDB(req))
  } catch (error) {
    utils.handleError(res, error)
  }
}
