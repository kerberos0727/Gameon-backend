const ChatHistory = require('../app/models/chatHistory')
module.exports.init = (socket) => {
  socket.on('History', (payload) => {
    ChatHistory.find(payload, (err, histories) => {
      if (err) {
        console.log('history getting error')
      }
      if (histories) {
        payload.msgs = histories
      }
      global.io.emit('History', payload)
    })
  })

  socket.on('User:Joined', (userId) => {
    socket.userId = userId
    global.io.emit('Online:Users', global.io.connectedUsers)
  })

  socket.on('Typing', (payload) => {
    ChatHistory.updateMany(payload, {
      status: true
    }, (err) => {
      console.log('updating error', err)
    })
    global.io.emit('Typing', payload)
  })

  socket.on('Chat:Read', (payload) => {
    ChatHistory.updateMany(payload, {
      status: true
    }, (err) => {
      console.log('updating error', err)
    })
  })

  socket.on('Message', payload => {
    const msg = new ChatHistory(payload)
    msg.save((err) => {
      if (err) {
        console.log('messaging save err', err)
      } else {
        payload.msg = msg
      }
      global.io.emit('Message', payload)
    })
  })

  socket.on('disconnect', (reason) => {
    const userId = socket.userId
    let connectedUsers = global.io.connectedUsers
    if (connectedUsers.indexOf(userId) > -1) {
      connectedUsers = connectedUsers.filter(id => (id !== userId))
      global.io.connectedUsers = connectedUsers
      global.io.emit('Online:Users', connectedUsers)
    }
  })
}
