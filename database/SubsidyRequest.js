var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;

var SubsidyRequestStatus = {
    PENDING: 0,
    ACCEPTTED:1,
    DECLINE:-1,
    CANCELLED:2,
}

var SubsidyRequestSchema = new Schema({
    id:Number,
    skillSet:Number,
    school: String,
    requestContactRav: {type:Number , default:1},
    ravPhone: String,
    ravName: String,
    ravEmail: String,
    therapistContact: String,
    therapistEmail:String,
    therapistPhone:String,
    note:String,
    documents:[String],
    status: {type:Number, default:0},
    dateCreated: {type:Date, default:Date.now}
});

SubsidyRequestSchema.pre('save', function(next) {
  var doc = this;
  
  SubsidyRequestModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class SubsidyRequestModel extends Model {
    static createSubsidyRequest( data , callback) {

        return SubsidyRequestModel.create(data ,callback)
    }

    static updateSubsidyRequest( data, callback){
        return SubsidyRequestModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getSubsidyRequest(id , callback){
        return SubsidyRequestModel.findById(id , callback);
    }

    static getSubsidyRequests(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (SubsidyRequestSchema.paths[value]) {
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
        return SubsidyRequestModel.paginate(filter, options, callback);
    }

    static deleteSubsidyRequest(id , callback){
        return SubsidyRequestModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(SubsidyRequestModel, SubsidyRequestSchema);
module.exports.SubsidyRequestStatus = SubsidyRequestStatus;
module.exports = SubsidyRequestModel;
Constant.models['SubsidyRequest'] = {
    name: SubsidyRequestModel.name,
    collection: SubsidyRequestModel.collection.name
};