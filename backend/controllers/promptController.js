const Prompt = require('../models/Prompt');

// @desc    Fetch all prompts (with pagination and basic field filtering)
// @route   GET /api/prompts
// @access  Public
const getPrompts = async (req, res, next) => {
    try {
        // Set headers to prevent caching for dynamic results
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const page = Number(req.query.pageNumber) || 1;
        const { keyword, category, ids, shuffle } = req.query;
        const isShuffle = shuffle === 'true';

        const filter = {};
        if (keyword) {
            filter.searchText = keyword;
        }
        if (category && category !== 'All') {
            filter.category = category;
        }
        if (ids) {
            filter.ids = ids.split(',');
        }

        const count = await Prompt.countDocuments(filter);

        // When shuffling, return ALL results in random order (no pagination gaps)
        // When not shuffling, paginate normally
        const pageSize = isShuffle ? Math.max(count, 1) : (req.query.pageSize ? Number(req.query.pageSize) : 24);
        const skip = isShuffle ? 0 : pageSize * (page - 1);

        const prompts = await Prompt.find(filter, {
            limit: pageSize,
            skip: skip,
            shuffle: isShuffle
        });

        res.json({
            prompts,
            page,
            pages: isShuffle ? 1 : Math.ceil(count / pageSize),
            count
        });
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
    const { title, description, promptText, tags, category, aiModel, image } = req.body;

    try {
        console.log('--- ATTEMPTING PROMPT CREATION ---');
        console.log('User ID:', req.user._id);
        console.log('Title:', title);

        const createdPrompt = await Prompt.create({
            user: req.user._id,
            title,
            description,
            promptText,
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
            category,
            aiModel,
            image,
        });
        console.log('✅ Prompt Created Successfully:', createdPrompt._id);
        res.status(201).json(createdPrompt);
    } catch (error) {
        console.error('❌ Prompt Creation Failed:', error.message);
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
