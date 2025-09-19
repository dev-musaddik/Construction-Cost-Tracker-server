import express from 'express';
const router = express.Router();
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../controllers/todoController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createTodoSchema, updateTodoSchema, validate } from '../middleware/validationMiddleware.js';

// Routes for todos
router.route('/')
  .get(protect, getTodos)
  .post(protect, validate(createTodoSchema), createTodo); // Apply validation to POST request

router.route('/:id')
  .get(protect, getTodoById)
  .put(protect, validate(updateTodoSchema), updateTodo)  // Apply validation to PUT request
  .delete(protect, deleteTodo);

export default router;
