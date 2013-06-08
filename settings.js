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
    session: {
        storeType: 'mongo',
        expires: 60 // minutes
    }

}
;
