const Constant = require('../constant')
const fs = require('fs-extra')
const {s3,s3bucket} = require('../utils/s3config')
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
var ResourceFileType = {
    image:1,
    audio:2,
    video:3,
    other:4
}
const multerUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: s3bucket,
        acl: 'public-read',
        key: function (req, file, cb) {
            var folder = '';
            if(file.mimetype.indexOf('image') >= 0){
                folder = 'images/';
                req.parsedData.type = ResourceFileType.image;
            }else if(file.mimetype.indexOf('video') >= 0){
                folder = 'videos/';
                req.parsedData.type = ResourceFileType.video;
            }else if(file.mimetype.indexOf('audio')>=0){
                folder = 'audio/';
                req.parsedData.type = ResourceFileType.audio;
            }else{
                folder = 'other/';
                req.parsedData.type = ResourceFileType.other;
            }
            var ext = getExtension(file.originalname);
            var fileName = Date.now().toString()
            if(typeof req.user._id != 'undefined'){
                fileName+=req.user._id 
            }
            cb(null, folder + fileName  + '.' + ext );
        }
    })
}).single('file') ; //.array('file', 1);

const multerUploadServersideFile = (uploadFilePath , s3FileName , callback) => {
    // Read content from the file
    const fileContent = fs.readFileSync(uploadFilePath);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: s3FileName, // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        console.log(`File uploaded successfully. ${data.Location}`);
        callback&&callback(err,data)
    });
};

function getExtension(filename) {
    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
}
module.exports = (req, res , next)=>{
    
    multerUpload(req, res, function (err ) {
        if (err) {
            throw err;
        }else{
            next();
        }
    })
}

// module.exports.multerUploadServersideFile = multerUploadServersideFile


