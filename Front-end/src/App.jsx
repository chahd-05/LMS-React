
import { useState } from "react";
import "./App.css";

import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router";

import AdminLayout from "./components/layouts/AdminLayout";
import LearnerLayout from "./components/layouts/LearnerLayout";
import TrainerLayout from "./components/layouts/TrainerLayout";

import Courses from "./pages/admin/Courses";
import Users from "./pages/admin/Users";
import LearnerHome from "./pages/learner/LearnerHome";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import CourseDetails from "./pages/CourseDetails";
import PublicCourse from "./pages/PublicCourse";

import ProtectedView from "./components/layouts/ProtectedView";

// Auth services
import {
  loginApi,
  getCurrentUserApi,
} from "./services/auth/api";

// Courses services
import {
  getCoursesApi,
  createCourseApi,
  updateCourseApi,
  updateCourseStatusApi,
} from "./services/courses/api";

// Users services
import {
  getUsersApi,
  createUserApi,
  updateUserApi,
  updateUserStatusApi,
} from "./services/users/api";

// Enrollments services
import { getMyEnrollmentsApi } from "./services/enrollments/api";

function App() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [accessError, setAccessError] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [learnerEnrollments, setLearnerEnrollments] = useState([]);
  const [learnerLoading, setLearnerLoading] = useState(false);
  const [learnerError, setLearnerError] = useState("");
  const [learnerProfile, setLearnerProfile] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const normalizeCourseStatus = (course) => {
    const rawStatus =
      course.status || course.publicationStatus || "draft";

    const status = String(rawStatus).trim().toLowerCase();

    if (["draft", "published", "archived"].includes(status)) {
      return status;
    }

    return "draft";
  };

  const handleApiError = (error) => {
    const status = error.response?.status;

    if (status === 401) {
      handleLogout();
      return;
    }

    if (status === 403) {
      setAccessError("Accès refusé. Vous n'avez pas la permission.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setAccessError("");
    navigate("/login", { replace: true });
  };

  const handleLoadCourses = async (role = currentUser?.role) => {
    setCoursesLoading(true);
    setCoursesError("");

    try {
      const response = await getCoursesApi(role);

      const coursesWithIds = response.data.map((course) => ({
        ...course,
        id: course.id || course._id,
        status: normalizeCourseStatus(course),
      }));

      setCourses(coursesWithIds);
    } catch (error) {
      handleApiError(error);
      setCoursesError(
        error.response?.data?.message || "Unable to load courses."
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleLoadLearnerEnrollments = async () => {
    setLearnerLoading(true);
    setLearnerError("");

    try {
      const enrollments = await getMyEnrollmentsApi();

      const enrolledCourses = enrollments
        .filter((enrollment) => enrollment.course)
        .map((enrollment) => ({
          ...enrollment.course,
          id: enrollment.course.id || enrollment.course._id,
          enrollmentStatus: enrollment.status,
          progress: enrollment.progress || 0,
        }));

      setLearnerEnrollments(enrolledCourses);
    } catch (error) {
      handleApiError(error);
      setLearnerError(
        error.response?.data?.message ||
          "Unable to load your enrolled courses."
      );
    } finally {
      setLearnerLoading(false);
    }
  };

  const handleLogin = async ({ email, password }) => {
    try {
      const response = await loginApi({ email, password });

      const { token: authToken, user } = response.data;

      localStorage.setItem("token", authToken);

      setAccessError("");
      setCurrentUser(user);

      if (user.role === "learner") {
        setLearnerLoading(true);
        setLearnerError("");
        setLearnerProfile(user);

        try {
          const profile = await getCurrentUserApi();

          setLearnerProfile(profile);
          setCurrentUser(profile);

          const enrollments = await getMyEnrollmentsApi();

          const enrolledCourses = enrollments
            .filter((enrollment) => enrollment.course)
            .map((enrollment) => ({
              ...enrollment.course,
              id: enrollment.course.id || enrollment.course._id,
              enrollmentStatus: enrollment.status,
              progress: enrollment.progress || 0,
            }));

          setLearnerEnrollments(enrolledCourses);
        } catch (error) {
          handleApiError(error);
          setLearnerError(
            error.response?.data?.message ||
              "Unable to load your learner space."
          );
        } finally {
          setLearnerLoading(false);
        }

        navigate("/learner");
        return;
      }

      navigate(
        user.role === "admin"
          ? "/admin/courses"
          : "/trainer/courses"
      );

      await handleLoadCourses(user.role);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleLoadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await getUsersApi();

      const usersWithIds = response.data.map((user) => ({
        ...user,
        id: user.id || user._id,
      }));

      setUsers(usersWithIds);
    } catch (error) {
      handleApiError(error);
      setUsersError(
        error.response?.data?.message || "Unable to load users."
      );
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await createUserApi(userData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      const response = await updateUserApi(userId, userData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const response = await updateUserStatusApi(userId, status);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      const response = await createCourseApi(courseData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleUpdateCourse = async (courseId, courseData) => {
    try {
      const response = await updateCourseApi(courseId, courseData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleUpdateCourseStatus = async (courseId, status) => {
    try {
      const response = await updateCourseStatusApi(courseId, status);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const homePath =
    currentUser?.role === "learner"
      ? "/learner"
      : currentUser?.role === "trainer"
        ? "/trainer/courses"
        : currentUser?.role === "admin"
          ? "/admin/courses"
          : "/login";

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/courses" element={<PublicCourse />} />

      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={homePath} replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Learner routes */}
      <Route
        element={
          <ProtectedView
            session={currentUser}
            allowedRoles={["learner"]}
          />
        }
      >
        <Route
          path="/learner"
          element={
            <LearnerLayout
              onLogout={handleLogout}
              user={currentUser}
            />
          }
        >
          <Route
            index
            element={
              <LearnerHome
                user={learnerProfile || currentUser}
                courses={learnerEnrollments}
                loading={learnerLoading}
                error={learnerError}
                onRefreshCourses={handleLoadLearnerEnrollments}
                onSelectCourse={(course) => {
                  console.log("Selected course:", course);
                }}
              />
            }
          />
        </Route>
      </Route>

      {/* Trainer routes */}
      <Route
        element={
          <ProtectedView
            session={currentUser}
            allowedRoles={["trainer"]}
          />
        }
      >
        <Route
          path="/trainer"
          element={<TrainerLayout onLogout={handleLogout} />}
        >
          <Route index element={<Navigate to="courses" replace />} />

          <Route
            path="courses"
            element={
              <>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <Courses
                  courses={courses}
                  loading={coursesLoading}
                  error={coursesError}
                  onRefreshCourses={handleLoadCourses}
                  canManageCourses={true}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onUpdateCourseStatus={handleUpdateCourseStatus}
                />
              </>
            }
          />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <ProtectedView
            session={currentUser}
            allowedRoles={["admin"]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout onLogout={handleLogout} />}
        >
          <Route index element={<Navigate to="courses" replace />} />

          <Route
            path="courses"
            element={
              <>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <nav className="page-navigation">
                  <Link
                    to="/admin/courses"
                    onClick={() => handleLoadCourses()}
                  >
                    Courses
                  </Link>

                  <Link
                    to="/admin/users"
                    onClick={handleLoadUsers}
                  >
                    Users
                  </Link>
                </nav>

                <Courses
                  courses={courses}
                  loading={coursesLoading}
                  error={coursesError}
                  onRefreshCourses={handleLoadCourses}
                  canManageCourses={true}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onUpdateCourseStatus={handleUpdateCourseStatus}
                />
              </>
            }
          />

          <Route
            path="users"
            element={
              <>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <nav className="page-navigation">
                  <Link
                    to="/admin/courses"
                    onClick={() => handleLoadCourses()}
                  >
                    Courses
                  </Link>

                  <Link to="/admin/users">Users</Link>
                </nav>

                <Users
                  users={users}
                  loading={usersLoading}
                  error={usersError}
                  onRefreshUsers={handleLoadUsers}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  onUpdateUserStatus={handleUpdateUserStatus}
                />
              </>
            }
          />
        </Route>
      </Route>

      {/* Protected course details */}
      <Route
        element={
          <ProtectedView
            session={currentUser}
            allowedRoles={["admin", "trainer", "learner"]}
          />
        }
      >
        <Route
          path="/courses/:courseId"
          element={
            <CourseDetails
              courses={
                currentUser?.role === "learner"
                  ? learnerEnrollments
                  : courses
              }
              backPath={homePath}
            />
          }
        />
      </Route>

      {/* Other routes */}
      <Route path="/" element={<Navigate to={homePath} replace />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
