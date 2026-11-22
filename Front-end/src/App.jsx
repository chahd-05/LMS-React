
import { useState } from "react";

import "./App.css";

import AdminLayout from "./components/layouts/AdminLayout";
import LearnerLayout from "./components/layouts/LearnerLayout";

import Courses from "./pages/Admin/Courses";
import Users from "./pages/Admin/Users";
import LearnerHome from "./pages/Learner/LearnerHome";
import Login from "./pages/Login";

import { apiRequest } from "./services/api";

import ProtectedView from "./components/common/protectedView";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [accessError, setAccessError] = useState("");

  const [currentPage, setCurrentPage] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const handleLoadCourses = async (authToken = token) => {
    setCoursesLoading(true);
    setCoursesError("");

    try {
      const path =
        currentUser?.role === "admin" ? "/courses/catalog" : "/courses";
      const response = await apiRequest(path, {
        token: currentUser?.role === "admin" ? authToken : undefined,
      });
      const coursesWithIds = response.data.map((course) => ({
        ...course,
        id: course.id || course._id,
      }));

      setCourses(coursesWithIds);
    } catch (error) {
      handleApiError(error);
      setCoursesError(error.message || "Unable to load courses.");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleLogin = async ({ email, password }) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const { token, user } = response.data;

    setToken(token);
    setCurrentUser(user);
    setAccessError("");

    setCoursesLoading(true);
    setCoursesError("");

    try {
      const path = user.role === "admin" ? "/courses/catalog" : "/courses";
      const coursesResponse = await apiRequest(path, {
        token: user.role === "admin" ? token : undefined,
      });
      setCourses(
        coursesResponse.data.map((course) => ({
          ...course,
          id: course.id || course._id,
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
        onCreateCourse={() => console.log("Create course")}
        onSelectCourse={(course) =>
          console.log("Selected course:", course)
        }
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
        <LearnerLayout onLogout={handleLogout}>
          {accessError && (
            <p className="error-message" role="alert">
              {accessError}
            </p>
          )}

          <LearnerHome
            user={{ name: currentUser.name }}
            courses={courses}
            loading={coursesLoading}
            error={coursesError}
            onSelectCourse={(course) => {
              console.log("Selected course:", course);
            }}
          />
        </LearnerLayout>
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
