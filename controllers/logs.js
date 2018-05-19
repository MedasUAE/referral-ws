var db_query = require('../db/executeQuery');

function addLog(params){
    //Insert into mobile_ws_log values(DateTime, err, action);
    const query = "Insert into mobile_ws_log values(?, ?, ?);"
    db_query.paramQuery(query,[params.datetime,params.error,params.action],(err)=>{
        if(err) console.log("err in log insert");
        else console.log("log insert");
    })
}

function getlog(params, next){
    const query = "SELECT * FROM mobile_ws_log";
    db_query.query(query,(err, result)=>{
        if(err) return next(err);
        return next(null, result);
    })
}

exports.addLog = addLog;
exports.getlog = getlog;