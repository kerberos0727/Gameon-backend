const mongoose = require('mongoose')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ModelSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    subName: {
      type: String
    },
    imageUrl: {
      type: String
    },
    description: {
      type: String
    },
    availability: Array,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    formUrl: {
      type: String,
      validate: {
        validator(v) {
          return v === '' ? true : validator.isURL(v)
        },
        message: 'NOT_A_VALID_URL'
      },
      lowercase: true
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'private' // true - public, false - private
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ModelSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Event', ModelSchema)
