const express = require('express');
const router = express.Router();
const {
    getEngines,
    getEngineById,
    createEngine,
    updateEngine,
    deleteEngine,
} = require('../controllers/engineController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getEngines).post(protect, admin, createEngine);
router
    .route('/:id')
    .get(getEngineById)
    .put(protect, admin, updateEngine)
    .delete(protect, admin, deleteEngine);

module.exports = router;
