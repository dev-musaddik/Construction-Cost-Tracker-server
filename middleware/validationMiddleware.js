import Joi from 'joi';

// --- Helpers ---
const objectId = (label = 'ObjectId') =>
  Joi.string()
    .length(24)        // <-- 24, not 32
    .hex()
    .messages({
      'string.length': `"${label}" must be a 24-character hex string`,
      'string.hex': `"${label}" must only contain hexadecimal characters`,
      'string.base': `"${label}" must be a string`,
    });
// Generic validator middleware with friendlier behavior
// - abortEarly: false -> show all errors
// - stripUnknown: true -> unknown keys are removed (prevents noisy errors)
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      message: error.details.map((d) => d.message).join(', '),
      details: error.details,
    });
  }
  req.body = value;
  next();
};

// --- Auth/User ---
export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
}).min(1); // require at least one field

export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('user', 'admin').optional(),
}).min(1);

// --- Category ---
export const createCategorySchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
});

// --- Expense ---
// Allow an explicit transaction `date` (ISO string). If omitted, the model default will be used.
export const createExpenseSchema = Joi.object({
  description: Joi.string().min(3).max(100).required(),
  amount: Joi.number().positive().required(),
  category: objectId().required(),
  date: Joi.date().iso().optional(), // NEW: allow client-provided date
  isContract: Joi.boolean().optional(), // NEW: Optional field for contract status
});

export const updateExpenseSchema = Joi.object({
  description: Joi.string().min(3).max(100).optional(),
  amount: Joi.number().positive().optional(),
  category: objectId().optional(),
  date: Joi.date().iso().optional(), // NEW: allow updating date
  isContract: Joi.boolean().optional(), // NEW: Optional field for contract status
}).min(1); // require at least one field to update


export default {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateUserSchema,
  createCategorySchema,
  updateCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
};
