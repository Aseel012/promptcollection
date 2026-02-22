const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    deleteCategory,
} = require('../controllers/categoryController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

router.route('/').get(getCategories).post(firebaseAuth, createCategory);
router.route('/:id').delete(firebaseAuth, deleteCategory);

module.exports = router;
