# EduLearn LMS

EduLearn is a React frontend and Express/MongoDB LMS API for Admin, Trainer and Learner accounts.

## Installation

```bash
cd Front-end
npm install

cd ../fondations_API_LMS
npm install
```

Copy the environment examples and replace placeholder values locally:

- `Front-end/.env.example`
- `fondations_API_LMS/.env.example`

## Start the application

Frontend:

```bash
cd Front-end
npm run dev
```

Backend:

```bash
cd fondations_API_LMS
npm start
```

The frontend default API URL is `http://localhost:3000/api`.

## Environment variables

Frontend:

- `VITE_API_URL`: LMS API base URL.

Backend:

- `PORT`: API port.
- `MONGO_URI`: MongoDB database URI.
- `JWT_SECRET`: JWT signing secret.
- `JWT_EXPIRES_IN`: JWT lifetime.
- `MONGO_TEST_URI`: MongoDB URI used by Jest.
- `SEED_DEMO_PASSWORD`: Password used by the demo seed.
- SMTP variables: local email delivery configuration.

Never commit real secrets.

## Architecture

- `Front-end/src/App.jsx`: authentication state and role routing.
- `Front-end/src/pages`: Admin, Trainer and Learner pages.
- `Front-end/src/components/layouts`: role-specific layouts.
- `Front-end/src/services/api.js`: shared authenticated fetch helper.
- `fondations_API_LMS/routes`: Express routes.
- `fondations_API_LMS/controllers`: request handlers.
- `fondations_API_LMS/models`: Mongoose models.
- `fondations_API_LMS/validators`: Zod validation schemas.

## Relevant API endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/enrollments/me`
- `POST /api/courses/:courseId/enroll`
- `GET /api/courses/catalog`
- `GET /api/trainer/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `PATCH /api/courses/:id/:status`
- `GET /api/users`

## Learner behavior

Learners see their profile and only their own enrollment data. `/api/enrollments/me` filters enrollments by the authenticated account. Learner navigation does not expose Admin or Trainer management actions, and backend role middleware protects management routes.

## Checks

```bash
cd Front-end
npm run build
npm run lint
```

Backend tests:

```bash
cd fondations_API_LMS
npm test
```

Backend Jest tests require `MONGO_TEST_URI`.

## 10-minute demo checklist

1. Start MongoDB and the backend.
2. Start the frontend.
3. Sign in as Admin and verify user management.
4. Sign in as Trainer and create, edit, publish, unpublish or archive a course.
5. Sign in as Learner and verify the personalized welcome and My Courses.
6. Verify that Learner has no Admin or Trainer navigation.
7. Refresh the Learner course list and test mobile layouts.
8. Explain role middleware, enrollment ownership and loading/error states.

## Known limitations

- Backend Jest tests require `MONGO_TEST_URI` and a reachable MongoDB test database.
- Browser console, responsive layout and keyboard behavior require manual verification.
- The enrollment API returns enrollment data for the authenticated account; it does not expose another learner's enrollments.
