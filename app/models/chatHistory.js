const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ModelSchema = new Schema(
  {
    from: {
      type: String,
      required: true
    },
    to: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    msg: String,
    status: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

module.exports = mongoose.model('ChatHistory', ModelSchema)
