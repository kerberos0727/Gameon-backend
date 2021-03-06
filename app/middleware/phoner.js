const twilio = require('twilio')
const i18n = require('i18n')
const User = require('../models/user')
const { itemAlreadyExists } = require('./utils')

module.exports = {
  /**
   * Checks User model if user with an specific phone exists
   * @param {string} phone - user phone
   */
  async phoneExists(phone) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          phone
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'PHONE_ALREADY_EXISTS')
          resolve(false)
        }
      )
    })
  },

  /**
   * Checks User model if user with an specific phone exists but excluding user id
   * @param {string} id - user id
   * @param {string} phone - user phone
   */
  async phoneExistsExcludingMyself(id, phone) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          phone,
          _id: {
            $ne: id
          }
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'PHONE_ALREADY_EXISTS')
          resolve(false)
        }
      )
    })
  },

  /**
   * Sends verify code to phone
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendVerifycode(local, user) {
    const client = new twilio(
      process.env.TWILIO_API_SID,
      process.env.TWILIO_API_TOKEN
    )
    const sms = i18n.__('verifycode.MESSAGE', user.verification)
    client.messages
      .create({
        body: sms,
        to: user.phone, // Text this number
        from: '+1(323)647-8991' // From a valid Twilio number
      })
      .then((message) => {
        console.log('sms message send', message)
      }, (error) => {
        console.log('sms message failed', error)
      })
  }
}
