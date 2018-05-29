var redisClient = require('../app');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var userModel = require('../models/user');

function addUser(postData, next) {
    const modelDoc = {
        type: postData.type,
        username: postData.username,
        password: postData.password,
        mobile: postData.mobile,
        referId: postData.referId,
        email: postData.email,
        verified: postData.verified
    };
    var user = new userModel(modelDoc);
    user.save(function (err, result) {
        if (err) return next(err)
        var otp = generateRandomNumber();
        var otpHash = generateToken(otp);
        saveInRadis(postData.mobile, otpHash, (err, result) => {
            if (err) return next(err);
            return next(null, result)
        });
        emailOtp(postData.email, otp, (err, result) => {
            if (err) return next(err);
            return next(null, result)
        })
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

function saveInRadis(mobile, otpHash, next) {
    //expire key after 31 minutes.
    redisClient.redisUser.set(mobile, otpHash, 'EX', 60 * 31);

}
function emailOtp(email, opt, next) {
    const mailOptions = {
        from: "munquasim3@gmail.com", // sender address
        to: email, // list of receivers
        subject: "otp", // Subject line
        html: "your 4 digit Otp is:  " + opt,// plain text body

    };
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "munquasim3@gmail.com",
            pass: '85431585'
        }
    });
    transporter.sendMail(mailOptions, (err, result) => {
        if (err) return next(err);
        return next(null, "sent mail successfully");
    });
}

//authenticate input against redis
function verifyOtp(mobile, otp, callback) {
    redisClient.redisUser.get(mobile, function (err, otpHash) {
        if (err) {
            return callback(err)
        } else if (!mobile) {
            var err = new Error('mobile not found.');
            err.status = 401;
            return callback(err);
        }
        bcrypt.compare(otp, otpHash, function (err, isValid) {
            if (isValid) {
                return callback(null, isValid);
            } else {
                return callback();
            }
        })
    });
}

exports.verifyOtp = verifyOtp;
exports.addUser = addUser;