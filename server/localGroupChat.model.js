const mongoose = require("mongoose");

const localGroupChatSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Feature'],
        required: true
    },
    geometry: {
        type: {
            type: String,
            enum: [
                "Point", "MultiPoint", "Polygon", "MultiPolygon"
            ],
            required: true
        },
        coordinates: {
            type: Array,
            required: true
        }
    },
    properties: // any object
        {
            type: Object,
            required: true
        },
    signal: {
        id: {
            type: String,
            required: false,
            unique: true,
            sparse: true // Add sparse index to ensure uniqueness only for non-null values
        },
        memberCount: {
            type: Number,
            required: false,
            default: 0
        },
        name: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        invite_link: {
            type: String,
            required: false
        }
    },
    formalAdminGeometry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laus',
        required: false
    }

});

// Ensure a geospatial index
localGroupChatSchema.index({ geometry: "2dsphere" });
const LocalGroupChat = mongoose.model("LocalGroupChat", localGroupChatSchema);
LocalGroupChat.syncIndexes();
module.exports = LocalGroupChat;