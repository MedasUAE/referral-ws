var mongoose = require('mongoose');

var referPatientSchema = mongoose.Schema({
    name: String,
    mobile: Number,
    image:String,
    referDate:{ type: Date, default: Date.now }
   
},{strict:false});

module.exports = mongoose.model('ReferPatient', referPatientSchema);