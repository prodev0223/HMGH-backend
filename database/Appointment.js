var mongoose = require('mongoose')
var Constant = require('../constant.js');
var { Model, Schema } = mongoose;

var AppoinmentStatus = {
    PENDING: 0,
    ACCEPTTED:1,
    DECLINE:-1,
    CANCELLED:2,
}

var AppointmentSchema = new Schema({
    id:Number,
    requester:  { type: Schema.Types.ObjectId, ref: 'UserModel' },
    skillSet: [Number],
    dependent: { type: Schema.Types.ObjectId, ref: 'StudentInfoModel' },
    provider:  { type: Schema.Types.ObjectId, ref: 'ProviderInfoModel' },
    date: {type:Date},
    status: Number,
    reason: String,
    note:String,
    location:String,
});

AppointmentSchema.pre('save', function(next) {
  var doc = this;
  
  AppointmentModel.findOne({}).sort('-id').exec(function(err,  last){
      
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

class AppointmentModel extends Model {
    static createAppointment( data , callback) {

        return AppointmentModel.create(data ,callback)
    }

    static updateAppointment( data, callback){
        return AppointmentModel.findByIdAndUpdate(data._id, { $set: data }, { new: true } , callback)
    }

    static getAppointment(id , callback){
        return AppointmentModel.findById(id , callback);
    }

    static getAppointments(data , callback){
        let options = {};
        options['sort'] = data.sort || { dateSent: -1 };
        if (data.limit != undefined) options['limit'] = Number(data.limit);
        if (data.page != undefined) options['page'] = Number(data.page);
        let filter = {};
        if (data.filter && Object.keys(data.filter).length > 0) {
            var fArr = [];
            Object.keys(data.filter).forEach(function (value) {
                if (AppointmentSchema.paths[value]) {
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
        return AppointmentModel.paginate(filter, options, callback);
    }

    static deleteAppointment(id , callback){
        return AppointmentModel.findByIdAndRemove(id , callback);
    }
}


mongoose.model(AppointmentModel, AppointmentSchema);
module.exports = AppointmentModel;
Constant.models['Appointment'] = {
    name: AppointmentModel.name,
    collection: AppointmentModel.collection.name
};