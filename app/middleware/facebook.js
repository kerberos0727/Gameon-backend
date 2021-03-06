const FB = require('fb')
const utils = require('./utils')
const fbApp = FB.extend({ appId: process.env.FACEBOOK_APP_ID, appSecret: process.env.FACEBOOK_APP_SECRET })
module.exports = {
  /**
   * get mutual friends of facebook
   * @param {string} ownerToken - facebook token
   * @param {Object} friends - facebook id of friends
   * @returns {Array}
   */
  getMutualFriends(ownerToken, friends) {
    fbApp.setAccessToken(ownerToken)
    const pms = friends.map(friend => ({
      method: 'get',
      relative_url: `/${friend}/all_mutual_friends`
    }))
    return new Promise((resolve, reject) => {
      fbApp.api(
        ``,
        'post',
        { batch: pms },
        (res) => {
          if (!res || res.error) {
            console.log(!res ? 'error occurred' : res.error)
            reject(utils.buildErrObject(422, 'FACEBOOK_MUTUAL_FRIENDS_ERROR'))
          } else {
            try {
              const results = friends.map((friend, index) => ({
                id: friend,
                data: JSON.parse(res[index].body)
              }))
              resolve(results)
            } catch (error) {
              reject(utils.buildErrObject(422, 'FACEBOOK_MUTUAL_FRIENDS_ERROR'))
            }
          }
        }
      )
    })
  }

  /**
   * get mutual friends of facebook
   * @param {string} ownerToken - facebook token
   * @param {Object} friends - facebook id of friends
   * @returns {Array}
   */
  // getInfo(ownerToken) {
  //   fbApp.setAccessToken(ownerToken)
  //   return new Promise((resolve, reject) => {
  //     fbApp.api('/me', { fields: ['id', 'name', 'email', 'phone'] }, (res) => {
  //       if(!res || res.error) {
  //         console.log(!res ? 'error occurred' : res.error)
  //         return;
  //       }
  //       console.log(res.id)
  //       console.log(res.name);
  //     })
  //   })
  // }
}
