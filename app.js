var restify = require('restify');
var plugins = require('restify').plugins;
const corsMiddleware = require('restify-cors-middleware')
var config = require('./config/config');
var redis = require('redis');
//creates a new redis client at host 127.0.0.1 and port 6379
var redisUser = redis.createClient('6379', '127.0.0.1');
var mongoose = require('mongoose');

// server started
var server = restify.createServer({
    name: 'referralAPI',
    versions: ['1.0.0', '2.0.0']
});
const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['Authorization'],
    exposeHeaders: ['API-Token-Expiry']
});

server.use(plugins.bodyParser({ mapParams: false })); //for body data
server.use(restify.plugins.queryParser());//for query params 
server.pre(cors.preflight)
server.pre((req, res, next) => {
    let pieces = req.url.replace(/^\/+/, '').split('/');
    let version = pieces[0];

    version = version.replace(/v(\d{1})\.(\d{1})\.(\d{1})/, '$1.$2.$3');
    version = version.replace(/v(\d{1})\.(\d{1})/, '$1.$2.0');
    version = version.replace(/v(\d{1})/, '$1.0.0');

    if (server.versions.indexOf(version) > -1) {
        req.url = req.url.replace(pieces[0] + '/', '');
        req.headers = req.headers || [];
        req.headers['accept-version'] = version;
    }
    else if (server.versions.indexOf(version) == -1)
        return res.send(400, { DisplayMessage: "VERSION NOT SUPPORT" });

    return next();
});
server.use(cors.actual);
server.listen(config.port, () => {
    require('./routes')(server);
    console.log("node Server started on port: ", config.port);
});
redisUser.on('connect', function () {
    console.log('connected to redis server on port 6379: ');
});

/**
 * Connection  to MongoDB.
 */
db = mongoose.connect(config.db);
mongoose.connection.on('error', function () {
    console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

exports.redisUser = redisUser;
