const mongoose = require('mongoose')

const VerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      lowercase: true,
      required: true
    },
    code: {
      type: String
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
module.exports = mongoose.model('Verification', VerificationSchema)
