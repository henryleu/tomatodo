module.exports = {
    cookieSecret: 'quick',
    mongo:{
        db: 'tomatodo',
        host: 'localhost',
        port: 27017
    },
    redis:{
        host: 'localhost',
        port: 6379
    },
    logging: {
        reloadSecs: 300,
        level: 'DEBUG'
    },
    session: {
        storeType: 'mongo',
        expires: 60 // minutes
    }

}
;
