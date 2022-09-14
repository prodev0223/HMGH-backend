const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const AppointmentModel = require('../../database/Appointment')
const socketController = require('../../socket/controller');

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

    static getByStatus(req, res){
        AppointmentModel.updateAppointment({
            _id: req.parsedData.appointId , 
            date: req.parsedData.date
        }).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

}
module.exports = ApiController;