const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const StudentServiceModel = require('../../database/StudentService');
const ParentInfoModel = require('../../database/ParentInfo');
const ProviderInfoModel = require('../../database/ProviderInfo');
const UserModel = require('../../database/User');
const StudentInfoModel = require('../../database/StudentInfo');
const AppointmentModel = require('../../database/Appointment');
const { validAndCreate1StudentInfo } = require('../bridge/client_user');
const SchoolSessionModel = require('../../database/SchoolSession');

const socketController = require('../../socket/controller');
const ApiController = require('./api.controller');
var mongoose = require('mongoose');
const SchoolInfoModel = require('../../database/SchoolInfo');
const SubsidyRequestModel = require('../../database/SubsidyRequest');
const reversePopulate = require('mongoose-reverse-populate-v2');

class CustomController extends ApiController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200);
    }  

    static getAllSchools(req,res){
        SchoolInfoModel.getAllSchoolName().then(schools=>{
            BaseController.generateMessage(res, !schools,schools);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getDefaultValueForClient(req, res) {
        StudentServiceModel.find().then(listServices=>{
            BaseController.generateMessage(res, 0,{
                listServices:listServices,
                MaritialType: ParentInfoModel.MaritialType,
                AcademicLevel: ProviderInfoModel.AcademicLevel,
                SkillSet: ProviderInfoModel.SkillSet
            });
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
        
    }

    static getParentProfile(req,res){
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"parentInfo" ).then(id=>{
            ParentInfoModel.getParentInfo(id).then(parentInfo=>{
                BaseController.generateMessage(res, !parentInfo,parentInfo);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getChildProfile(req,res){
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"studentInfos" ).then(ids=>{
            StudentInfoModel.getStudentInfoByIds(ids).then(students=>{
                BaseController.generateMessage(res, !students,students);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static updateChildProfile(req,res){
        StudentInfoModel.updateStudentInfo(req.parsedData).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static updateParentProfile(req,res){
        ParentInfoModel.updateParentInfo(req.parsedData).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }


    static async updateSchedule(req,res){
        var result = [];
        
        var listAvailabilitySchedule = req.parsedData.availabilitySchedule;
        var studentInfo = await StudentInfoModel.getStudentInfo(req.parsedData.studentInfoId);
        for(var i = 0 ; i < listAvailabilitySchedule.length ; i++){
            if(listAvailabilitySchedule[i]._id != undefined){
                // exist on db
                var resultUpdate = await SchoolSessionModel.updateOne(listAvailabilitySchedule[i]._id , listAvailabilitySchedule[i]).catch(err=>{return undefined});
                if(resultCreate!=undefined){
                    result.push(resultUpdate);
                }else{
                    result.push(('error on update item' + i+ ' '+ JSON.stringify(listAvailabilitySchedule[i])));
                }
                
            }else{
                var resultCreate = await SchoolSessionModel.create(listAvailabilitySchedule[i]).then(sche=>{return sche._id;}).catch(err=>{return undefined;});
                if(resultCreate!=undefined){
                    result.push(resultCreate);
                    studentInfo.availabilitySchedule.push(resultCreate)
                }else{
                    result.push(('error on add item' + i + ' ' + JSON.stringify(listAvailabilitySchedule[i])));
                }   
                
            }
        }
    }

    static removeScheduleItem(req,res){
        StudentInfoModel.removeAvailabilitySchedule(req.parsedData.studentId , req.parsedData.availabilityScheduleItem ).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static async addChild(req,res){
        var newChild = validAndCreate1StudentInfo(req.parsedData);
        if(newChild==undefined){
            BaseController.generateMessage(res, 'cannot add child');
        }else{
            req.user.user.studentInfos.push(newChild);
            req.user.user.save();
            BaseController.generateMessage(res, 0,newChild);
        }
    }

    static searchProviders(req,res){
        ProviderInfoModel.getProviderInfos(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }


    static createAppoinment(req,res){
        var postData = req.parsedData;
        postData.requester = req.user.user._id;
        AppointmentModel.createAppointment(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
            socketController.emitFromHttp( postData.provider , 'new_appoint_from_client', 0 , data  );
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyAppointments(req,res){
        var searchData = req.parsedData;
        if( searchData.filter == undefined){
            searchData.filter = {}
        }
        if(searchData.filter.requester == undefined){
            searchData.filter.requester= req.user.user._id;
        }
        searchData.sort = {date:1};
        AppointmentModel.getAppointments(searchData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyAppointmentsInMonth(req, res){
        AppointmentModel.aggregate([
            {$addFields: {  "month" : {$month: '$date'},
            "year" : {$year: '$date'}
            }},
            {$match: { 
                month: req.parsedData.month,
                year: req.parsedData.year,
                requester: req.user.user._id,
                status:{$in:[0,1]}
            }}
            ]).then(result=>{
                if(!!result && result.length>0){
                    var populate = [{path:'requester', select: UserModel .PublicFields} , {path: 'dependent' } , {path:'provider'}]
                    AppointmentModel.populate(result, populate).then(result2=>{
                        BaseController.generateMessage(res, !result2,result2);
                    }).catch(er=>{
                        BaseController.generateMessage(res, err);
                    })
                }else{
                    BaseController.generateMessage(res, !result,result);
                }
                
                
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
    }

    static getMySubsRequest(req,res){
        
        
        var searchParams = req.parsedData;
        if(searchParams.filter == undefined){
            searchParams.filter = {};
        }
        if(searchParams.filter.student == undefined){
            searchParams.filter.student = {$in:req.user.user.studentInfos};
        }
        SubsidyRequestModel.getSubsidyRequests(searchParams).then(result =>{
            BaseController.generateMessage(res, !result,result);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
        
    }

    static createSubsidyRequest(req,res){
        
        SubsidyRequestModel.createSubsidyRequest(req.parsedData).then(sub=>{
            BaseController.generateMessage(res, !sub,sub);
            socketController.emitFromHttp( sub.school, 'new_subsidy_request_from_client', 0 , sub  );
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static updateSubsidyForStudent(req, res){

    }
    
    static cancelSubsidyRequest(req,res){
        
    }

    static appealSubsidyRequest(req,res){
        
    }
}
module.exports = CustomController;