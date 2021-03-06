const moment = require('moment')
const _ = require('lodash')
const ContentHistory = require('../../models/contentsHistory')
const AccessHistory = require('../../models/userAccess')
const ProfileController = require('../users/profile')
const Team = require('../../models/team')
const Event = require('../../models/event')
const User = require('../../models/user')
const utils = require('../../middleware/utils')
const db = require('../../middleware/db')

/*********************
 * Private functions *
 *********************/

/*********************
 * Public functions *
 *********************/
exports.saveContentHistory = (req) => {
    return new Promise((resolve, reject) => {
        const history = new ContentHistory(req)
        history.save((err, item) => {
            if (err) {
                reject(utils.buildErrObject(422, err.message))
            } else {
                resolve(item)
            }
        })
    })
}

exports.getContentHistory = async (req, res) => {
    try {
        const query = await db.checkQueryString(req.query)
        const histories = await db.getItems(req, ContentHistory, query)
        const pms = histories.docs.map(history => {
            return new Promise((resolve, reject) => {
                User.findById(history.userId, (err, user) => {
                    utils.itemNotFound(err, user, reject, 'NOT_FOUND')
                    if (user.role === 'admin') {
                        resolve({
                            id: history._id,
                            name: 'Super Admin',
                            filename: history.filename,
                            url: history.url,
                            created_at: history.createdAt,
                            type: user.role
                        })
                    } else {
                        ProfileController.getUserProfile(history.userId)
                            .then((profile) => {
                                resolve({
                                    id: history._id,
                                    name: `${profile.firstName} ${profile.lastName}`,
                                    filename: history.filename,
                                    url: history.url,
                                    created_at: history.createdAt,
                                    type: user.role
                                })
                            }, error => {
                                reject(utils.buildErrObject(422, error.message))
                            })
                    }
                })
            })
        })

        Promise.all(pms)
            .then(values => {
                histories.docs = values
                res.status(200).json(histories)
            })
            .catch(error => {
                utils.handleError(res, error)
            })
    } catch (error) {
        utils.handleError(res, error)
    }
}

exports.getLoginHistory = async (req, res) => {
    try {
        let query = await db.checkQueryString(req.query)

        const admins = await User.find({ role: 'admin' })
        query = {
            ...query,
            userId: {
                $nin: admins.map(user => (user._id))
            }
        }
        const histories = await db.getItems(req, AccessHistory, query)

        const pms = histories.docs.map(history => {
            return new Promise((resolve, reject) => {
                User.findById(history.userId, (error, user) => {
                    if (error) {
                        reject(utils.buildErrObject(422, error.message))
                    } else if (user) {
                        resolve({
                            id: history._id,
                            name: `${user.profile.firstName} ${user.profile.lastName}`,
                            created_at: user.createdAt,
                            login_at: history.createdAt
                        })
                    }
                })
            })
        })

        Promise.all(pms)
            .then(values => {
                histories.docs = values
                res.status(200).json(histories)
            })
            .catch(error => {
                utils.handleError(res, error)
            })
    } catch (error) {
        utils.handleError(res, error)
    }
}

exports.getUsersHistory = async (req, res) => {
    try {
        const history = {}
        const m = moment().utcOffset(0)
        m.set({
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 0
        })
        m.toISOString()
        m.format()

        const l = moment().subtract(1, 'days').utcOffset(0)
        l.set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
        l.toISOString()
        l.format()

        const pm = new Promise((resolve) => {
            User.countDocuments({
                role: {
                    $ne: 'admin'
                }
            }, (error, count) => {
                if (error) {
                    throw utils.buildErrObject(422, error.message)
                } else {
                    resolve(count)
                }
            })
        })
        pm.then((total) => {
            history.total = total || 0

            return new Promise((resolve) => {
                User.countDocuments({
                    role: { $ne: 'admin' }, createdAt: {
                        $gte: l.format(),
                        $lte: m.format()
                    }
                }, (error, count) => {
                    if (error) {
                        throw utils.buildErrObject(422, error.message)
                    } else {
                        resolve(count)
                    }
                })
            })
        })
            .then((todayRegistered) => {
                history.todayUsers = todayRegistered || 0
                AccessHistory.find(
                    {
                        createdAt: {
                            $gte: l.format(),
                            $lte: m.format()
                        }
                    }
                    , (error, his) => {
                        if (error) {
                            throw utils.buildErrObject(422, error.message)
                        } else {
                            const grouped = _.groupBy(his, 'userId')
                            history.todayActive = Object.keys(grouped).length
                            res.status(200).json(history)
                        }
                    })
            })
    } catch (error) {
        utils.handleError(res, error)
    }
}

exports.getTotalHistory = async (req, res) => {
    try {
        const history = {}
        const pms = []
        pms.push(new Promise((resolve) => {
            User.countDocuments({
                role: {
                    $ne: 'admin'
                }
            }, (error, count) => {
                if (error) {
                    throw utils.buildErrObject(422, error.message)
                } else {
                    resolve({ user: count })
                }
            })
        }))
        pms.push(
            new Promise((resolve) => {
                Team.countDocuments({
                }, (error, count) => {
                    if (error) {
                        throw utils.buildErrObject(422, error.message)
                    } else {
                        resolve({ team: count })
                    }
                })
            })
        )
        pms.push(
            new Promise((resolve) => {
                Event.countDocuments({}, (error, count) => {
                    if (error) {
                        throw utils.buildErrObject(422, error.message)
                    } else {
                        resolve({event: count})
                    }
                })
            })
        )
        // pms.push(
        //     new Promise((resolve) => {
        //         Event.countDocuments({}, (error, count) => {
        //             if (error) {
        //                 throw utils.buildErrObject(422, error.message)
        //             } else {
        //                 resolve({event: count})
        //             }
        //         })
        //     })
        // )
        Promise.all(pms)
        .then((result) => {
            console.log(result)
            res.status(200).json(result)
        }, (error) => {
            utils.handleError(res, error)
        })
    } catch (error) {
        utils.handleError(res, error)
    }
}
