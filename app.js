var express = require('express')
    , http = require('http')
    , path = require('path')
    , engine = require('ejs-locals')
    , settings = require('./settings')
    , db = require('./db');

var app = module.exports = express();
var sessionStore = null;
if(settings.session.storeType == 'mongo'){
    var MongoStore = require('connect-mongo')(express);
    sessionStore = new MongoStore({db: db.mongodb});
}
else if(settings.session.storeType == 'redis'){
    var RedisStore = require('connect-redis')(express);
    sessionStore = new RedisStore({client : db.redis});
}

// all environments
app.set('name', '番茄快跑');
app.set('title', '番茄快跑 -- 中国最小巧的时间管理工具');
app.locals({
    'creator': '番茄实验室'
});

app.set('port', process.env.PORT || 3010);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', engine);

var logging = require('./logging');
var logger = logging.logger;
app.use(logging.applogger);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.cookieSecret));
app.use(express.session({
    //cookie: {maxAge: 60000 * 20}, // 20 minutes
    secret: settings.cookieSecret,
    store: sessionStore
}));

// routing
require('./routes')(app);
app.use('/public', express.static(path.join(__dirname, 'public')));

/*
    Error Handling
 */
app.use(function (err, req, res, next) { //Log errors
    logger.error(err.stack);
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

http.createServer(app).listen(app.get('port'),'127.0.0.1', function(){
    logger.info('Tomatodo server listening on port ' + app.get('port'));
});
