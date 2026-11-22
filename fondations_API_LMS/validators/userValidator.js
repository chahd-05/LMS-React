const { z } = require("zod");

const updateUserSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(2, "Name must contain at least 2 characters"),
    email: z
      .string({ error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email address"),
    role: z.enum(["learner", "trainer", "admin"], {
      error: "Invalid user role",
    }),
  })
  .strict();

const updateUserStatusSchema = z
  .object({
    status: z.enum(["active", "suspended"], {
      error: "Status must be active or suspended",
    }),
  })
  .strict();

module.exports = {
  updateUserSchema,
  updateUserStatusSchema,
};
