function queryAppointmentByDoctorId(){
    const columns = [
        'apt.id',
        'apt.appoint_type', 
        'apt.appoint_name', 
        'apt.confirm_status', 
        'apt.appoint_hr' ,
        'apt.appoint_min' , 
        'apt.slot_nos', 
        'apt.op_number', 
        'apt.appoint_status', 
        'apt.doctors_id',
        'apt.resource_id',
        'apt.doctor_view', 
        'apt.bill_submit',
        'apt.appoint_purpose',
        'office.office_Name',
        'office.office_Id',
        'res.resource_Name'
    ];
    return  'SELECT ' + columns.join(',') + 
            ' FROM appointments AS apt JOIN office_details AS office ON apt.office_id = office.office_Id '+
            'LEFT OUTER JOIN resource_name AS res ON apt.resource_id = res.resource_id ' +
            'WHERE apt.doctors_id = ? AND apt.appoint_date = ? AND cancel_status=\'N\'';
}

function queryAppointmentByRange(){
    const columns = [
        'DATE_FORMAT(apt.appoint_date, "%Y-%m-%d") AS appoint_date',
        'count(appoint_date) AS count'
    ];
    return  'SELECT ' + columns.join(',') + 
            ' FROM appointments AS apt JOIN office_details AS office ON apt.office_id = office.office_Id '+
            'LEFT OUTER JOIN resource_name AS res ON apt.resource_id = res.resource_id ' +
            'WHERE apt.doctors_id = ? AND ' +
            'apt.appoint_date >= ? AND ' +
            'apt.appoint_date <= ? AND ' +
            'cancel_status=\'N\'' +
            ' group by appoint_date';
}

function queryDoctorSlots(){
    const columns = [
        'apt_mstr.slots', 
        'apt_mstr.doctors_id', 
        'apt_mstr.slot_day'
    ];
    return  'SELECT ' + columns.join(',') + 
            ' FROM appointment_schmaster apt_mstr JOIN appointment_sch apt_sch ON ' +
            'apt_mstr.period_id = apt_sch.period_id WHERE ' +
            'apt_sch.fromdate <= ? AND ' +
            'apt_sch.todate >= ? AND ' + 
            'apt_sch.doctors_id = ? AND ' +
            'apt_sch.slot_day = ? AND ' +
            'apt_sch.active_status = \'Y\'';
}

function queryResourceSlots(){
    const columns = [
        'apt_mstr.slots', 
        'apt_mstr.resource_id', 
        'apt_sch.slots \'intrvl\'',
        'apt_mstr.slot_day'
    ];
    return  'SELECT ' + columns.join(',') + 
            ' FROM appointment_schmaster_res apt_mstr JOIN appointment_sch_res apt_sch ON ' +
            'apt_mstr.period_id = apt_sch.period_id WHERE ' +
            'apt_sch.fromdate <= ? AND ' +
            'apt_sch.todate >= ? AND ' + 
            'apt_sch.resource_id IN (?) AND ' +
            'apt_sch.slot_day = ? AND ' +
            'apt_sch.active_status = \'Y\'';
}

function queryDistinctResources(){
    return  'SELECT DISTINCT (resource_id)' +
            ' FROM appointments WHERE doctors_id = ? AND appoint_date = ?';
}

exports.queryDoctorSlots = queryDoctorSlots;
exports.queryResourceSlots = queryResourceSlots;
exports.queryAppointmentByDoctorId = queryAppointmentByDoctorId;
exports.queryDistinctResources = queryDistinctResources;
exports.queryAppointmentByRange = queryAppointmentByRange;