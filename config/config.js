var path = require('path')
    , rootPath = path.normalize(__dirname + '/..')
    , env = process.env.NODE_ENV || 'development'
    , port = 8080
    , secret = 'somesecretwordmustbehere'
    , uploadDir = '/uploads'
    , uploadPath = rootPath + uploadDir
    , fileUploadLimit = 10485760 // 10 MB
;
var config = {
    development: {
        root: rootPath,
        app: {
            name: 'dashboard-api-server'
        },
        port: port,
        db: 'mongodb://localhost/db-development',
        secret: secret,
        uploadDir: uploadDir,
        uploadPath: uploadPath,
        fileUploadLimit: fileUploadLimit
    },

    production: {
        root: rootPath,
        app: {
            name: 'dashboard-api-server'
        },
        port: port,
        db: 'mongodb://localhost/db-production',
        secret: secret,
        uploadDir: uploadDir,
        uploadPath: uploadPath,
        fileUploadLimit: fileUploadLimit
    }
};

module.exports = config[env];