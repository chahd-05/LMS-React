const bcrypt = require("bcrypt");
const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../app");
const User = require("../models/User");

const domain = `${randomUUID()}.example.test`;
const adminEmail = `admin@${domain}`;
const learnerEmail = `learner@${domain}`;
const trainerEmail = `trainer@${domain}`;
const password = "Password123";

describe("GET /api/users", () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create([
      { name: "Test Admin", email: adminEmail, password: hashedPassword, role: "admin" },
      { name: "Test Learner", email: learnerEmail, password: hashedPassword, role: "learner" },
      { name: "Test Trainer", email: trainerEmail, password: hashedPassword, role: "trainer" },
    ]);
  });

  afterEach(async () => {
    await User.deleteMany({ email: { $regex: `@${domain.replace(/\./g, "\\.")}$` } });
    jest.restoreAllMocks();
  });

  const login = async (email) => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(response.statusCode).toBe(200);
    return response.body.data.token;
  };

  test("returns 401 when the request is unauthenticated", async () => {
    const response = await request(app).get("/api/users");

    expect(response.statusCode).toBe(401);
  });

  test("returns 403 when a non-admin requests users", async () => {
    const token = await login(learnerEmail);
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  test("returns real users to an admin without sensitive fields", async () => {
    const token = await login(adminEmail);
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe(200);
    expect(response.body.count).toBe(response.body.data.length);

    const returnedUsers = response.body.data.filter((user) =>
      [adminEmail, learnerEmail, trainerEmail].includes(user.email)
    );

    expect(returnedUsers).toHaveLength(3);
    returnedUsers.forEach((user) => {
      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("status");
      expect(user).not.toHaveProperty("password");
    });
  });

  test("returns an empty list when no users are found", async () => {
    const token = await login(adminEmail);
    jest.spyOn(User, "find").mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      status: 200,
      count: 0,
      data: [],
    });
  });
});
