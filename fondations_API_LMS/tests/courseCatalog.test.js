const bcrypt = require("bcrypt");
const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../app");
const User = require("../models/User");
const Course = require("../models/Course");

describe("Admin course catalog", () => {
  const domain = `${randomUUID()}.example.test`;
  const password = "Password123";
  const adminEmail = `admin@${domain}`;
  const learnerEmail = `learner@${domain}`;

  let adminToken;
  let learnerToken;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const users = await User.create([
      {
        name: "Catalog Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
      {
        name: "Catalog Learner",
        email: learnerEmail,
        password: hashedPassword,
        role: "learner",
      },
    ]);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password });
    adminToken = adminLogin.body.data.token;

    const learnerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: learnerEmail, password });
    learnerToken = learnerLogin.body.data.token;

    await Course.create([
      {
        trainer: users[1]._id,
        title: "Backend Basics",
        description: "Learn backend basics",
        level: "beginner",
        category: "Backend",
        estimatedDuration: 60,
        status: "published",
      },
      {
        trainer: users[1]._id,
        title: "Advanced React",
        description: "Learn advanced React",
        level: "advanced",
        category: "Frontend",
        estimatedDuration: 90,
        status: "draft",
      },
    ]);
  });

  afterEach(async () => {
    await Course.deleteMany({
      title: { $in: ["Backend Basics", "Advanced React"] },
    });
    await User.deleteMany({
      email: { $in: [adminEmail, learnerEmail] },
    });
  });

  test("returns the complete catalog to an admin", async () => {
    const response = await request(app)
      .get("/api/courses/catalog")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(2);
  });

  test("combines category and status filters", async () => {
    const response = await request(app)
      .get("/api/courses/catalog?category=Frontend&status=draft")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].title).toBe("Advanced React");
  });

  test("rejects an invalid status filter", async () => {
    const response = await request(app)
      .get("/api/courses/catalog?status=invalid")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(400);
  });

  test("rejects unauthorized users", async () => {
    const response = await request(app)
      .get("/api/courses/catalog")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(response.statusCode).toBe(403);
  });

  test("requires authentication", async () => {
    const response = await request(app).get("/api/courses/catalog");

    expect(response.statusCode).toBe(401);
  });
});
