const mongoose = require('mongoose');

const promptSchema = mongoose.Schema(
    {
        user: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        promptText: {
            type: String,
            required: true,
        },
        tags: [
            {
                type: String,
            },
        ],
        category: {
            type: String,
            required: true,
        },
        aiModel: {
            type: String,
            required: true,
        },
        image: {
            type: String, // URL to image
        },
    },
    {
        timestamps: true,
    }
);

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
