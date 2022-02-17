const express = require("express");
const { route } = require("express/lib/application");
const router = express.Router();
const uploadImageController = require("../controllers/uploadImageController.js")



router.post('/',uploadImageController.uploadMulterS3ImageUploadInfo,uploadImageController.AWSS3ImgaeUpload)
router.get('/',uploadImageController.getUploadImage)
router.get('/pagination',uploadImageController.getPaginatedImage)
module.exports = router;