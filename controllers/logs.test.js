const l = require('./logs')
const moment = require('moment');
var mysql = require('mysql');
var config = require('../config/config');


it('should transformXML',()=>{
    l.addLog({datetime:moment().unix(), error: 'error', action:'makeappointment'}, (err)=>{
        if(err) throw new Error("insert failed");
    });

})