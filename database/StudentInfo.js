var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')



var StudentInfoSchema = new Schema({
    id:Number,
    firstName:{type:String, require:true}, 
    lastName:{type:String, require:true}, 
    birthday:{type:Date},
    guardianPhone:{type:String, require:true}, 
    guardianEmail:{type:String, require:true}, 
    backgroundInfor:{type:String, require:true}, 
    school:{type:String, require:true}, 
    primaryTeacher:{type:String, require:true}, 
    currentGrade:{type:String, require:true}, 
    services: [ { type: Schema.Types.ObjectId, ref: 'StudentServiceModel' }],
    hasIEP:{type:Number, default:1},
    subsidyRequest:{ type: Schema.Types.ObjectId, ref: 'SubsidyRequestModel' },
    availabilitySchedule:[{type: Schema.Types.ObjectId, ref: 'SchoolSessionModel'}],
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

    static getStudentInfoByIds(ids, callback){
        return StudentInfoModel.find({_id:{$in: ids}} , callback);
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
Constant.models['StudentInfo'] = {
    name: StudentInfoModel.name,
    collection: StudentInfoModel.collection.name
};