const Prompt = require('../models/Prompt');

// @desc    Fetch all prompts
// @route   GET /api/prompts
// @access  Public
const getPrompts = async (req, res, next) => {
    try {
        const prompts = await Prompt.find({});
        res.json(prompts);
    } catch (error) {
        next(error);
    }
};

const getPromptById = async (req, res, next) => {
    try {
        const prompt = await Prompt.findById(req.params.id);

        if (prompt) {
            res.json(prompt);
        } else {
            res.status(404);
            throw new Error('Prompt not found');
        }
    } catch (error) {
        next(error);
    }
};

const createPrompt = async (req, res, next) => {
    const { title, description, promptText, tags, category, aiModel, image, user } = req.body;

    try {
        const prompt = new Prompt({
            user: user || 'Anonymous',
            title,
            description,
            promptText,
            tags,
            category,
            aiModel,
            image,
        });

        const createdPrompt = await prompt.save();
        res.status(201).json(createdPrompt);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a prompt
// @route   PUT /api/prompts/:id
// @access  Private/Admin
const updatePrompt = async (req, res, next) => {
    const { title, description, promptText, tags, category, aiModel, image } = req.body;

    try {
        const prompt = await Prompt.findById(req.params.id);

        if (prompt) {
            prompt.title = title || prompt.title;
            prompt.description = description || prompt.description;
            prompt.promptText = promptText || prompt.promptText;
            prompt.tags = tags || prompt.tags;
            prompt.category = category || prompt.category;
            prompt.aiModel = aiModel || prompt.aiModel;
            prompt.image = image || prompt.image;

            const updatedPrompt = await prompt.save();
            res.json(updatedPrompt);
        } else {
            res.status(404);
            throw new Error('Prompt not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a prompt
// @route   DELETE /api/prompts/:id
// @access  Private/Admin
const deletePrompt = async (req, res, next) => {
    try {
        const prompt = await Prompt.findById(req.params.id);

        if (prompt) {
            await prompt.deleteOne();
            res.json({ message: 'Prompt removed' });
        } else {
            res.status(404);
            throw new Error('Prompt not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
};
