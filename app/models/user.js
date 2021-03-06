const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const UserSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      required: true,
      default: 'local'
    },
    fbAuth: {
      id: {
        type: String
      },
      token: {
        type: String
      }
    },
    googleAuth: {
      id: {
        type: String
      },
      token: {
        type: String
      }
    },
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'EMAIL_IS_NOT_VALID'
      },
      lowercase: true,
      required: true
    },
    phone: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'team', 'leader', 'admin'],
      default: 'user'
    },
    verification: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    blockExpires: {
      type: Date,
      default: Date.now,
      select: false
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fullfilled: {
      type: Boolean,
      default: false
    },
    enable: {
      type: Boolean,
      default: true
    },
    users_who_liked_me : [{
      type: mongoose.Schema.Types.ObjectId ,
      ref: 'User',
    }],
    users_i_liked : [{
      type: mongoose.Schema.Types.ObjectId ,
      ref: 'User',
    }],
    profile: {
      firstName: {
        type: String
      },
      lastName: {
        type: String
      },
      gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
      },
      age: {
        type: Number
      },
      imageUrl: {
        type: String
      },
      bio: {
        description: String,
        university: String
      },
      ability: [
        {
          sportId: {
            type: Schema.Types.ObjectId,
            ref: 'sport'
          },
          level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'team'],
            default: 'beginner'
          }
        }
      ],
      sports: {
        type: Array
      },
      availability: {
        sun: {
          type: Array,
          default: [0, 0, 0]
        },
        mon: {
          type: Array,
          default: [0, 0, 0]
        },
        tue: {
          type: Array,
          default: [0, 0, 0]
        },
        wed: {
          type: Array,
          default: [0, 0, 0]
        },
        thu: {
          type: Array,
          default: [0, 0, 0]
        },
        fri: {
          type: Array,
          default: [0, 0, 0]
        },
        sat: {
          type: Array,
          default: [0, 0, 0]
        }
      },

      location: {
        lat: Number,
        lng: Number,
        address: String
      }
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

const hash = (user, salt, next) => {
  bcrypt.hash(user.password, salt, (error, newHash) => {
    if (error) {
      return next(error)
    }
    user.password = newHash
    return next()
  })
}

const genSalt = (user, SALT_FACTOR, next) => {
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err)
    }
    return hash(user, salt, next)
  })
}

UserSchema.pre('save', function (next) {
  const that = this
  const SALT_FACTOR = 5
  if (!that.isModified('password')) {
    return next()
  }
  return genSalt(that, SALT_FACTOR, next)
})

UserSchema.methods.comparePassword = function (passwordAttempt, cb) {
  bcrypt.compare(passwordAttempt, this.password, (err, isMatch) =>
    err ? cb(err) : cb(null, isMatch)
  )
}
UserSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('User', UserSchema)
