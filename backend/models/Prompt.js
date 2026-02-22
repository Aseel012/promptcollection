const mongoose = require('mongoose');

const promptSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
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
