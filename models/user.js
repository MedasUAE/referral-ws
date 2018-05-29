var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["PATIENT", "DOCTOR"]
    },
    username: String,
    password: String,
    mobile:Number,
    referId:Number,
    email:String,
    verified:Boolean
   
},{strict:false});

module.exports = mongoose.model('User', userSchema);