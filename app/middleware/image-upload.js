const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const utils = require('./utils')

aws.config.update({
  secretAccessKey: process.env.AWS_SECURITY_ACCESS_KEY,
  accessKeyId: process.env.AWS_SECURITY_ACCESS_KEY_ID,
  region: 'eu-west-2'
})

const s3 = new aws.S3()

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    return cb(null, true)
  }
  return cb(
    new Error('Invalid file type, only JPEG and PNG is allowed!'),
    false
  )
}

const upload = multer({
  fileFilter,
  storage: multerS3({
    acl: 'public-read',
    s3,
    bucket: 'gameon-board-images',
    metadata(req, file, cb) {
      cb(null, { fieldName: 'TESTING_METADATA' })
    },
    key(req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

const uploadStringImg = (req, res) => {
  return new Promise(async (resolve, reject) => {
    const buf = Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ""),'base64')

    var data = {
      Bucket: 'gameon-board-images',
      ACL: 'public-read',
      Key: req.body.name,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    };
    try {
      const { Location, Key } = await s3.upload(data).promise();
      resolve({Location, Key})
    } catch (error) {
      reject(utils.buildErrObject(422, err.message))
    }
  })

}

module.exports = {
  upload,
  uploadStringImg
}
