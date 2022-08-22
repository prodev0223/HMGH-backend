var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')
var ContactNumberType = [
    'Home',
    'Work',
    'Mobile',
    'Fax',
];

var EmailType = [
    'Personal',
    'Work'
];

var SkillSet = [
    "Early Childhood",
    "General Studies",
    "Homework Assistance",
    "Kriah Specialist",
    "Limudei Kodesh",
    "Math",
    "OT",
    "OT – Carry over",
    "Play Therapy",
    "Reading Specialist",
    "Referrer – an admin is of type referrer, this option is only available to admin.",
    "Social Worker",
    "Speech Therapy",
];

var AcademicLevel =[
    'Early education',
    'Nursery',
    'Kindergarten',
    'Grades 1,2,3,4,5',
    'Middle',
    'Grades 7,8',
    'Grades 9,10,11,12',
    'College / post high school',
];

var SreenTime = ['AM','PM'];

var AcademicLevelSchema = {
    level: Number,
    rate:Number
};

var ContactNumberSchema = {
    level: Number,
    rate:Number
};

var ContactEmailSchema = {
    level: Number,
    rate:Number
};

var ProviderInfoSchema = new Schema({
    id:Number,
    name:{type:String , require:true},
    referred:String,
    serviceAddress:{type:String , require:true},
    billingAddress:{type:String , require:true},
    cityConnection:{type:String , require:true},
    licenseNumber:String,
    agency:String,
    contactNumber:[ContactNumberSchema],
    contactEmail:[ContactEmailSchema],
    proExp: {type:String , require:true},

    skillSet: {type:Number , require:true},
    yearExp: {type:Number , require:true},
    SSN:{type:Number , require:true},
    serviceableSchool: {type:Number , require:true},
    academicLevel:[AcademicLevelSchema],
    W9FormPath: {type:String , require:true},
    references: String,
    publicProfile:String,
    isSeparateEvaluationRate:{type:Number ,default:1},
    separateEvaluationRate:{type:Number ,default:0},
    isHomeVisit: {type:Number ,default:1},
    privateOffice:{type:Number ,default:1},
    isReceiptsProvided: {type:Number ,default:1},
    isNewClientScreening:{type:Number ,default:1},
    screeningTime:{type:Number ,default:1},
    sessionsInSchool: [{type: Schema.Types.ObjectId, ref: 'SchoolSessionModel'}],
    isPrivateSession: {type:Number ,default:1},
    cancellationWindow:{type:Number ,default:1},
    cancellationFee:{type:Number ,default:1},
});

ProviderInfoSchema.pre('save', function(next) {
  var doc = this;
  
  ProviderInfoModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class ProviderInfoModel extends Model {
    static createProviderInfo( data , callback) {

        return ProviderInfoModel.create(data ,callback)
    }

    static updateProviderInfo( data, callback){
        return ProviderInfoModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getProviderInfo(id , callback){
        return ProviderInfoModel.findById(id , callback);
    }

    static getProviderInfos(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (ProviderInfoSchema.paths[value]) {
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
        return ProviderInfoModel.paginate(filter, options, callback);
    }

    static deleteProviderInfo(id , callback){
        return ProviderInfoModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(ProviderInfoModel, ProviderInfoSchema);
module.exports = ProviderInfoModel;
module.exports.ContactNumberType = ContactNumberType;
module.exports.EmailType = EmailType;
module.exports.SkillSet = SkillSet;
module.exports.AcademicLevel= AcademicLevel;
Constant.models['ProviderInfo'] = {
    name: ProviderInfoModel.name,
    collection: ProviderInfoModel.collection.name
};