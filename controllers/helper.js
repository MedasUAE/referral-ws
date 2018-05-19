var moment = require('moment');
const find = require('lodash/find');
const log = require('./logs');

function getMinMaxTime(list){
    let min,max;
    const regExp = /(\d{1,2})\:(\d{1,2})/;
    list.forEach(element => {
        if(!min) min = element.slots;
        if(!max) max = element.slots;
        if(parseInt(element.slots.replace(regExp, "$1$2")) > parseInt(max.replace(regExp, "$1$2")))
            max = element.slots;
        if(parseInt(min.replace(regExp, "$1$2")) > parseInt(element.slots.replace(regExp, "$1$2")))
            min = element.slots;
    });

    return {
        min:min,
        max:max
    }
}

function makeSlots(minTime, maxTime, interval){
    let slots = [];
    const regExp = /(\d{1,2})\:(\d{1,2})/;
    minTime = parseInt(minTime.replace(regExp, "$1$2"));
    maxTime = parseInt(maxTime.replace(regExp, "$1$2"));
    
    while(maxTime > minTime){
        minTime = formatTime(minTime, interval);
        slots.push({slots: minTime});
        minTime = parseInt(minTime.replace(regExp, "$1$2"));
        minTime = minTime + interval;
    }
    return slots;

    //internal method to format time
    function formatTime(time, interval){
        let hrs,minutes;
        if(time.toString().length<4){
            minutes = parseInt(time.toString().substr(1,2));
            hrs = parseInt(time.toString().substr(0,1));    
        }
        else if(time.toString().length == 4){
            minutes = parseInt(time.toString().substr(2,2));
            hrs = parseInt(time.toString().substr(0,2));
        }
        if(minutes>59){
            minutes = "00"
            if(hrs == 23) hrs = 0;
            else hrs = hrs + 1;
        }
        if(hrs<10) hrs = "0" + hrs;
        return hrs + ":" + minutes;
    }
}

function getMonthDates(date){
    let daysInMonth = moment(date).daysInMonth(),
    index = 1,
    days = [];
    const startMonthDate = moment(date).startOf('month'),
    startDateOfMonth = moment(date).startOf('month').format("YYYY-MM-DD"),
    lastDateOfMonth = moment(date).endOf('month').format("YYYY-MM-DD"),
    startWeek = moment(date).startOf('month').week(),
    endWeek = moment(date).endOf('month').week(),
    endDay = moment(date).endOf('month').day('Saturday').week(endWeek),
    startDay = moment(date).startOf('month').day('Sunday').week(startWeek);

    //dayObj
    function getDayObj(date){
        return {
            date: moment(date).add(index,'day').format("YYYY-MM-DD"),
            day: moment(date).add(index,'day').format("D").toUpperCase(),
            value: 0
        }
    }
    
    index = startDay.diff(startMonthDate,'day');
    while(index<0){
        days.push(getDayObj(startDateOfMonth));
        index++; 
    }
    index++; // increament by one to avoid duplicate
    while(index <= daysInMonth){
        days.push({
            date: startMonthDate.date(index).format("YYYY-MM-DD"),
            day: startMonthDate.date(index).format("D").toUpperCase(),
            value: 0,
            currentMonth: true
        })
        index++;  
    }

    daysInMonth = endDay.diff(startMonthDate,'day');
    index = 1 //reinitialization
    while(index <= daysInMonth){
        days.push(getDayObj(lastDateOfMonth))
        index++;  
    }
    return days;
}

function getWeekDates(date){
    let index = 0, days = [];
    while(index < 7){
        days.push({
            date: moment(date).add(index,'day').format("YYYY-MM-DD"),
            day: moment(date).add(index,'day').format("dddd, Do MMMM YY").toUpperCase(),
            value: 0,
            currentMonth: true
        })
        index++;  
    }
    return days;
}

function mapAppointment(appointments, date, type){
    if(type == "month") days = getMonthDates(date);
    else days = getWeekDates(date);

    days.forEach(day=>{
        const aptObj = find(appointments, (apt)=>{
            return apt.appoint_date == day.date;
        });
        if(aptObj) day.value = aptObj.count;
    });

    return days
}

function makeResult(data, date, denominator=2, type="week"){
    if(!data) return [];
    const result = [], mod = data.length%denominator;
    try {
        data = mapAppointment(data,date,type)
        
        function daysArray(i, length){
            let arr = [];
            for (let index = 0; index < length; index++) {
                arr.push(data[index + i]);
            }
            return arr;
        }

        function addMultiObject(i, length){
            result.push(daysArray(i, length));
            return i + (length - 1);
        }
        
        for (let i = 0; i < data.length; i++) {
            if(mod == 0 || i <= data.length - denominator)  
                i = addMultiObject(i, denominator);
            else if(i < data.length)
                i = addMultiObject(i, (data.length - i));
            else i++;
        }
        return result;
    } catch (error) {
        const err = error.toString() + " file: helper.js ";
        log.addLog({datetime:moment().format("YYYY-MM-DD HH:mm:SS"), error:err, action:"makeResult"})
        return result;
    }

    
}

exports.getMinMaxTime = getMinMaxTime;
exports.makeSlots = makeSlots;
exports.getMonthDates = getMonthDates;
exports.getWeekDates = getWeekDates;
exports.makeResult = makeResult;
exports.mapAppointmentInMonth = mapAppointment;