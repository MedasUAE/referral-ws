
var UserModel = require('../models/user');
var redisClient = require('../app');
const bcrypt = require('bcrypt')

function authenticate(token, res, next) {
    checkUserRedis(token, res, (err, result) => {
        if (err) return next(err);
        return next(null, result)
    });
}

function isAuthenticate(req, res, next) {
    const bearerHeader = req.body.token;
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

function checkUserMongoose(user, next) {
    if (!user) return next("NoUserObject");
    UserModel.findOne({ username: user.username }, (err, result) => {
        if (err) return next(err);
        if (!result) return next("User Not found In Mongoose");
        let response = {
            username: result.username,
            password: result.password
        }
        return next(null, response);
    })
}

function generateTocken(user) {
    var round = 10;
    const salt = bcrypt.genSaltSync(round)
    const token = bcrypt.hashSync(user.username + ',' + user.password, salt)
    return token;
}

function login(user, next) {
    var accessTime = Date.now();
    var commaSeparatedNameAndPass = accessTime + ',' + user.username + ',' + user.password;
    checkUserMongoose(user, (err, res) => {
        if (err) return next(err);
        const data = {
            username: res.username,
            token: generateTocken(user),
            password: res.password
        }

        saveInRadis(data.token, commaSeparatedNameAndPass, (err, result) => {
            if (err) return next(err);
            return callback(null, null, result)
        })
        return next(null, data);
    });
}

function saveInRadis(token, commaSeparatedNameAndPass, next) {
    //expire key after 31 minutes.
    redisClient.redisUser.set(token, commaSeparatedNameAndPass, 'EX', 60 * 31);
}

function checkUserRedis(token, res, next) {
    if (!token) return next("NoToken");
    redisClient.redisUser.get(token, function (err, result) {
        if (err) return next(err);
        if (!result) return next("key Not found in redis");
        var redisTime = result.split(',')[0];
        var gapInMillis = Date.now() - redisTime;
        //1 800 000 millisecond = 30 minutes
        if (gapInMillis > 1800000) {
            redisClient.redisUser.del(token);
            return next("Not active Token");
        }
        else {
            var tokenValues = result.split(',');
            commaSeparatedNameAndPass = Date.now() + ',' + tokenValues[1] + ',' + tokenValues[2];
            //expire key after 31 minutes.
            redisClient.redisUser.set(token, commaSeparatedNameAndPass, 'EX', 60 * 31);
            return next(null, null, result);
        }

    })
}
exports.isAuthenticate = isAuthenticate;
exports.login = login;