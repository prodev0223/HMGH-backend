const pdf = require('html-pdf')
const fs = require('fs')
const debug =require('debug')('truck')
function exportToPdf (htmlFilePath, _callback) {
  const html = fs.readFileSync(htmlFilePath, 'utf8')
  const options = {format: 'Letter'}

  pdf.create(html, options).toFile('./businesscard.pdf', function (err, res) {
    if (err) return debug(err)
    debug(res) // { filename: '/app/businesscard.pdf' }
    if (typeof _callback !== 'undefined') {
      _callback(res)
    }
  })
}

var requestify = require('requestify');

function exportToPdfWithUrl(url , outputPath , callback){
  requestify.get(url).then(function (response) {
    var html = response.body; 
    var config = {format: 'A4'};
    pdf.create(html, config).toFile(outputPath , callback);
    // pdf.create(html, config).toFile(outputPath , function (err, res) {
    //   if (err) return console.log(err);
    //   console.log(res); // { filename: '/pathtooutput/generated.pdf' }
    // });
  }).catch(err=>{
    console.log(err);
  });
}



function exportToPdfWithHtmlContent (htmlContent, outputPath, modifyOptions) {
  var options = {format: 'A4'}
  if(typeof modifyOptions!='undefined'){
    options = modifyOptions;
  }
  return pdf.create(htmlContent, options).toFile(outputPath, function (err, res) {
    if (err){
      _callback(0, err)
      return debug(err)
    } 
    debug(res) // { filename: '/app/businesscard.pdf' }
    if (typeof _callback !== 'undefined') {
      _callback(1, outputPath)
    }
  })
}

module.exports = pdf
module.exports.exportToPdf = exportToPdf
module.exports.exportToPdfWithUrl = exportToPdfWithUrl
module.exports.exportToPdfWithHtmlContent = exportToPdfWithHtmlContent