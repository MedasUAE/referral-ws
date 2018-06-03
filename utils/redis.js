var app = require('../app');

function setData(key, value, next) {
     //expire key after 31 minutes.
    app.redisClient.set(key, value, 'EX', 60 * 31, function (err, reply) {
        if (err) return next(err);
        return next(null,reply);
    });
}

function getData(key,next) {
    if (!key) return next("No Token");
    app.redisClient.get(key, function(err, reply) {
        if (err) return next(err);
        if (!reply) return next("Token don't exist");
        return next(null, reply);
    });
}

exports.setData = setData;
exports.getData = getData;
