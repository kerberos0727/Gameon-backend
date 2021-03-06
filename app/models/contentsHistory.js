const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ModelSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ModelSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('ContentHistory', ModelSchema)
