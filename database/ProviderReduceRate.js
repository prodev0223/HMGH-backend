var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;

var ProviderReduceRateSchema = new Schema({
    id:Number,
    level:Number,
    rate: Number,
    reduce:Number,
});

ProviderReduceRateSchema.pre('save', function(next) {
  var doc = this;
  
  ProviderReduceRateModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class ProviderReduceRateModel extends Model {
    static createProviderReduceRate( data , callback) {

        return ProviderReduceRateModel.create(data ,callback)
    }

    static updateProviderReduceRate( data, callback){
        return ProviderReduceRateModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getProviderReduceRate(id , callback){
        return ProviderReduceRateModel.findById(id , callback);
    }

    static getProviderReduceRates(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (ProviderReduceRateSchema.paths[value]) {
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
        return ProviderReduceRateModel.paginate(filter, options, callback);
    }

    static deleteProviderReduceRate(id , callback){
        return ProviderReduceRateModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(ProviderReduceRateModel, ProviderReduceRateSchema);
module.exports = ProviderReduceRateModel;
Constant.models['ProviderReduceRate'] = {
    name: ProviderReduceRateModel.name,
    collection: ProviderReduceRateModel.collection.name
};