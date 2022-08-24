var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;
var UserModel = require('./User')


var ProviderPrivateCalendarSchema = new Schema({
    id:Number,
    day: Date,
    availableHours:[Number],

});


ProviderPrivateCalendarSchema.pre('save', function(next) {
  var doc = this;
  
  ProviderPrivateCalendarModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class ProviderPrivateCalendarModel extends Model {
    static createProviderPrivateCalendar( data , callback) {

        return ProviderPrivateCalendarModel.create(data ,callback)
    }

    static updateProviderPrivateCalendar( data, callback){
        return ProviderPrivateCalendarModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getProviderPrivateCalendar(id , callback){
        return ProviderPrivateCalendarModel.findById(id , callback);
    }

    static getProviderPrivateCalendars(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (ProviderPrivateCalendarSchema.paths[value]) {
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
        return ProviderPrivateCalendarModel.paginate(filter, options, callback);
    }

    static deleteProviderPrivateCalendar(id , callback){
        return ProviderPrivateCalendarModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(ProviderPrivateCalendarModel, ProviderPrivateCalendarSchema);
module.exports = ProviderPrivateCalendarModel;
Constant.models['ProviderPrivateCalendar'] = {
    name: ProviderPrivateCalendarModel.name,
    collection: ProviderPrivateCalendarModel.collection.name
};