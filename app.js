var express = require('express')
    , http = require('http')
    , path = require('path')
    , engine = require('ejs-locals')
    , settings = require('./settings')
    , db = require('./db');

var app = module.exports = express();
var MongoStore = require('connect-mongo')(express);
var RedisStore = require('connect-redis')(express);

var sessionStore = null;
if(settings.session.storeType == 'mongo'){
    sessionStore = new MongoStore({db: db.mongodb});
}
else if(settings.session.storeType == 'redis'){
    sessionStore = new RedisStore({client : db.redis});
}

// all environments
app.set('name', '番茄快跑');
app.set('title', '番茄快跑 -- 中国最小巧的时间管理工具');
app.locals({
    user: {
        displayName: '你'
    },
    'creator': 'henryleu'
});
app.set('port', process.env.PORT || 1000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', engine);
app.use(express.favicon());
app.use(express.logger('dev')); //TODO: figure out log levels
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.cookieSecret));
app.use(express.session({
    //cookie: {maxAge: 60000 * 20}, // 20 minutes
    secret: settings.cookieSecret,
    store: sessionStore
}));

// routing
//app.use(app.router);
//app.use(express.router(routes));
require('./routes')(app);
app.use(express.static(path.join(__dirname, 'public')));

/*
    Error Handling
 */
app.use(function (err, req, res, next) { //Log errors
    console.error(err.stack);
    next(err);
});
app.use(function (err, req, res, next) { //Handle XHR errors
    if (req.xhr) {
        res.send(500,{error: 'TODO:真不好意思，程序出错了!'});
    } else {
        next(err);
    }
});
app.use(function (err, req, res, next) { //Handle XHR errors
    res.status(500);
    res.render('error',
        {
            error: 'TODO:真不好意思，程序出错了!'
        }
    );
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Tomatodo server listening on port ' + app.get('port'));
});
