const mongoose = require('mongoose')

const SettingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    gender: [{
      sport: String,
      value: String
    }],
    age: {
      type: Array,
      default: []
    },
    location: [{
      lat: Number,
      lng: Number,
      address: String
    }],
    distance: {
      type: Array,
      default: []
    },
    seen: {
      type: Boolean,
      default: false
    },
    notifications: {
      matches: {type: Boolean, default: false},
      messages: {type: Boolean, default: false},
      training: {type: Boolean, default: false},
      socials: {type: Boolean, default: false},
      vibrations: {type: Boolean, default: false},
      sounds: {type: Boolean, default: false}
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

module.exports = mongoose.model('Setting', SettingSchema)
