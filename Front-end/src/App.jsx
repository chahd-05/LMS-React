
import { useState } from "react";

import "./App.css";

import AdminLayout from "./components/layouts/AdminLayout";
import LearnerLayout from "./components/layouts/LearnerLayout";
import TrainerLayout from "./components/layouts/TrainerLayout";

import Courses from "./pages/admin/Courses";
import Users from "./pages/admin/Users";
import LearnerHome from "./pages/learner/LearnerHome";
import Login from "./pages/Login";

import { apiRequest } from "./services/api";

import ProtectedView from "./components/common/ProtectedView";

function App() {
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

      return;
    } else {
      setCurrentUser(user);
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

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentUser.role === "learner") {
    return (
      <ProtectedView
        session={currentUser}
        allowedRoles={["learner"]}
      >
        <LearnerLayout onLogout={handleLogout} user={currentUser}>
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
    );
  }

  if (currentUser.role === "trainer") {
    return (
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
    );
  }

  if (currentUser.role === "admin") {
    return (
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
            <button
              type="button"
              onClick={() => {
                setCurrentPage("courses");
                handleLoadCourses(token);
              }}
            >
              Courses
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentPage("users");
                handleLoadUsers();
              }}
            >
              Users
            </button>
          </nav>

          {renderAdminPage()}
        </AdminLayout>
      </ProtectedView>
    );
  }

  return <p role="alert">Rôle non pris en charge.</p>;
}

export default App;
