const Constant = require('../constant')
const fs = require('fs-extra')
const {s3,s3bucket} = require('../utils/s3config')
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const uploadServersideFile = (uploadFilePath , s3FileName , callback) => {
    // Read content from the file
    const fileContent = fs.readFileSync(uploadFilePath);

    var folder = 'images/';
    var extention = getExtension(uploadFilePath);
    if(extention == 'pdf' || extention=='epub'){
        folder = 'book_exports/'
    }
        
    // Setting up S3 upload parameters
    const params = {
        Bucket: s3bucket,
        ACL: 'public-read',
        Key: folder+ s3FileName, // File name you want to save as in S3
        Body: fileContent,
        
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
module.exports = uploadServersideFile