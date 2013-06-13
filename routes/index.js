var store = require('../db');
var logger = require('../logging').logger;
var redis = store.redis;
var mongodb = store.mongodb;

module.exports = function(app) {
    var checkUserToken = function(req, res, next) {
        var userToken = req.cookies.userToken;
        if(userToken){
            logger.info(userToken);
        }
        else{
            userToken = new Date().getTime();
            res.cookie('userToken', userToken);
        }
    };
    //app.all('*', checkUserToken);
    app.get('/', function(req, res) {
        checkUserToken(req, res);
/*
        redis.set("test", "Hello World", function (err, reply) {
            if(err){
                logger.error(err);
            }
            logger.debug(reply);
        });
        redis.get("test", function (err, reply) {
            if(err){
                logger.error(err);
            }
            logger.debug(reply);
        });
        req.session.user = {name: 'henryleu', signinStatus: true};
*/
        res.render('index',
            {
                displayName: '你'
            }
        );
    });

    app.get('/test', function(req, res) {
        throw new Error('test error handling');
    });
    app.get('/snippet', function(req, res) {
        res.render('snippet', {});
    });

};