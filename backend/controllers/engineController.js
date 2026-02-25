const Engine = require('../models/Engine');

// @desc    Get all engines
// @route   GET /api/engines
// @access  Public
const getEngines = async (req, res, next) => {
    try {
        const engines = await Engine.find({}); // SQL order is handled in model
        res.json(engines);
    } catch (error) {
        next(error);
    }
};

// @desc    Get engine by ID
// @route   GET /api/engines/:id
// @access  Public
const getEngineById = async (req, res, next) => {
    try {
        const engine = await Engine.findById(req.params.id);
        if (engine) {
            res.json(engine);
        } else {
            res.status(404);
            throw new Error('Engine not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new engine
// @route   POST /api/engines
// @access  Private/Admin
const createEngine = async (req, res, next) => {
    const { name, description, website, icon, isActive } = req.body;
    try {
        const exists = await Engine.findOne({ name: name?.trim() });
        if (exists) {
            res.status(400);
            throw new Error('Engine with this name already exists');
        }
        const created = await Engine.create({
            name: name?.trim(),
            description,
            website,
            icon,
            isActive: isActive !== undefined ? isActive : true,
        });
        res.status(201).json(created);
    } catch (error) {
        next(error);
    }
};

// @desc    Update an engine
// @route   PUT /api/engines/:id
// @access  Private/Admin
const updateEngine = async (req, res, next) => {
    const { name, description, website, icon, isActive } = req.body;
    try {
        const engine = await Engine.findById(req.params.id);
        if (engine) {
            engine.name = name?.trim() || engine.name;
            engine.description = description !== undefined ? description : engine.description;
            engine.website = website !== undefined ? website : engine.website;
            engine.icon = icon !== undefined ? icon : engine.icon;
            engine.isActive = isActive !== undefined ? isActive : engine.isActive;

            const updated = await engine.save();
            res.json(updated);
        } else {
            res.status(404);
            throw new Error('Engine not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an engine
// @route   DELETE /api/engines/:id
// @access  Private/Admin
const deleteEngine = async (req, res, next) => {
    try {
        const engine = await Engine.findById(req.params.id);
        if (engine) {
            await engine.deleteOne();
            res.json({ message: 'Engine removed' });
        } else {
            res.status(404);
            throw new Error('Engine not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { getEngines, getEngineById, createEngine, updateEngine, deleteEngine };
