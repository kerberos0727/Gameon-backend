const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ModelSchema = new Schema(
  {
    name: {
      type: String
    },
    chief: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    players: [
      {
        type: String
      }
    ],
    visibility: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String
    },
    description: {
      type: String
    },
    availability: {
      type: Array,
      default: []
    },
    sport: {
      type: String,
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ModelSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Team', ModelSchema)
