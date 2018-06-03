var redis = require('../utils/redis');
var UserModel = require('../models/user');
const bcrypt = require('bcrypt')

function authenticate(token, res, next) {
    checkUserRedis(token, (err, result) => {
        if (err) return next(err);
        return next(null, result)
    });
}

function isAuthenticate(req, res, next) {
     const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[0];
        req.token = bearerToken;
        authenticate(req.token, res, (err, user) => {
            if (err) return res.send(403, err);
            req.user = user;
            return next();
        })
    } else {
        res.send(403, "NoTOKEN");
    }
}

function checkUserMongoose(postData, next) {
    if (!postData.mobile) return next("No Mobile Number");
    UserModel.findOne({ mobile: postData.mobile }, (err, result) => {
        if (err) return next(err);
        if (!result) return next("User Not found In Mongoose");
        let response = {
            mobile: result.mobile,
            password: result.password
        }
        return next(null, response);
    })
}

function generateTocken(postData) {
    var round = 10;
    const salt = bcrypt.genSaltSync(round)
    const token = bcrypt.hashSync(postData.mobile + ',' + postData.password, salt)
    return token;
}

function login(postData, next) {
    var accessTime = Date.now();
    var commaSeparatedNameAndPass = accessTime + ',' + postData.mobile + ',' + postData.password;
    checkUserMongoose(postData, (err, res) => {
        if (err) return next(err);
        const data = {
            username: res.username,
            mobile: res.mobile,
            token: generateTocken(postData),
            password: res.password
        }
        redis.setData(data.token, commaSeparatedNameAndPass, (err, reply) => {
            if (err) return next(err);
        });
        return next(null, data);
    });
}

function checkUserRedis(token, next) {
    if (!token) return next("NoToken");
    redis.getData(token, (err, result) => {
        if (err) return next(err);
        if (!result) return next("Invald Token");

        const tokenValues = result.split(',');
        const commaSeparatedNameAndPass = Date.now() + ',' + tokenValues[1] + ',' + tokenValues[2];
        redis.setData(token, commaSeparatedNameAndPass, (err, reply) => {
            if (err) return next(err);
            return next(null, result);
        });
    });
}
exports.isAuthenticate = isAuthenticate;
exports.login = login;