var settings = require('./settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var mongodb = new Db(
    settings.mongo.db,
    new Server(
        settings.mongo.host,
        settings.mongo.port,
        {auto_reconnect: true, poolSize:2}
    ),
    {w: 1}); //TODO: need options

var redis = require("redis");
var redisClient = redis.createClient(settings.redis.port, settings.redis.host, {} ); //TODO: need options
var log = function (type) {
    return function() {
        console.log(type, arguments);
    }
}
redisClient.on('connect'     , log('connect'));
redisClient.on('ready'       , log('ready'));
redisClient.on('reconnecting', log('reconnecting'));
redisClient.on('error'       , log('error'));
redisClient.on('end'         , log('end'));

module.exports = {
    mongodb: mongodb,
    redis: redisClient
};
