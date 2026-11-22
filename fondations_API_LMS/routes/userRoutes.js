const express = require("express");
const {
  getUsers,
  updateUser,
  updateUserStatus,
} = require("../controllers/userController");
const authenticate = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const {
  updateUserSchema,
  updateUserStatusSchema,
} = require("../validators/userValidator");
const { roles } = require("../consts/roles");

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users (admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       role:
 *                         type: string
 *                         enum: [learner, trainer, admin]
 *                       status:
 *                         type: string
 *                         enum: [active, suspended]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                     required: [_id, name, email, role, status, createdAt]
 *             example:
 *               status: 200
 *               message: Users retrieved successfully
 *               count: 1
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: Jamie Example
 *                   email: jamie@example.com
 *                   role: learner
 *                   status: active
 *                   createdAt: "2026-11-22T12:00:00.000Z"
 *       401:
 *         description: Missing, invalid, or expired authentication token
 *         content:
 *           application/json:
 *             example:
 *               status: 401
 *               message: Authorization header missing
 *       403:
 *         description: The authenticated user is not an admin
 *         content:
 *           application/json:
 *             example:
 *               status: 403
 *               message: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, authorize(roles.ADMIN), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [learner, trainer, admin]
 */
router.put(
  "/:id",
  authenticate,
  authorize(roles.ADMIN),
  validate(updateUserSchema),
  updateUser
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate or suspend a user (admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(roles.ADMIN),
  validate(updateUserStatusSchema),
  updateUserStatus
);

module.exports = router;
