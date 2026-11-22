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

describe("Admin user management", () => {
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
  });

  const login = async (email) => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    return response.body.data && response.body.data.token;
  };

  test("allows an admin to update a user", async () => {
    const token = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .put(`/api/users/${learner._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Learner",
        email: learnerEmail,
        role: "trainer",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("updated learner");
    expect(response.body.data.role).toBe("trainer");
    expect(response.body.data).not.toHaveProperty("password");
  });

  test("rejects invalid update data", async () => {
    const token = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .put(`/api/users/${learner._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "A",
        email: "invalid-email",
        role: "invalid-role",
      });

    expect(response.statusCode).toBe(400);
  });

  test("rejects duplicate email updates", async () => {
    const token = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .put(`/api/users/${learner._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Learner",
        email: trainerEmail,
        role: "learner",
      });

    expect(response.statusCode).toBe(409);
  });

  test("rejects unauthorized user updates", async () => {
    const token = await login(learnerEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .put(`/api/users/${learner._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Unauthorized Update",
        email: learnerEmail,
        role: "learner",
      });

    expect(response.statusCode).toBe(403);
  });

  test("allows an admin to suspend and activate a user", async () => {
    const token = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const suspendedResponse = await request(app)
      .patch(`/api/users/${learner._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "suspended" });

    expect(suspendedResponse.statusCode).toBe(200);
    expect(suspendedResponse.body.data.status).toBe("suspended");

    const activatedResponse = await request(app)
      .patch(`/api/users/${learner._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active" });

    expect(activatedResponse.statusCode).toBe(200);
    expect(activatedResponse.body.data.status).toBe("active");
  });

  test("rejects an invalid status change", async () => {
    const token = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .patch(`/api/users/${learner._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "inactive" });

    expect(response.statusCode).toBe(400);
  });

  test("rejects unauthorized status changes", async () => {
    const token = await login(learnerEmail);
    const learner = await User.findOne({ email: learnerEmail });

    const response = await request(app)
      .patch(`/api/users/${learner._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "suspended" });

    expect(response.statusCode).toBe(403);
  });

  test("prevents a suspended user from logging in", async () => {
    const adminToken = await login(adminEmail);
    const learner = await User.findOne({ email: learnerEmail });

    await request(app)
      .patch(`/api/users/${learner._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "suspended" });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: learnerEmail, password });

    expect(loginResponse.statusCode).toBe(403);
  });
});
