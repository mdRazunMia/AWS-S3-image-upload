const { MongoClient } = require('mongodb')
const fs = require("fs")
const ObjectId = require('mongodb').ObjectId
const multer = require("multer")
const aws = require('aws-sdk')
const muterS3 = require('multer-s3')
const md5 = require("md5")
const path = require("path")
const constant = require('../constants/constants')

//connect with bucket

const S3 = new aws.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    region: process.env.AWS_S3_REGION
})

//upload image into s3

const uploadMulterS3ImageUploadInfo = multer({
    storage: muterS3({
        s3: S3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb)=>{
            cb(null, {fileName: file.fieldname})
        },
        key: (req, file, cb)=>{
            cb(null,md5(file.originalname)+Date.now()+path.extname(file.originalname))
        }
    })
}).single('s3-image')

//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

//console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();
console.log('connected to the database');
const database = client.db("dotOnline");
const uploadImageCollection = database.collection("upload_image");

const AWSS3ImgaeUpload = async (req, res, next)=>{
    const filePath = req.file.location
    const imageInfo = {
        "name": md5(req.file.originalname)+path.extname(req.file.originalname),
        "path": filePath
        
    }
    const uploadImageResponse= await uploadImageCollection.insertOne(imageInfo)
    res.send(uploadImageResponse)
}



const getPaginatedImage = (req, res)=>{
    let requestedItems = 0
    let requestedPageNumber = 0
    const checkPage = req.query.page
    const checkItems = req.query.items
    if(typeof checkPage === 'undefined'){
        requestedPageNumber = constant.PAGE
    }else{
        requestedPageNumber  = parseInt(req.query.page)
    }
    
    if(typeof checkItems === 'undefined'){
        requestedItems = constant.ITEMS
    }else{
        const items = parseInt(req.query.items)
        if(items <= constant.MAX_ITEMS){
            requestedItems = items
        }else{
            requestedItems = constant.MAX_ITEMS
        }        
    }
    uploadImageCollection.find({}).toArray(function(err, result) {
        if (err) throw err;
        let totalImageLength = result.length
        let totalPage = Math.ceil(totalImageLength/requestedItems)
        let initialValue = -1
        initialValue = (requestedPageNumber-1)*requestedItems
        let endValue = initialValue + requestedItems - 1 
        if((requestedPageNumber <= totalPage) && requestedPageNumber != 0){
            let requestedArrayOfImages = []
            let counter = 0
            for(var i = initialValue; i <= endValue; i++){
                if(result[i] != null){
                    requestedArrayOfImages[counter] = result[i];
                    counter = counter + 1
                }          
            }
            let nextButton = false
            if(requestedPageNumber < totalPage){
                nextButton = true
            }
            const data  = {}
            data.items= requestedArrayOfImages
            data.meta={
                "totalPage": totalPage,
                "nextPage": nextButton,
                "currentPage": requestedPageNumber
            }
            res.send(data)
        }else{
            res.send({message:`Page number ${requestedPageNumber} is invalid`})
        }

    });
}







const getUploadImage = (req, res)=>{
    const allImages = uploadImageCollection.find({}).toArray(function(err, result) {
        if (err) throw err;
        res.send(result);
    });
}



module.exports = {
    getUploadImage,
    getPaginatedImage,
    uploadMulterS3ImageUploadInfo,
    AWSS3ImgaeUpload
}