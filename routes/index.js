
/*
 * GET home page.
 */
var store = require('../db');
var redis = store.redis;
var mongodb = store.mongodb;


module.exports = function(app) {
    app.get('/', function(req, res) {
        var callback = function(err, result){
            if (err) {
                console.err(err);
            }
            else{
                console.log(result);
            }
        };
        /*
         mongodb.open(function(err, db) {
         if (err) {
         return callback(err);
         }
         // 讀取 users 集合
         db.collection('products_in_suzhou', function(err, collection) {
         if (err) {
         mongodb.close();
         return callback(err);
         }
         //collection.ensureIndex('name', {unique: true});
         collection.findOne({name: "三星NoteII手机"}, function(err, doc) {
         mongodb.close();
         if (doc) {
         callback(err, doc);
         } else {
         callback(err, null);
         }
         });
         });
         });
         */
        redis.set("test", "Hello World", function (err, reply) {
            if(err){
                console.error(err);
            }
            console.log(reply);
        });
        redis.get("test", function (err, reply) {
            if(err){
                console.error(err);
            }
            console.log(reply);
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

};



exports.index = function (req, res) {
    var callback = function(err, result){
        if (err) {
            console.err(err);
        }
        else{
            console.log(result);
        }
    };
/*
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 讀取 users 集合
        db.collection('products_in_suzhou', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //collection.ensureIndex('name', {unique: true});
            collection.findOne({name: "三星NoteII手机"}, function(err, doc) {
                mongodb.close();
                if (doc) {
                    callback(err, doc);
                } else {
                    callback(err, null);
                }
            });
        });
    });
*/
    redis.set("test", "Hello World", function (err, reply) {
        if(err){
            console.error(err);
        }
        console.log(reply);
    });
    redis.get("test", function (err, reply) {
        if(err){
            console.error(err);
        }
        console.log(reply);
    });
    req.session.user = {name: 'henryleu', signinStatus: true};
    res.render('index',
        {
            title: '蛤蟆调频',
                signinStatus: false,
                displayName: '红蛤蟆'
        }
    );
};