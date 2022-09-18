const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const AppointmentModel = require('../../database/Appointment')
const socketController = require('../../socket/controller');
const SubsidyRequestModel = require('../../database/SubsidyRequest')

class ApiController extends BaseController {

    static emitFromHttp(room, key , error , data){
        socketController.emitFromHttp( room, key, error , data  );
    }

    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }


    static cancelAppointMent(req, res){
        AppointmentModel.updateAppointment({
            _id: req.parsedData.appointId , 
            status: AppointmentModel.AppoinmentStatus.CANCELLED
        }).then(result=>{
            BaseController.generateMessage(res, 0, result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static rejectAppointMent(req, res){
        AppointmentModel.updateAppointment({
            _id: req.parsedData.appointId , 
            status: AppointmentModel.AppoinmentStatus.DECLINE
        }).then(result=>{
            BaseController.generateMessage(res, 0, result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static changeTimeAppointMent(req, res){
        AppointmentModel.updateAppointment({
            _id: req.parsedData.appointId , 
            date: req.parsedData.date
        }).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static getAppointmentByStatus(req, res){
        // AppointmentModel.updateAppointment({
        //     _id: req.parsedData.appointId , 
        //     date: req.parsedData.date
        // }).then(result=>{
        //     BaseController.generateMessage(res, 0,result)
        // }).catch(err=>{
        //     BaseController.generateMessage(res, err)
        // })
    }

    static getSubsidyDetail(req,res){
        SubsidyRequestModel.getSubsidyRequest(req.parsedData.subsidyId).then(result=>{
            BaseController.generateMessage(res, !result,result);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static createConsulation(req,res){
        var newAppoint = {
            requester: req.user.user._id,
            school: req.parsedData.school,
            dependent: req.parsedData.dependent,
            skillSet:req.parsedData.skillSet,
            typeForAppointLocation: req.parsedData.typeForAppointLocation ,
            location: req.parsedData.location,
            date:req.parsedData.date,
            name: req.parsedData.name,
            type: 1,// Consulation
        };
        AppointmentModel.createAppointment(newAppoint).then(result=>{
            SubsidyRequestModel.updateOne({_id: req.parsedData.subsidyId } , {$set: {consulation: result._id}}).then(()=>{
                BaseController.generateMessage(res, !result,result._id);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static editConsulation(req,res){
        req.parsedData._id = req.parsedData.consulationId;
        AppointmentModel.updateAppointment(req.parsedData).then(result=>{
            BaseController.generateMessage(res, !result,result);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }
    

}
module.exports = ApiController;