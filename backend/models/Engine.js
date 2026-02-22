const mongoose = require('mongoose');

const engineSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        website: {
            type: String,
            default: '',
        },
        icon: {
            type: String, // URL or emoji or base64
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Engine = mongoose.model('Engine', engineSchema);

module.exports = Engine;
