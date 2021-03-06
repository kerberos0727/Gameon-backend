var socket = io({
    transports: ['websocket']
});
$(document).ready(function() {
    const user = getUserInfo()
    
    if (user && user.role === 'admin') {
        initialize(socket, user)
    }
})

function initialize(socket, user) {
    $('#join').click(() => {
        socket.emit('History', {
            from: user._id,
            to: '5f032ec10026640df8c04061'
        })
    })

    $('#submit').click(() => {
        socket.emit('Message', {
            from: user._id,
            to: '5f032ec10026640df8c04061',
            msg: $('#message').val()
        })
    })

    $('#leave').click(() => {
        socket.emit('Typing', {
            from: user._id,
            to: '5f032ec10026640df8c04061'
        })
    })

    socket.on('History', (payload) => {
        console.log('history', payload)
    });

    socket.on('Message', (payload) => {
        console.log('message', payload)
    });

    socket.on('Typing', (payload) => {
        console.log('typing', payload)
    });

    socket.on('User:Joined', userId => {
        console.log(userId, ' is joined')
        socket.emit('User:Joined', userId)
    });

    socket.on('Online:Users', (payload) => {
        console.log('Online users', payload);
    })
}
