var store = require('../db');
var logger = require('../logging').logger;
var redis = store.redis;
var mongodb = store.mongodb;

module.exports = function(app) {
    app.get('/', function(req, res) {
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