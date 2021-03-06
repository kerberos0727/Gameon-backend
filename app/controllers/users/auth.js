const jwt = require('jsonwebtoken')
const phoneToken = require('generate-sms-verification-code')
const User = require('../../models/user')
const UserAccess = require('../../models/userAccess')
const Verification = require('../../models/verification')
// const ForgotPassword = require('../../models/forgotPassword')
const utils = require('../../middleware/utils')
const pwGenerator = require('generate-password')
const {
  addHours
} = require('date-fns')
const {
  matchedData
} = require('express-validator')
const auth = require('../../middleware/auth')
const emailer = require('../../middleware/emailer')
const phoner = require('../../middleware/phoner')
const imageUpload = require('../../middleware/image-upload')
const HistoryController = require('../admin/history')
const singleUpload = imageUpload.upload.single('image')
const HOURS_TO_BLOCK = 2
const LOGIN_ATTEMPTS = 5

/*********************
 * Private functions *
 *********************/

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = (user) => {
  // Gets expiration time
  const expiration =
    Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES

  // returns signed and encrypted token
  return auth.encrypt(
    jwt.sign({
      data: {
        _id: user
      },
      exp: expiration
    },
      process.env.JWT_SECRET
    )
  )
}

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = (req) => {
  let user = {
    _id: req._id,
    email: req.email,
    phone: req.phone,
    role: req.role,
    verified: req.verified,
    fullfilled: req.fullfilled
  }
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== 'production') {
    user = {
      ...user,
      verification: req.verification
    }
  }
  return user
}

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user) => {
  return new Promise((resolve, reject) => {
    const userAccess = new UserAccess({
      userId: user._id,
      email: user.email,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req)
    })
    userAccess.save((err) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      // Returns data with access token
      resolve({
        token: generateToken(user._id),
        user: userInfo
      })
    })
  })
}

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK)
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(utils.buildErrObject(409, 'BLOCKED_USER'))
      }
    })
  })
}

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async (user) => {
  return new Promise((resolve, reject) => {
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(true)
      }
    })
  })
}

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = (user) =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date()

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async (user) => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0
      user.save((err, result) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        }
        if (result) {
          resolve(true)
        }
      })
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true)
    }
  })
}

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async (user) => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, 'BLOCKED_USER'))
    }
    resolve(true)
  })
}

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
const findUser = async (selector) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      selector,
      'phone loginAttempts blockExpires email password role verified fullfilled verification',
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
        resolve(item)
      }
    )
  })
}

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async (userId) => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
      resolve(item)
    })
  })
}

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async (req) => {
  return new Promise((resolve, reject) => {
    req.verification = phoneToken(6, {
      type: 'number'
    })
    const user = new User(req)
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async (user) => {
  user.loginAttempts += 1
  await saveLoginAttemptsToDB(user)
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'))
    } else {
      resolve(blockUser(user))
    }
    reject(utils.buildErrObject(422, 'ERROR'))
  })
}

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== 'production') {
    userInfo.verification = item.verification
  }
  const data = {
    token: generateToken(item._id),
    user: userInfo
  }
  return data
}

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async (id) => {
  return new Promise((resolve, reject) => {
    User.findOne({
      verification: id,
      verified: false
    },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND_OR_ALREADY_VERIFIED')
        resolve(user)
      }
    )
  })
}

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async (user) => {
  return new Promise((resolve, reject) => {
    user.verified = true
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      resolve(userInfo)
    })
  })
}

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
  return new Promise((resolve, reject) => {
    User.findById(data.id, (err, result) => {
      utils.itemNotFound(err, result, reject, 'NOT_FOUND')
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next())
      }
      return reject(utils.buildErrObject(401, 'UNAUTHORIZED'))
    })
  })
}

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, 'BAD_TOKEN'))
      }
      resolve(decoded.data._id)
    })
  })
}


/********************
 * Public functions *
 ********************/

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = (req, res) => {
  const locale = req.getLocale()
  const data = matchedData(req)
  User.findOne({
    phone: data.identifier
  }, async (err, user) => {
    if (err) {
      utils.handleError(res, utils.buildErrObject(422, err.message))
    } else if (user) {
      try {
        user.loginAttempts = 0
        user.verification = phoneToken(6, {
          type: 'number'
        })
        user.verified = false
        await saveLoginAttemptsToDB(user)
        const userInfo = setUserInfo(user)
        const response = returnRegisterToken(user, userInfo)
        // phoner.sendVerifycode(locale, user)
        res.status(201).json(response)
        const connectedUsers = global.io.connectedUsers || []
        if (connectedUsers.indexOf(user._id.toString()) < 0) {
          connectedUsers.push(user._id.toString())
          global.io.connectedUsers = connectedUsers
        }
        global.io.emit('User:Joined', user._id)
      } catch (ferr) {
        utils.handleError(res, ferr)
      }
    } else {
      utils.handleError(res, utils.buildErrObject(422, 'NOT_FOUND'))
    }
  })
}

/**
 * Facebook Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.socialLogin = async (req, res) => {
  try {
    const data = matchedData(req)
    const query = data.provider === 'facebook' ? {
      'fbAuth.id': data.identifier
    } : {
        'googleAuth.id': data.identifier
      }
    User.findOne(query, async (err, user) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(422, err.message))
      } else {
        try {
          console.log('socialLogin calling...', user)
          if (user && user.phone) {
            user.loginAttempts = 0
            await saveLoginAttemptsToDB(user)
            res.status(200).json(await saveUserAccessAndReturnToken(req, user))
            const connectedUsers = global.io.connectedUsers || []
            if (connectedUsers.indexOf(user._id.toString()) < 0) {
              connectedUsers.push(user._id.toString())
              global.io.connectedUsers = connectedUsers
            }
            global.io.emit('User:Joined', user._id)
          } else {
            utils.handleError(res, utils.buildErrObject(401, 'NOT_PHONE_NUMBER'))
          }
        } catch (ferr) {
          utils.handleError(res, ferr)
        }
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.loginWeb = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUser({
      email: data.email
    })
    if (user.role === 'user') {
      utils.handleError(res, utils.buildErrObject(401, 'UNAUTHORIZED'))
    } else {
      await userIsBlocked(user)
      await checkLoginAttemptsAndBlockExpires(user)
      const isPasswordMatch = await auth.checkPassword(data.password, user)
      if (!isPasswordMatch) {
        utils.handleError(res, await passwordsDoNotMatch(user))
      } else {
        // all ok, register access and return token
        user.loginAttempts = 0
        await saveLoginAttemptsToDB(user)
        res.status(200).json(await saveUserAccessAndReturnToken(req, user))
        global.io.emit('User:Joined', user._id)
      }
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.register = async (req, res) => {
  console.log('register calling...')
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale()
    req = matchedData(req)
    const doesEmailExists = await phoner.phoneExists(req.phone)
    if (!doesEmailExists) {
      req.password = pwGenerator.generate({
        length: 10,
        numbers: true
      })
      const item = await registerUser(req)
      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)
      phoner.sendVerifycode(locale, item)
      res.status(201).json(response)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.registerOnWeb = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale()
    req = matchedData(req)
    const doesEmailExists = await emailer.emailExists(req.email, req.role)
    if (!doesEmailExists) {
      req.password = pwGenerator.generate({
        length: 10,
        numbers: true
      })
      const item = await registerUser(req)
      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)
      emailer.sendRegistrationEmailMessage(locale, item)
      res.status(201).json(response)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req)
    if (user.verification === req.code) {
      res.status(200).json(await verifyUser(user))
    } else {
      utils.handleError(res, utils.buildErrObject(422, 'NOT_MATCHED_VERIFY_CODE'))
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getRefreshToken = async (req, res) => {
  try {
    const tokenEncrypted = req.headers.authorization
      .replace('Bearer ', '')
      .trim()
    let userId = await getUserIdFromToken(tokenEncrypted)
    userId = await utils.isIDGood(userId)
    const user = await findUserById(userId)
    const token = await saveUserAccessAndReturnToken(req, user)
    // Removes user info from response
    delete token.user
    res.status(200).json(token)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getVerifiyCode = async (req, res) => {
  try {
    const locale = req.getLocale()
    const tokenEncrypted = req.headers.authorization
      .replace('Bearer ', '')
      .trim()
    let userId = await getUserIdFromToken(tokenEncrypted)
    userId = await utils.isIDGood(userId)
    const user = await findUserById(userId)
    const userInfo = setUserInfo(user)
    const response = returnRegisterToken(user, userInfo)
    phoner.sendVerifycode(locale, user)
    res.status(201).json(response)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
exports.roleAuthorization = (roles) => async (req, res, next) => {
  try {
    const data = {
      id: req.user._id,
      roles
    }
    await checkPermissions(data, next)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * image uploadin
 */
exports.uploadImage = (req, res) => {
  singleUpload(req, res, (err) => {
    if (err) {
      utils.handleError(res, utils.buildErrObject(422, err.message))
    } else {
      console.log('file info', req.file)
      try {
        HistoryController.saveContentHistory({
          filename: req.file.originalname,
          userId: req.user._id,
          url: req.file.location
        })
          .then(() => {
            res.json({
              imageUrl: req.file.location
            })
          }, (error) => {
            utils.handleError(res, error)
          })
      } catch (error) {
        utils.handleError(res, utils.buildErrObject(422, error.message))
      }
    }
  })
}

/**
 * image uploadin
 */
exports.uploadImageAsBase64 = async (req, res) => {
  console.log('uploadimageasbase64--->>>')

  try {
    const response = await imageUpload.uploadStringImg(req, res);
    HistoryController.saveContentHistory({
      filename: req.body.name,
      userId: req.user._id,
      url: response.Location
    })
      .then(() => {
        res.json({
          imageUrl: response.Location
        })
      }, (error) => {
        utils.handleError(res, utils.buildErrObject(422, error.message))
      })
  } catch (err) {
    utils.handleError(res, err)
  }
}

/**
 * Reset password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    const data = matchedData(req)
    const user = await findUser({
      _id: userId
    })
    const isPasswordMatch = await auth.checkPassword(data.password, user)
    if (!isPasswordMatch) {
      utils.handleError(res, utils.buildErrObject(409, 'WRONG_PASSWORD'))
    } else {
      user.password = data.newPassword
      user.save((err) => {
        if (err) {
          utils.handleError(res, utils.buildErrObject(422, err.message))
        } else {
          res.status(200).json({
            status: 'ok'
          })
        }
      })
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Reset email function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetEmail = async (req, res) => {
  try {
    const userId = await utils.isIDGood(req.user._id)
    const data = matchedData(req)
    const user = await findUserById(userId)
    user.email = data.email
    user.save((err) => {
      if (err) {
        utils.handleError(res, utils.buildErrObject(422, err.message))
      } else {
        res.status(200).json({
          status: 'ok'
        })
      }
    })
  } catch (error) {
    utils.handleError(res, error)
  }
}


/**
 * Send Sms verification code
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.sendVerificationCode = async (req, res) => {
  const locale = req.getLocale()
  const data = matchedData(req)
  const vCode = phoneToken(6, {
    type: 'number'
  })
  Verification.findOneAndUpdate({
    phone: data.phone
  }, {
    phone: data.phone,
    code: vCode,
    used: false
  }, {
    upsert: true,
    new: true
  }, (err, vResult) => {
    if (err) {
      utils.handleError(res, utils.buildErrObject(422, err.message))
    } else if (vResult) {
      phoner.sendVerifycode(locale, {
        phone: data.phone,
        verification: vResult.code
      })
      res.status(201).json({
        success: true
      })
    } else {
      utils.handleError(res, utils.buildErrObject(422, 'NOT_CREATED_VCODE'))
    }
  })
}

/**
 * Verify code with phone
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verifyCode = async (req, res) => {
  const data = matchedData(req)
  Verification.findOneAndUpdate(data, {
    used: true
  }, {
    new: true
  }, (err, vResult) => {
    if (err) {
      utils.handleError(res, utils.buildErrObject(422, err.message))
    } else if (vResult) {
      User.findOne({
        phone: data.phone
      }, (error, user) => {
        if (error) {
          utils.handleError(res, utils.buildErrObject(422, error.message))
        } else if (user) {
          res.status(201).json({
            existed: true
          })
        } else {
          res.status(201).json({
            existed: false
          })
        }
      })
    } else {
      utils.handleError(res, utils.buildErrObject(422, 'VERIFIED_FAILED'))
    }
  })
}
