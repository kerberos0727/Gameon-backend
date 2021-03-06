const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const ModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String
    },
    location: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ModelSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('University', ModelSchema)
