import express from 'express';
const router = express.Router();
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, createCategorySchema, updateCategorySchema } from '../middleware/validationMiddleware.js';

router.route('/').get(protect, getCategories).post(protect, validate(createCategorySchema), createCategory);
router
  .route('/:id')
  .get(protect, getCategoryById)
  .put(protect, validate(updateCategorySchema), updateCategory)
  .delete(protect, deleteCategory);

export default router;