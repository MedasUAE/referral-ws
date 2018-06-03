var redis = require('../utils/redis');
var bcrypt = require('bcrypt');
var userModel = require('../models/user');
var request = require("request");

function addUser(postData, next) {
    const modelDoc = {
        type: postData.type,
        username: postData.username,
        password: generateHashPassword(postData.password),
        mobile: postData.mobile,
        referId: postData.referId,
        email: postData.email,
        verified: postData.verified
    };
    var user = new userModel(modelDoc);
    user.save(function (err, result) {
        if (err) return next(err);
        var otp = generateRandomNumber();
        var otpHash = generateToken(otp);
        redis.setData(postData.mobile, otpHash, (err, reply) => {
            if (err) return next(err);
        });
        emailOtp(postData.email, otp, (err, success) => {
            if (err) return next(err);
        });
        console.log("result:"+result);
        return next(null, result);
    })
}

function generateRandomNumber() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    otp = String(otp);
    otp = otp.substring(0, 4);
    return otp;
}

function generateToken(otp) {
    var round = 10;
    const salt = bcrypt.genSaltSync(round)
    const token = bcrypt.hashSync(otp, salt)
    return token;
}

//authenticate input against redis
function verifyOtp(mobile, otp, next) {
    redis.getData(mobile, (err, otpHash) => {
        if (err) return next(err);
        bcrypt.compare(otp, otpHash, function (err, isValid) {
            if (err) return next(err);

            return (isValid ? next(null, isValid) : next(null, isValid));
        })
    });
}

function emailOtp(email, otp, next) {
    request.post({
        "headers": { "content-type": "application/json" },
        "url": "http://localhost:3001/v1/sendemail",
        "body": JSON.stringify({
            "email": email,
            "otp": otp
        })
    }, (err, response, body) => {
        if (err) return next(err);
    });
}

function generateHashPassword(password) {
    const round = 10;
    const salt = bcrypt.genSaltSync(round)
    const encryptedPass = bcrypt.hashSync(password, salt)
    console.log("encryptedPass:"+encryptedPass);
    return encryptedPass;
}

exports.verifyOtp = verifyOtp;
exports.addUser = addUser;