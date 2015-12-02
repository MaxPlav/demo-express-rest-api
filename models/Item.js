/**
 * Item model
 * @param mongoose
 * @author Max Plavinskiy
 * @returns {Model|*}
 */
module.exports = function (mongoose) {
    var Schema = mongoose.Schema;

    var itemSchema = new Schema({
        id         : Number,
        created_at : { type: Date, default: Date.now },
        title      : { type: String, required: true },
        price      : { type: Number, required: true },
        image      : String,
        user_id    : Number,
        user       : [{ type: Schema.Types.ObjectId, ref: 'User' }]
    });

    return mongoose.model('Item', itemSchema);
}
