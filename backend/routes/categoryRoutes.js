const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    deleteCategory,
} = require('../controllers/categoryController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { admin } = require('../middleware/adminMiddleware');

router.route('/').get(getCategories).post(firebaseAuth, admin, createCategory);
router.route('/:id').delete(firebaseAuth, admin, deleteCategory);

module.exports = router;
