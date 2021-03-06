const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema

const ModelSchema = new Schema(
  {
    cardId: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    cardType: {
      type: String,
      enum: ['trial', 'training', 'event'],
      required: true
    },
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

ModelSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('CardRejectHistory', ModelSchema)
