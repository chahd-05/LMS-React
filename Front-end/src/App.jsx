
import { useState } from "react";

import "./App.css";

import AdminLayout from "./components/layouts/AdminLayout";
import LearnerLayout from "./components/layouts/LearnerLayout";
import TrainerLayout from "./components/layouts/TrainerLayout";

import Courses from "./pages/admin/Courses";
import Users from "./pages/admin/Users";
import LearnerHome from "./pages/learner/LearnerHome";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";

import { apiRequest } from "./services/api";

import ProtectedView from "./components/common/ProtectedView";


import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [accessError, setAccessError] = useState("");

  const [currentPage, setCurrentPage] = useState("courses");

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

  const handleLoadCourses = async (authToken = token) => {
    setCoursesLoading(true);
    setCoursesError("");

    try {
      let path = "/courses";
      if (currentUser?.role === "admin") {
        path = "/courses/catalog";
      } else if (currentUser?.role === "trainer") {
        path = "/trainer/courses";
      }

      const response = await apiRequest(path, {
        token:
          currentUser?.role === "admin" || currentUser?.role === "trainer"
            ? authToken
            : undefined,
      });

      const coursesWithIds = response.data.map((course) => ({
        ...course,
        id: course.id || course._id,
        status: normalizeCourseStatus(course),
      }));

      setCourses(coursesWithIds);
    } catch (error) {
      handleApiError(error);
      setCoursesError(error.message || "Unable to load courses.");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleLoadLearnerEnrollments = async (authToken = token) => {
    setLearnerLoading(true);
    setLearnerError("");

    try {
      const enrollments = await apiRequest("/enrollments/me", {
        token: authToken,
      });

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
        error.message || "Unable to load your enrolled courses."
      );
    } finally {
      setLearnerLoading(false);
    }
  };

  const handleLogin = async ({ email, password }) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const { token, user } = response.data;

    setToken(token);
    setAccessError("");
    setLearnerLoading(true);
    setLearnerError("");
    setCurrentUser(user);

    if (user.role === "learner") {
      setLearnerProfile(user);

      try {
        const profileResponse = await apiRequest("/auth/me", { token });
        setLearnerProfile(profileResponse.data);
        setCurrentUser(profileResponse.data);

        const enrollments = await apiRequest("/enrollments/me", { token });

        const enrolledCourses = enrollments
          .filter((enrollment) => enrollment.course)
          .map((enrollment) => ({
            ...enrollment.course,
            id: enrollment.course.id || enrollment.course._id,
            enrollmentStatus: enrollment.status,
            progress: enrollment.progress || 0,
          }));

        setLearnerEnrollments(enrolledCourses);
      } catch (learnerError) {
        handleApiError(learnerError);
        setLearnerError(
          learnerError.message || "Unable to load your learner space."
        );
      } finally {
        setLearnerLoading(false);
      }

      navigate("/learner");
      return;
    } else {
      setCurrentUser(user);

      navigate(
        user.role === "admin" ? "/admin/courses" : "/trainer/courses"
      );
    }

    setCoursesLoading(true);
    setCoursesError("");

    try {
      let path = "/courses";

      if (user.role === "admin") {
        path = "/courses/catalog";
      } else if (user.role === "trainer") {
        path = "/trainer/courses";
      }

      const coursesResponse = await apiRequest(path, {
        token:
          user.role === "admin" || user.role === "trainer"
            ? token
            : undefined,
      });

      setCourses(
        coursesResponse.data.map((course) => ({
          ...course,
          id: course.id || course._id,
          status: normalizeCourseStatus(course),
        }))
      );
    } catch (coursesError) {
      setCoursesError(
        coursesError.message || "Unable to load courses."
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentPage("courses");
    setAccessError("");
    navigate("/login", { replace: true});
  };

  const handleApiError = (error) => {
    if (error.status === 401) {
      handleLogout();
      return;
    }

    if (error.status === 403) {
      setAccessError("Accès refusé. Vous n'avez pas la permission.");
    }
  };

  const authenticatedRequest = async (path, options = {}) => {
    try {
      return await apiRequest(path, {
        ...options,
        token,
      });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleLoadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await authenticatedRequest("/users");

      const usersWithIds = response.data.map((user) => ({
        ...user,
        id: user.id || user._id,
      }));

      setUsers(usersWithIds);
    } catch (error) {
      setUsersError(error.message || "Unable to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      return await apiRequest("/auth/register", {
        method: "POST",
        body: userData,
      });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    return await authenticatedRequest(`/users/${userId}`, {
      method: "PUT",
      body: userData,
    });
  };

  const handleUpdateUserStatus = async (userId, status) => {
    return await authenticatedRequest(`/users/${userId}/status`, {
      method: "PATCH",
      body: { status },
    });
  };

  const handleCreateCourse = async (courseData) => {
    return await authenticatedRequest("/courses", {
      method: "POST",
      body: courseData,
    });
  };

  const handleUpdateCourse = async (courseId, courseData) => {
    return await authenticatedRequest(`/courses/${courseId}`, {
      method: "PUT",
      body: courseData,
    });
  };

  const handleUpdateCourseStatus = async (courseId, status) => {
    return await authenticatedRequest(`/courses/${courseId}/${status}`, {
      method: "PATCH",
    });
  };

  const renderAdminPage = () => {
    if (currentPage === "users") {
      return (
        <Users
          users={users}
          loading={usersLoading}
          error={usersError}
          onRefreshUsers={handleLoadUsers}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onUpdateUserStatus={handleUpdateUserStatus}
        />
      );
    }

    return (
      <Courses
        courses={courses}
        loading={coursesLoading}
        error={coursesError}
        onRefreshCourses={() => handleLoadCourses(token)}
        canManageCourses={currentUser?.role === "trainer"}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onUpdateCourseStatus={handleUpdateCourseStatus}
      />
    );
  };

  
  const homePath =
    currentUser?.role === "learner"
      ? "/learner"
      : currentUser?.role === "trainer"
        ? "/trainer/courses"
        : currentUser?.role === "admin"
          ? "/admin/courses"
          : "/login";

  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<Navigate to={homePath} replace />}
      />

      <Route
        path="/learner"
        element={
          currentUser.role === "learner" ? (
            <ProtectedView
              session={currentUser}
              allowedRoles={["learner"]}
            >
              <LearnerLayout
                onLogout={handleLogout}
                user={currentUser}
              >
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <LearnerHome
                  user={learnerProfile || currentUser}
                  courses={learnerEnrollments}
                  loading={learnerLoading}
                  error={learnerError}
                  onRefreshCourses={() =>
                    handleLoadLearnerEnrollments(token)
                  }
                  onSelectCourse={(course) => {
                    console.log("Selected course:", course);
                  }}
                />
              </LearnerLayout>
            </ProtectedView>
          ) : (
            <Navigate to={homePath} replace />
          )
        }
      />

      <Route
        path="/trainer/courses"
        element={
          currentUser.role === "trainer" ? (
            <ProtectedView
              session={currentUser}
              allowedRoles={["trainer"]}
            >
              <TrainerLayout onLogout={handleLogout}>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                {renderAdminPage()}
              </TrainerLayout>
            </ProtectedView>
          ) : (
            <Navigate to={homePath} replace />
          )
        }
      />

      <Route
        path="/admin/courses"
        element={
          currentUser.role === "admin" ? (
            <ProtectedView
              session={currentUser}
              allowedRoles={["admin"]}
            >
              <AdminLayout onLogout={handleLogout}>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <nav className="page-navigation">
                  <Link to="/admin/courses">Courses</Link>
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
                  onRefreshCourses={() => handleLoadCourses(token)}
                  canManageCourses={true}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onUpdateCourseStatus={handleUpdateCourseStatus}
                />
              </AdminLayout>
            </ProtectedView>
          ) : (
            <Navigate to={homePath} replace />
          )
        }
      />

      <Route
        path="/admin/users"
        element={
          currentUser.role === "admin" ? (
            <ProtectedView
              session={currentUser}
              allowedRoles={["admin"]}
            >
              <AdminLayout onLogout={handleLogout}>
                {accessError && (
                  <p className="error-message" role="alert">
                    {accessError}
                  </p>
                )}

                <nav className="page-navigation">
                  <Link
                    to="/admin/courses"
                    onClick={() => handleLoadCourses(token)}
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
              </AdminLayout>
            </ProtectedView>
          ) : (
            <Navigate to={homePath} replace />
          )
        }
      />

      <Route
        path="/"
        element={<Navigate to={homePath} replace />}
      />

      <Route
        path="*"
        element={<Navigate to={homePath} replace />}
      />

      <Route
      path="/403"
      element={<Forbidden />}
      />

      <Route
      path="*"
      element={<NotFound />}
      />
    </Routes>
  );
}

export default App;
