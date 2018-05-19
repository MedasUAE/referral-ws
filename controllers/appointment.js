var db_query = require('../db/executeQuery');
var async = require('async');
var moment = require('moment');
var apt_query = require('../db/appointmentQuery');
var helper = require('./helper');
require('../config/global');
const groupBy = require('lodash/groupBy');

function getById (id,next){
    const columns = ['appoint_type', 'appoint_date'];
    const query = 'select ' + columns.join(',') +' from appointments where id = ?';
    const params = [parseInt(id)];
    
    db_query.paramQuery(query, params, (err, result)=>{
        if(err) return next(err);   
        return next(null,result);
    })
}

function getAppointmentByDoctorId (post_data,next){
    if(!post_data) return next("NoPOSTDATA");
    if(!post_data.appoint_date) return next("NoAptDate");
    if(!post_data.doctor_id) return next("NoDocID");
    
    const query = apt_query.queryAppointmentByDoctorId();
    const params = [post_data.doctor_id, post_data.appoint_date];

    db_query.paramQuery(query, params, (err, result)=>{
        if(err) return next(err);   
        return next(null,result);
    });
}

function getDoctorSlots(post_data, next){
    if(!post_data) return next("NoPostData");
    const date = new Date(post_data.appoint_date);
    const params = [post_data.appoint_date, post_data.appoint_date, post_data.doctor_id, date.getDay()];
    

    const join_query = apt_query.queryDoctorSlots();
    db_query.paramQuery(join_query, params, (err, result)=>{
        if(err) return next(err);  
        return next(null,result);
    });
}

function getDistinctResources(post_data, next){
    if(!post_data) return next("NoPostData");
    const date = new Date(post_data.appoint_date);
    const params = [post_data.doctor_id, post_data.appoint_date];
    

    const query = apt_query.queryDistinctResources();
    db_query.paramQuery(query, params, (err, result)=>{
        if(err) return next(err);  
        return next(null,result);
    });
}

function getResourceSlots(post_data, next){
    if(!post_data) return next("NoPostData");
    const date = new Date(post_data.appoint_date);
    const params = [post_data.appoint_date, post_data.appoint_date, post_data.resource_ids, date.getDay()];

    const join_query = apt_query.queryResourceSlots();
    db_query.paramQuery(join_query, params, (err, result)=>{
        if(err) return next(err);  
        return next(null,result);
    });
}

function getDistinctResourceSlots(post_data, next) {
    getDistinctResources(post_data, (err, resources)=>{
        if(err) return callback(err);
        if(!resources.length) next(null,[]);
        else{
            post_data.resource_ids = resources.map(r=>{return r.resource_id});
            getResourceSlots(post_data, (err, resouceSlots)=>{
                if(err) return next(err);
                const minMax = helper.getMinMaxTime(resouceSlots);
                // console.log(helper.getMinMaxTime(resouceSlots));
                // console.log(helper.makeSlots(minMax.min,minMax.max, resouceSlots[0].intrvl));
                next(null, helper.makeSlots(minMax.min,minMax.max, resouceSlots[0].intrvl));
            });
        }
    });
}

function prepareSlots(results){
    if(results.length < 2) return [];
    if(!Array.isArray(results[2])) return [];
    results[2].forEach(slot => {
        slot.time = moment().set({hour:parseInt(slot.slots.split(":")[0]),minute: parseInt(slot.slots.split(":")[1])}).format("hh:mm A");
        slot.appointments = []
        for (let index = 0; index < results[0].length; index++) {
            if(betweenTime(results[0][index].appoint_hr, results[0][index].appoint_min,slot.slots)){
                (results[0][index].op_number) ? results[0][index].new_patient = false : results[0][index].new_patient = true; //new patient Oldpatient flag
                results[0][index].status = appointmentStatus(results[0][index]); //status selection
                slot.appointments.push(results[0][index]);
                // slot.status = appointmentStatus(results[0][index]); //status selection
                // slot.appointment = results[0][index]; // appointment object
                // index = results[0].length;
            }
        }
    });
    return results[2];
}

function prepareDashboard(results){
    let CONFIRMED = 0, ARRIVED = 0, NOTCONFIRMED = 0, NEW = 0, REVISIT = 0, TOTAL = 0, CLOSED = 0, status;
    results.forEach(r=>{
        status = appointmentStatus(r)
        switch (status) {
            case "CONFIRMED":
                CONFIRMED +=1;
                break;
            case "ARRIVED":
                console.log(ARRIVED);
                ARRIVED +=1;
                break;
            case "NOTCONFIRMED":
                NOTCONFIRMED +=1;
                break;
            case "CLOSED":
                CLOSED +=1;
                break;
            default:
                console.log(appointmentStatus(r));
                break;
        }
        if (!r.op_number)  NEW +=1;
        if (r.op_number) REVISIT +=1;

        // if(r.appointments.length){
        //     r.appointments.forEach(apt=>{
        //         if (apt.status == "CONFIRMED") CONFIRMED +=1;
        //         if (apt.status == "ARRIVED") ARRIVED +=1;
        //         if (apt.status == "NOTCONFIRMED") NOTCONFIRMED +=1;
        //         if (!apt.op_number)  NEW +=1;
        //         if (apt.op_number) REVISIT +=1;
        //     })
            // if (r.status == "CONFIRMED") CONFIRMED +=1;
            // if (r.status == "ARRIVED") ARRIVED +=1;
            // if (r.status == "NOTCONFIRMED") NOTCONFIRMED +=1;
            // if (!r.appointment.op_number)  NEW +=1;
            // if (r.appointment.op_number) REVISIT +=1;
        // }
    });
    return [
        { label: "TOTAL", value: (NOTCONFIRMED+CONFIRMED+ARRIVED+CLOSED)},
        { label: "ARRIVED", value: ARRIVED},
        { label: "CONFIRMED", value: CONFIRMED},
        { label: "NOT CONFIRMED", value: NOTCONFIRMED},
        { label: "CLOSED", value: CLOSED},
        { label: "NEW", value: NEW},
        { label: "REVISIT", value: REVISIT},
    ];
}

function betweenTime(fromTime,toTime,slot) {
    var regExp = /(\d{1,2})\:(\d{1,2})/;
    if(
        (parseInt(fromTime.replace(regExp, "$1$2$3")) <= parseInt(slot.replace(regExp,"$1$2$3")))
        &&
        (parseInt(slot.replace(regExp,"$1$2$3")) < parseInt(toTime.replace(regExp, "$1$2$3")))
    ){
        return true;
    }
    else {return false;}
}

function appointmentStatus(aptObj){
    let status;
    (aptObj.confirm_status == 'N' && aptObj.appoint_status == 'Y') ? status = global.status.CONFIRMED : status = global.status.NOTCONFIRMED;
    if(aptObj.doctor_view == 'Y') status = global.status.ARRIVED;
    if(aptObj.bill_submit == 'Y') status = global.status.CLOSED;
    if(aptObj.appoint_name.toUpperCase() == 'BLOCKED') status = global.status.BLOCKED;
    return status;
}
    
function getDocAppointment(post_data, next){
    async.parallel([
        function(callback) {
            getAppointmentByDoctorId(post_data,(err,result)=>{
                if(err) return callback(err);
                callback(null, result);
            })
        },
        function(callback) {
            getDoctorSlots(post_data,(err,slots)=>{
                if(err) return callback(err);
                // console.log(slots);
                callback(null, slots);
            })
        },
        function (callback) {
            getDistinctResourceSlots(post_data, (err, result)=>{
                if(err) return callback(err);
                callback(null, result);
            });
        },
        // function (callback) {
        //     getResourceSlots(post_data, (err, resouceSlots)=>{
        //         if(err) return callback(err);
        //         callback(null, resouceSlots);
        //     });
        // }
    ],
    // optional callback
    function(err, results) {
        if(err) return next(err);
        // console.log(results);
        let data = {list:prepareSlots(results)};
        // let data = {list:results};

        data.dashboard = prepareDashboard(results[0]);
        return next(null,data);
    });
}

// function groupByAppt(list){
//     const aptList = groupBy(list,'appoint_date')
//     let newGB = {};
//     for(let apt in aptList){
//         // console.log(moment(apt).format("YYYY-MM-DD"));
//         newGB[moment(apt).format("YYYY-MM-DD")] = aptList[apt];
//     }
//     return newGB;
// }

function transformMonthly(data, date,  denominator = 2){
    return helper.makeResult(data,date,denominator, "month");
    // const result = [], mod = data.length%denominator;
    // // console.log(moment(data[0].appoint_date).month())
    // // console.log(helper.mapAppointmentInMonth(data,moment(data[0].appoint_date)));
    // data = helper.mapAppointmentInMonth(data,moment(data[0].appoint_date))
    // // let index = 0;
    // function dayObject(obj){
    //     return obj;
    //     // return {
    //     //     date: obj.appoint_date,
    //     //     day: moment(obj.appoint_date).format("dddd, Do MMM").toUpperCase(),
    //     //     value: obj.count
    //     // }
    // }

    // function daysArray(i, length){
    //     let arr = [];
    //     for (let index = 0; index < length; index++) {
    //         arr.push(dayObject(data[index + i]));
    //     }
    //     return arr;
    // }

    // function addMultiObject(i, length){
    //     result.push(daysArray(i, length));
    //     return i + (length - 1);
    //     // console.log("i", i,"length",length, "total length", data.length);
    //     // result.push([weekObject(data[i]),weekObject(data[i+1])]);
    //     // index += 1;
    // }
    // // function addSingleObject(i){
    // //     result.push([dayObject(data[i])]);
    // //     // index = 0;
    // // }

    // for (let i = 0; i < data.length; i++) {
    //     if(mod == 0 || i <= data.length - denominator)  
    //         i = addMultiObject(i, denominator);
    //     else if(i < data.length)
    //         i = addMultiObject(i, (data.length - i));
    //     else i++;
    // }
    // return result;
}

function transformWeekly(data, date){
    return helper.makeResult(data,date,1,"week")
}

function getWeeklyAppointment(post_data, next){
    try {
        if(!post_data) return next("no post_data");
        const query = apt_query.queryAppointmentByRange();
        const params = [post_data.doctor_id, post_data.start_appoint_date, post_data.end_appoint_date];
        db_query.paramQuery(query, params, (err, result)=>{
            if(err) return next(err);         
            return next(null,transformWeekly(result, post_data.start_appoint_date));
        });
    } catch (error) {
        return next(null,[]);
    }
    
}

function getMonthlyAppointment(post_data, next){
    try {
        if(!post_data) return next("no post_data");
        const query = apt_query.queryAppointmentByRange();
        const params = [post_data.doctor_id, post_data.start_appoint_date, post_data.end_appoint_date];
        db_query.paramQuery(query, params, (err, result)=>{
            if(err) return next(err); 
            if(!result) return next("noresult");       
            // if(!result.length) return next(null, result); 
            return next(null,transformMonthly(result, post_data.start_appoint_date, 7));
        });
    } catch (error) {
        console.log("***** new error ***");
        return new Error(error);      
    }
}

exports.getById = getById;
exports.getByDoctorId = getDocAppointment;
exports.getDoctorSlots = getDoctorSlots;
exports.getWeeklyAppointment = getWeeklyAppointment;
exports.getMonthlyAppointment = getMonthlyAppointment;