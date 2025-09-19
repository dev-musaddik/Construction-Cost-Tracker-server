import asyncHandler from 'express-async-handler';
import Todo from '../models/Todo.js';

// @desc    Fetch all todos
// @route   GET /api/todos
// @access  Private
const getTodos = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).populate('category', 'name');
  res.json(todos);
});

// @desc    Fetch single todo
// @route   GET /api/todos/:id
// @access  Private
const getTodoById = asyncHandler(async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (todo) {
    res.json(todo);
  } else {
    res.status(404);
    throw new Error('Todo not found');
  }
});

// @desc    Create a todo
// @route   POST /api/todos
// @access  Private
const createTodo = asyncHandler(async (req, res) => {
  const { description, category, dueDate } = req.body;

  const todo = new Todo({
    description,
    category,
    dueDate,
    user: req.user._id,
  });

  const createdTodo = await todo.save();
  res.status(201).json(createdTodo);
});

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = asyncHandler(async (req, res) => {
  const { description, category, dueDate, completed } = req.body;

  // Ensure the todo exists
  const todo = await Todo.findById(req.params.id);
  
  if (!todo) {
    res.status(404);
    throw new Error('Todo not found');
  }

  // Update fields if provided
  if (description) todo.description = description;
  if (category) todo.category = category;
  if (dueDate) todo.dueDate = dueDate;
  if (completed !== undefined) todo.completed = completed;

  const updatedTodo = await todo.save();
  res.json(updatedTodo);
});


// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (todo) {
    await todo.deleteOne();
    res.json({ message: 'Todo removed' });
  } else {
    res.status(404);
    throw new Error('Todo not found');
  }
});

export {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};