const express = require('express');
const router = express.Router();
const {
    getPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
} = require('../controllers/promptController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { admin } = require('../middleware/adminMiddleware');

router.route('/').get(getPrompts).post(firebaseAuth, admin, createPrompt);
router
    .route('/:id')
    .get(getPromptById)
    .put(firebaseAuth, admin, updatePrompt)
    .delete(firebaseAuth, admin, deletePrompt);

module.exports = router;
