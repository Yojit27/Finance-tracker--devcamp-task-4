import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';
import { loadOwned } from '../middleware/ownership.js';
import Category from '../models/Category.js';

const router = Router();
router.use(protect);

router.route('/').get(listCategories).post(createCategory);
router.route('/:id').put(loadOwned(Category), updateCategory).delete(loadOwned(Category), deleteCategory);

export default router;
