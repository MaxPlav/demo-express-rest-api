var express       = require('express')
    , app         = express()
    , bodyParser  = require('body-parser')
    , validator   = require('express-validator')
    , morgan      = require('morgan')
    , mongoose    = require('mongoose')
    , config      = require('./config/config')
    , fs          = require('fs')
    , os          = require('os')
    , interfaces  = os.networkInterfaces()
    , addrs       = []
    , db          = {}
;

// Set config.host ip
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2]
        if(address.family == 'IPv4' && !address.internal)
            addrs.push(address.address)
    }
}

config.host = addrs.pop();
// Connect to mongo db
mongoose.connect(config.db);

// use body parser as middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(validator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            field   : formParam,
            message : msg
        };
    }
}));

app.set('secret', config.secret);

// config mongoose models
var modelsPath = __dirname + '/models';
fs.readdirSync(modelsPath).forEach(function (file) {
    if (file.indexOf('.js') >= 0)
        db[file.replace('.js', '')] = require(modelsPath + '/' + file)(mongoose)
});

require('./config/routes')(mongoose, express, app, db);

// Use morgan to log requests to the console
app.use(morgan('dev'));
app.use(config.uploadDir, express.static(config.uploadPath));

app.listen(config.port);
console.log("Server is working on http://" + config.host + ":" + config.port);