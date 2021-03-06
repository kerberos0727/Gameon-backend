const { matchedData } = require('express-validator')
const Game = require('../../models/game')
const utils = require('../../middleware/utils')
const db = require('../../middleware/db')

/*********************
 * Private functions *
 *********************/
const createGame = (creator, partner, enable) => {
  return new Promise((resolve, reject) => {
    const userList = [creator, partner]
    Game.findOne({
      enable: false,
      creator: {
        $in: userList
      },
      partner: {
        $in: userList
      }}, (err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      } else {
        if (item) {
          item.enable = enable || true
        } else {
          item = new Game({
            creator,
            partner
          })
        }
        item.save((error, newItem) => {
          if (error) {
            reject(utils.buildErrObject(422, error.message))
          } else {
            resolve(newItem)
          }
        })
      }
    })
  })
}
/********************
 * Public functions *
 ********************/

/**
 * Join card function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.joinItem = async (req, res) => {
  try {
    const creator = await utils.isIDGood(req.user._id)
    req = matchedData(req)
    const partner = await utils.isIDGood(req.partner)
    res.status(200).json(await createGame(creator, partner, req.enable))
  } catch (error) {
    utils.handleError(res, error)
  }
}
