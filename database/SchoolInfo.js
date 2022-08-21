var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')
var ContactType = {
    address: 1,
    gmail: 2, 
    here: 0
}

var SchoolInfoSchema = new Schema({
    contactType: Number,
    name: String,
    communityServed: {type: Schema.Types.ObjectId, ref: 'SchoolCommunityModel'},
    valueForContact: String,
    sessionsInSchool: [{type: Schema.Types.ObjectId, ref: 'SchoolSessionModel'}],
    sessionsAfterSchool: [{type: Schema.Types.ObjectId, ref: 'SchoolSessionModel'}],
    techContactRef: [String],
    studentContactRef:[String],
});

SchoolInfoSchema.pre('save', function(next) {
  var doc = this;
  
  SchoolInfoModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class SchoolInfoModel extends Model {
    static createSchoolInfo( data , callback) {

        return SchoolInfoModel.create(data ,callback)
    }

    static updateSchoolInfo( data, callback){
        return SchoolInfoModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getSchoolInfo(id , callback){
        return SchoolInfoModel.findById(id , callback);
    }

    static getSchoolInfos(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (SchoolInfoSchema.paths[value]) {
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
        return SchoolInfoModel.paginate(filter, options, callback);
    }

    static deleteSchoolInfo(id , callback){
        return SchoolInfoModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(SchoolInfoModel, SchoolInfoSchema);
module.exports = SchoolInfoModel;
module.exports.SchoolInfoType = SchoolInfoType;
Constant.models['SchoolInfo'] = {
    name: SchoolInfoModel.name,
    collection: SchoolInfoModel.collection.name
};