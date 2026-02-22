const express = require('express');
const router = express.Router();
const {
    getEngines,
    getEngineById,
    createEngine,
    updateEngine,
    deleteEngine,
} = require('../controllers/engineController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

router.route('/').get(getEngines).post(firebaseAuth, createEngine);
router
    .route('/:id')
    .get(getEngineById)
    .put(firebaseAuth, updateEngine)
    .delete(firebaseAuth, deleteEngine);

module.exports = router;
