/**
 * User model
 * @param mongoose
 * @author Max Plavinskiy
 * @returns {Model|*}
 */
module.exports = function (mongoose) {
    var bcrypt = require('bcrypt')
        , Schema = mongoose.Schema
    ;

    var userSchema = new Schema({
        id:        Number,
        name:     { type: String, required: true },
        password: { type: String, required: true },
        phone:    String,
        email:    { type: String, required: true, index: { unique: true }}
    });

    userSchema.pre('save', function (next) {
        var user = this;
        if (!user.isModified('password')) return next();

        // Hash provided password
        bcrypt.hash(user.password, bcrypt.genSaltSync(), function (err, hash) {
            if (err) return next(err);

            // Update password
            user.password = hash;
            next()
        });
    });

    /**
     * Compare current user password with provided
     * @param passwordToCompareWith
     * @param next
     */
    userSchema.methods.comparePassword = function(passwordToCompareWith, next) {
        bcrypt.compare(passwordToCompareWith, this.password, function (err, valid) {
            if (err) return next (err);
            next(null, valid);
        })
    };

    return mongoose.model('User', userSchema);
}
