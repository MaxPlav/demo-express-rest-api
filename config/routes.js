/**
 * Routes module
 * @param mongoose
 * @param express
 * @param app
 * @param db
 * @author Max Plavinskiy
 */
module.exports = function (mongoose, express, app, db) {
    var jwt = require('jsonwebtoken')
        , multer = require('multer')
        , utils = require('../lib/utils')()
        , config = require('../config/config')
        , UserController = require('../controllers/user')(mongoose, config, db)
        , ItemController = require('../controllers/item')(mongoose, config, db)
        , apiRoutes = express.Router();

    // Use the multer module for file uploading
    var fileUpload = multer({
        dest : config.uploadPath
    });

    app.use('/api', apiRoutes);

    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
        next();
    });

    // API Routes
    apiRoutes.post('/login',
        utils.requiredFields("email password"),
        utils.checkPassword, utils.validateEmail, UserController.login);

    apiRoutes.post('/register',
        utils.requiredFields("name password email"),
        utils.checkPassword, utils.validateEmail, UserController.register);

    // Middleware to check user auth
    apiRoutes.use(function(req, res, next) {
        // Check header for token
        var token = req.headers['authorization'];

        // Decode token
        if (token) {
            jwt.verify(token, app.get('secret'), function(err, decoded) {
                if (err) {
                    return utils.error(res, 401);
                } else {
                    // Save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            // No token - unauthorized
            return utils.error(res, 401);
        }
    });

    // Users API routes
    apiRoutes.get('/me', UserController.current);
    apiRoutes.put('/me', utils.requiredFields("name"), /*utils.validateEmail, */UserController.updateCurrent);
    apiRoutes.get('/user/:userId?', UserController.getUser);

    // Items API routes
    apiRoutes.post('/item', utils.requiredFields("title price"), ItemController.create);
    apiRoutes.delete('/item/:itemId', ItemController.delete);
    apiRoutes.put('/item/:itemId', ItemController.update);
    apiRoutes.get('/item/:itemId?', ItemController.getItems);

    apiRoutes.post('/item/:itemId/image', fileUpload.single('file'), utils.prepareItemUploadedImage, ItemController.uploadImage);
    apiRoutes.delete('/item/:itemId/image', ItemController.deleteImage);
};