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
const { admin } = require('../middleware/adminMiddleware');

router.route('/').get(getEngines).post(firebaseAuth, admin, createEngine);
router
    .route('/:id')
    .get(getEngineById)
    .put(firebaseAuth, admin, updateEngine)
    .delete(firebaseAuth, admin, deleteEngine);

module.exports = router;
