const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const GameSchema = new mongoose.Schema(
  {
    creator: {
      type: String,
      required: true
    },
    partner: {
      type: String,
      required: true
    },
    enable: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

GameSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Game', GameSchema)
