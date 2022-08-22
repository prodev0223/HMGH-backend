var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')


var SchoolSessionSchema = new Schema({
    id:Number,
    dayInWeek: Number,
    openHour: Number,
    openMin: Number,
    closeHour: Number,
    closeMin: Number,

});


SchoolSessionSchema.pre('save', function(next) {
  var doc = this;
  
  SchoolSessionModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class SchoolSessionModel extends Model {
    static createSchoolSession( data , callback) {

        return SchoolSessionModel.create(data ,callback)
    }

    static updateSchoolSession( data, callback){
        return SchoolSessionModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getSchoolSession(id , callback){
        return SchoolSessionModel.findById(id , callback);
    }

    static getSchoolSessions(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (SchoolSessionSchema.paths[value]) {
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
        return SchoolSessionModel.paginate(filter, options, callback);
    }

    static deleteSchoolSession(id , callback){
        return SchoolSessionModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(SchoolSessionModel, SchoolSessionSchema);
module.exports = SchoolSessionModel;
Constant.models['SchoolSession'] = {
    name: SchoolSessionModel.name,
    collection: SchoolSessionModel.collection.name
};