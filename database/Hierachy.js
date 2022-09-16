var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;

var HierachySchema = new Schema({
    id:Number,
    name: String,
    createdBy:{ type: Schema.Types.ObjectId, ref: 'UserModel' },
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolInfoModel' },
});

HierachySchema.pre('save', function(next) {
  var doc = this;
  
  HierachyModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class HierachyModel extends Model {
    static createHierachy( data , callback) {

        return HierachyModel.create(data ,callback)
    }

    static updateHierachy( data, callback){
        return HierachyModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getHierachy(id , callback){
        return HierachyModel.findById(id , callback);
    }

    static getHierachys(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (HierachySchema.paths[value]) {
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
                $or: [{ 'name': { '$regex': data.search, '$options': 'i' } },
                { 'text': { '$regex': data.search, '$options': 'i' } }
            ]
            });
        }
        options.select = PublicFields;
        return HierachyModel.paginate(filter, options, callback);
    }

    static deleteHierachy(id , callback){
        return HierachyModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(HierachyModel, HierachySchema);
module.exports = HierachyModel;
Constant.models['Hierachy'] = {
    name: HierachyModel.name,
    collection: HierachyModel.collection.name
};