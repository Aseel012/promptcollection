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

router.route('/').get(getPrompts).post(firebaseAuth, createPrompt);
router
    .route('/:id')
    .get(getPromptById)
    .put(firebaseAuth, updatePrompt)
    .delete(firebaseAuth, deletePrompt);

module.exports = router;
