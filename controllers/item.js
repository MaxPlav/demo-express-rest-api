/**
 * Item controller
 * @param mongoose
 * @param config
 * @author Max Plavinskiy
 * @returns {{}}
 */
module.exports = function(mongoose, config, db) {
    var utils = require('../lib/utils')()
        , fs = require('fs')
    ;

    /**
     * Prepare Item data for response
     * @param item
     * @param user
     * @returns {*}
     */
    function itemResponse(item, user) {
        user = user || item.user[0];
        return {
            id     : item.id,
            title  : item.title,
            price  : item.price,
            image  : item.image,
            user_id: item.user_id,
            created_at : item.created_at,
            user : {
                id   : user.id,
                phone: user.phone,
                name : user.name,
                email: user.email
            }
        }
    };

    return {

        /**
         * Create item
         * @param req
         * @param res
         */
        create: function(req, res) {
            req.checkBody("title").notEmpty().isAlphanumeric();
            req.checkBody("price").notEmpty().isFloat();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            // Need to retrieve a new item id
            db.Sequence.getNextSequence("items", function(err, nextItemId) {
                if (err) throw err;

                var newItem = db.Item({
                    id         : nextItemId,
                    title      : req.body.title,
                    price      : req.body.price,
                    image      : "",
                    user_id    : req.decoded.id
                });

                db.User.findOne({
                    id: req.decoded.id
                }, function(err, currentUser) {
                    if (err) return utils.error(res, 422, err.message);
                    if (!currentUser) return utils.error(res, 422);
                    newItem.user = currentUser._id;

                    newItem.save(function(err, newItem) {
                        if (err) return utils.error(res, 422, err.message);
                        return utils.success(res, itemResponse(newItem, currentUser));
                    });
                });
            });

        },

        /**
         * Delete item by id
         * @param req
         * @param res
         */
        delete: function(req, res) {
            req.checkParams('itemId').notEmpty().isInt();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            db.Item.findOne({
                id: req.params.itemId
            }, function(err, item) {
                if (err) return utils.error(res, 422);
                if (!item) return utils.error(res, 404);
                if (item.user_id != req.decoded.id) return utils.error(res, 403);

                item.remove(function(err) {
                    if (err) return utils.error(res, 422);
                    return utils.success(res);
                });
            });
        },

        /**
         * Update item
         * @param req
         * @param res
         * @returns {*}
         */
        update: function(req, res) {
            req.checkParams('itemId').notEmpty().isInt();
            var itemId = req.params.itemId,
                title, price;

            if (req.body.title) {
                req.checkBody("title").isAlphanumeric();
                title = req.body.title;
            }
            if (req.body.price) {
                req.checkBody("price").isFloat();
                price = req.body.price;
            }
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }
            if (!title && !price) {
                return utils.error(res, 422);
            }

            // Find requested item
            db.Item.findOne({ id: itemId })
                .populate("user")
                .exec(function(err, item) {
                    if (err) return utils.error(res, 422);
                    if (!item) return utils.error(res, 404);
                    // Check permissions
                    if (item.user_id != req.decoded.id) return utils.error(res, 403);

                    if (title) item.title = title;
                    if (price) item.price = price;

                    item.save(function(err, item) {
                        return utils.success(res, itemResponse(item));
                    });
            });
        },

        /**
         * Get item(s) by id or search query
         * @param req
         * @param res
         */
        getItems: function(req, res) {
            var itemId = req.params.itemId;
            var query = {};
            var sortBy = null;

            if (itemId) {
                // Search item via query param userId
                query = {
                    id : itemId
                }
            } else  {
                // Search items via query vars
                sortBy = {};
                sortBy["order_by"] = "created_at"; // default values
                sortBy["order_type"] = "desc";

                if (req.query.title) query["title"] = req.query.title;
                if (req.query.user_id) query["user_id"] = req.query.user_id;
                if (req.query.order_by === "price") sortBy["order_by"] = req.query.order_by;
                if (req.query.order_type === "asc") sortBy["order_type"] = req.query.order_type;
            }

            var queryRequest = db.Item.find(query);
            if (sortBy) {
                var sort = {};
                // asc => ascending; desc => descending
                sort[sortBy["order_by"]] = sortBy["order_type"] === "asc" ? "ascending" : "descending";
                queryRequest.sort(sort);
            }

            queryRequest.populate("user").exec(function(err, dbResponse) {
                if (err) return utils.error(res, 422, err.message);
                if (!dbResponse) return utils.error(res, 404);

                utils.success(res, dbResponse.map(function(item) {
                    return itemResponse(item);
                }));
            });
        },

        /**
         * Upload item image
         * @param req
         * @param res
         * @returns {*}
         */
        uploadImage: function(req, res) {
            req.checkParams('itemId').notEmpty().isInt();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            var itemId = req.params.itemId;
            var imageSrc = req.body.imageSrc;
            if (!imageSrc) return utils.error(res, 422);

            // Find requested item
            db.Item.findOne({ id: itemId })
                .populate("user")
                .exec(function(err, item) {
                    if (err) return utils.error(res, 422, err.message);
                    if (!item) return utils.error(res, 404);
                    // Check permissions
                    if (item.user_id != req.decoded.id) return utils.error(res, 403);

                    if (imageSrc) item.image = imageSrc;

                    item.save(function(err, newItem) {
                        return utils.success(res, itemResponse(newItem));
                    });
                });
        },

        /**
         * Delete item image by item id
         * @param req
         * @param res
         */
        deleteImage: function(req, res) {
            req.checkParams('itemId').notEmpty().isInt();
            var error;
            if (error = req.validationErrors()) {
                return utils.validationError(res, error);
            }

            // Find requested item
            db.Item
            .findOne({ id: req.params.itemId })
            .exec(function(err, item) {
                if (err) return utils.error(res, 422);
                if (!item) return utils.error(res, 404);
                // Check permissions
                if (item.user_id != req.decoded.id) return utils.error(res, 403);

                // Get path to image
                var fileName = config.uploadPath + "/" + item.image.split("/").pop();
                fs.exists(fileName, function(exists) {
                    if (exists) {
                        item.image = "";
                        item.save(function() {
                            // File exists - remove file
                            fs.unlink(fileName, function() {
                                if (err) throw err;
                                utils.success(res);
                            });
                        });
                    } else {
                        utils.error(res, 404);
                    }
                });
            });
        }
    }
};