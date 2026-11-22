const bcrypt = require("bcrypt");
const request = require("supertest");
const { randomUUID } = require("crypto");

const app = require("../app");
const User = require("../models/User");
const Course = require("../models/Course");

describe("Trainer course management", () => {
  const domain = `${randomUUID()}.example.test`;
  const password = "Password123";
  const trainerEmail = `trainer@${domain}`;
  const learnerEmail = `learner@${domain}`;
  let trainer;
  let trainerToken;
  let learnerToken;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(password, 10);
    trainer = await User.create({
      name: "Course Trainer",
      email: trainerEmail,
      password: hashedPassword,
      role: "trainer",
    });
    await User.create({
      name: "Course Learner",
      email: learnerEmail,
      password: hashedPassword,
      role: "learner",
    });

    const trainerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: trainerEmail, password });
    trainerToken = trainerLogin.body.data.token;

    const learnerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: learnerEmail, password });
    learnerToken = learnerLogin.body.data.token;
  });

  afterEach(async () => {
    if (trainer) {
      await Course.deleteMany({ trainer: trainer._id });
    }
    await User.deleteMany({
      email: { $in: [trainerEmail, learnerEmail] },
    });
  });

  const coursePayload = (title = "Test Course") => ({
    title,
    description: "Course description",
    objectives: ["Learn the basics"],
    level: "beginner",
    category: "Development",
    estimatedDuration: 60,
  });

  test("allows a trainer to create a course", async () => {
    const response = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${trainerToken}`)
      .send(coursePayload());

    expect(response.statusCode).toBe(201);
    expect(response.body.data.status).toBe("draft");
  });

  test("rejects invalid course creation data", async () => {
    const response = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${trainerToken}`)
      .send({ title: "", level: "invalid" });

    expect(response.statusCode).toBe(400);
  });

  test("allows a trainer to update and archive their course", async () => {
    const course = await Course.create({
      ...coursePayload("Update Me"),
      trainer: trainer._id,
    });

    const updateResponse = await request(app)
      .put(`/api/courses/${course._id}`)
      .set("Authorization", `Bearer ${trainerToken}`)
      .send(coursePayload("Updated Course"));

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.title).toBe("Updated Course");

    const archiveResponse = await request(app)
      .patch(`/api/courses/${course._id}/archived`)
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.body.data.status).toBe("archived");
  });

  test("rejects unauthorized course mutations", async () => {
    const course = await Course.create({
      ...coursePayload("Private Course"),
      trainer: trainer._id,
    });

    const updateResponse = await request(app)
      .put(`/api/courses/${course._id}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .send(coursePayload("Unauthorized"));

    expect(updateResponse.statusCode).toBe(403);

    const archiveResponse = await request(app)
      .patch(`/api/courses/${course._id}/archived`)
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(archiveResponse.statusCode).toBe(403);
  });

  test("rejects an invalid course status", async () => {
    const course = await Course.create({
      ...coursePayload("Status Course"),
      trainer: trainer._id,
    });

    const response = await request(app)
      .patch(`/api/courses/${course._id}/invalid`)
      .set("Authorization", `Bearer ${trainerToken}`);

    expect(response.statusCode).toBe(400);
  });
});
