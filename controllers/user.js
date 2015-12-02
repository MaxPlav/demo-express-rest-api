/**
 * User controller
 * @param mongoose
 * @param config
 * @author Max Plavinskiy
 * @returns {*}
 */
module.exports = function (mongoose, config, db) {
    var jwt     = require('jsonwebtoken')
        , utils = require('../lib/utils')()
    ;

    /**
     * Prepare User data for response
     * @param user
     * @returns {{id: *, phone: *, name: *, email: *}}
     */
    function userResponse(user) {
        return {
            id    : user.id,
            phone : user.phone,
            name  : user.name,
            email : user.email
        };
    }

    return {

        /**
         * Get current user
         * @param req
         * @param res
         */
        current: function(req, res) {
            var token = req.decoded;
            db.User.findOne({
                _id: token._id
            }, function(err, user) {
                if (!user) return utils.error(res, 401);
                if (err) throw err;
                return utils.success(res, userResponse(user));
            });
        },

        /**
         * Get current user
         * @param req
         * @param res
         */
        updateCurrent: function(req, res) {
            var token = req.decoded;
            db.User.findOne({
                _id: token._id
            }, function(err, user) {
                if (!user) return utils.error(res, 401);
                if (err) throw err;

                if (req.body.name) {
                    req.checkBody('name').isAlpha();
                    user.name = req.body.name;
                }
                if (req.body.email) {
                    req.checkBody('email').isEmail();
                    user.email = req.body.email;
                }
                if (req.body.phone) {
                    req.checkBody('phone').isMobilePhone('ru-RU');
                    user.phone = req.body.phone;
                }
                var error;
                if (error = req.validationErrors()) {
                    return utils.validationError(res, error);
                }

                if (req.body.current_password) {
                    // Check if current password right
                    user.comparePassword(req.body.current_password, function(err, valid) {
                        if (!valid) return utils.error(res, 422, "Wrong current password", "current_password");
                        if (!req.body.new_password) {
                            return utils.error(res, 422, "Wrong new password", "new_password");
                        } else {
                            user.password = req.body.new_password;
                        }
                        saveUser(user, res);
                    });
                } else {
                    saveUser(user, res);
                }

                function saveUser(user, res) {
                    user.save(function (err) {
                        if (err) return utils.error(res, 422, err.message);
                        return utils.success(res, userResponse(user));
                    });
                }
            });

        },

        /**
         * Login User
         * @param req
         * @param res
         */
        login: function (req, res) {
            req.checkBody('email').notEmpty().isEmail();
            req.checkBody('password').notEmpty();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            db.User.findOne({
                email: req.body.email
            }, function(err, user) {
                if (err) throw err;

                if (!user) {
                    return utils.error(res, 422, "Wrong email", "email");
                } else {
                    // Check if password matches
                    user.comparePassword(req.body.password, function(err, valid) {
                        // If user is found and password is right - create token
                        if (!valid) return utils.error(res, 422, "Wrong password", "password");
                        var token = jwt.sign(user, config.secret, {
                            expiresIn: 3600 * 24 // 24 hours
                        });
                        return utils.success(res, {
                            token: token
                        });
                    });
                }

            });
        },

        /**
         * Register new user
         * @param req
         * @param res
         */
        register: function(req, res) {
            req.checkBody('name').notEmpty().isAlpha();
            req.checkBody('phone').notEmpty().isMobilePhone('ru-RU');
            req.checkBody('email').notEmpty().isEmail();
            req.checkBody('password').notEmpty();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            // Need to retrieve a new user id
            db.Sequence.getNextSequence("users", function(err, nextUserId) {
                if (err) throw err;

                var newUser = db.User({
                    id       : nextUserId,
                    phone    : req.body.phone,
                    name     : req.body.name,
                    password : req.body.password,
                    email    : req.body.email
                });

                newUser.save(function(err, newUser) {
                    if (err) return utils.error(res, 422, err.message);

                    var token = jwt.sign(newUser, config.secret, {
                        expiresIn: 3600 * 24// expires in 24 hours
                    });

                    return utils.success(res, {
                        token: token
                    });
                });
            });
        },

        /**
         * Get user by id or search query
         * @param req
         * @param res
         */
        getUser: function(req, res) {
            var query = {};
            if (req.params.userId) {
                req.checkParams('userId').isInt();
                // Search user via query param userId
                query = {
                    id : req.params.userId
                }
            } else  {
                // Search user via query vars
                if (req.query.name) {
                    req.checkQuery('name').isAlpha();
                    query["name"] = req.query.name;
                }
                if (req.query.email) {
                    req.checkQuery('email').isEmail();
                    query["email"] = req.query.email;
                }
            }
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            db.User.findOne(query, function(err, user) {
                if (err) throw err;
                if (!user) return utils.error(res, 404);
                return utils.success(res, userResponse(user));
            });
        }
    }
};
