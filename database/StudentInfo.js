var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')
var ContactType = {
    address: 1,
    gmail: 2, 
    here: 0
}


var StudentInfoSchema = new Schema({
    id:Number,
    contactType: Number,
    name: String,
    valueForContact: String,
    sessions: [SchoolSessionSchema],
    techContactRef: [String],
    studentContactRef:[String],
});

StudentInfoSchema.pre('save', function(next) {
  var doc = this;
  
  StudentInfoModel.findOne({}).sort('-id').exec(function(err,  last){
      
        if(doc.id > 0){
            next();
            return;
        }
        if(err || last == null){
            doc.id = 1;
        }else{
            doc.id = last.id + 1;
        }
        next();
    })
});

var PublicFields = [];

class StudentInfoModel extends Model {
    static createStudentInfo( data , callback) {

        return StudentInfoModel.create(data ,callback)
    }

    static updateStudentInfo( data, callback){
        return StudentInfoModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getStudentInfo(id , callback){
        return StudentInfoModel.findById(id , callback);
    }

    static getStudentInfos(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (StudentInfoSchema.paths[value]) {
                    let f = {};
                    if (Array.isArray(data.filter[value])) {
                        if (data.filter[value].length > 0) f[value] = { $in: data.filter[value] }
                    } else if (typeof data.filter[value] == "number") {
                        f[value] = data.filter[value];
                    } else {
                        f[value] = new RegExp(data.filter[value], 'ig');
                    }

                    if (Object.keys(f).length) fArr.push(f);
                }
            });
            if (fArr.length > 0) filter['$and'] = fArr;
        }
        if (data.search && typeof (data.search) == 'string' && data.search.length) {
            if (!filter['$and']) filter['$and'] = [];
            filter.$and.push({
                $or: [{ 'title': { '$regex': data.search, '$options': 'i' } },
                { 'text': { '$regex': data.search, '$options': 'i' } }
            ]
            });
        }
        options.select = PublicFields;
        return StudentInfoModel.paginate(filter, options, callback);
    }

    static deleteStudentInfo(id , callback){
        return StudentInfoModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(StudentInfoModel, StudentInfoSchema);
module.exports = StudentInfoModel;
module.exports.StudentInfoType = StudentInfoType;
Constant.models['StudentInfo'] = {
    name: StudentInfoModel.name,
    collection: StudentInfoModel.collection.name
};