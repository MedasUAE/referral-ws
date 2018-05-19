var db_query = require('../db/executeQuery');
var jwt = require('jsonwebtoken');

function authenticate(token, next) {
    decriptToken(token, (err,user)=>{
        if(err) return next(err);

        checkUser(user, (err)=>{
            if(err) return next(err);
            return next(null, user)
        });
    })
}

function isAuthenticate(req, res, next){

}

function isAuthenticate(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
      authenticate(req.token,(err,user)=>{
          if(err) return res.send(403, err);
          req.user = user;
          return next();
      })
    } else {
      res.send(403,"NoTOKEN");
    }
  }

function checkUser(user, next) {
    if(!user) return next("NoUserObject");
    const query = "SELECT user_id, user_label FROM user_setup WHERE user_Name ='" + user.username + "' AND user_password='" + user.password + "'"
    
    db_query.query(query, function (err, user) {
        if (err) return mext(err);
        if (!user.length) return next("USERNOTFOUND");
        return next(null, {user_id:user[0].user_id, name: user[0].user_label});
    });
}

function getTocken(user){
    const token = jwt.sign(user,"secret_key_goes_here");
    return token;
}

function decriptToken(token, next){
    if(!token) return next("NOTOKEN");
    jwt.verify(token, 'secret_key_goes_here', function(err, data) {
        if (err) return next("INVALIDTOKEN")
        else return next(null, data)
    });
}

function login(user, next){
    checkUser(user,(err, res)=>{
        if(err) return next(err);
        const data = {
            doctor_id: res.user_id,
            token: getTocken(user),
            name: res.name
        }
        return next(null, data);
    });
}
exports.isAuthenticate = isAuthenticate;
exports.login = login;