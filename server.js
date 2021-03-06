require('dotenv-safe').config()
const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')
const helmet = require('helmet')
const cors = require('cors')
const passport = require('passport')
const app = express()
const i18n = require('i18n')
const initMongo = require('./config/mongo')
const path = require('path')
const mongooseMorgan = require('mongoose-morgan')
const server = require('http').createServer(app)

// Setup express server port from ENV, default: 3000
app.set('port', process.env.PORT || 3000)

morgan.token('userId', function getUserId(req) {
  return req.user ? req.user._id : ''
})
// Enable only in development HTTP request logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Redis cache enabled by env variable
if (process.env.USE_REDIS === 'true') {
  const getExpeditiousCache = require('express-expeditious')
  const cache = getExpeditiousCache({
    namespace: 'expresscache',
    defaultTtl: '1 minute',
    engine: require('expeditious-engine-redis')({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    })
  })
  app.use(cache)
}

// for parsing json
app.use(
  bodyParser.json({
    limit: '20mb'
  })
)
// for parsing application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: true
  })
)

// mongo logger
app.use(
  mongooseMorgan(
    {
      collection: 'logger',
      connectionString: process.env.MONGO_URI
    },
    {},
    ':userId :method :url :response-time'
  )
)

// i18n
i18n.configure({
  locales: ['en', 'es'],
  directory: `${__dirname}/locales`,
  defaultLocale: 'en',
  objectNotation: true
})
app.use(i18n.init)

// Init all other stuff
app.use(cors())
app.use(cookieParser())
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } ))
app.use(passport.initialize())
app.use(passport.session())
app.use(compression())
app.use(helmet())
app.use(express.static('public'))
app.set('views', path.join(__dirname, 'views'))
// app.engine('html', require('ejs').renderFile)
app.set('view engine', 'pug')
app.use(require('./app/routes'))
app.use('css', express.static('public/css'))
app.use('js', express.static('public/js'))
app.use('img', express.static('public/img'))
// app.listen(app.get('port'))


// socket init
global.io = require('socket.io')(server)
const socketModule = require('./config/socket')
global.io.on('connection', (socket) => {
  socketModule.init(socket)
})

server.listen(app.get('port'), () => {
	console.log('HTTPS Server running on port ', app.get('port'))
})

// Init MongoDB
initMongo()

module.exports = app // for testing
