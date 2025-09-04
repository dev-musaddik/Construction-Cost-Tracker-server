import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateUserSchema,
} from '../middleware/validationMiddleware.js';

router.route('/register').post(validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), authUser);
router.route('/profile').get(protect, getUserProfile).put(protect, validate(updateProfileSchema), updateUserProfile);

// Admin routes
router.route('/').get(protect, admin, getUsers);
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, validate(updateUserSchema), updateUser)
  .delete(protect, admin, deleteUser);

export default router;