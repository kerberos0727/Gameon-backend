const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const SportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String
    },
    enable: {
      type: Boolean,
      default: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

SportSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Sport', SportSchema)
