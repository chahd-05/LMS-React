
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

  const [courses] = useState([
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Learn the basics of JavaScript.",
      status: "Published",
    },
    {
      id: 2,
      title: "React Fundamentals",
      description: "Learn components, props and state.",
      status: "Published",
    },
  ]);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const handleLogin = async ({ email, password }) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const { token, user } = response.data;

    setToken(token);
    setCurrentUser(user);
    setAccessError("");
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

  const renderAdminPage = () => {
    if (currentPage === "users") {
      return (
        <Users
          users={users}
          loading={usersLoading}
          error={usersError}
          onRefreshUsers={handleLoadUsers}
          onSelectUser={(user) =>
            console.log("Selected user:", user)
          }
        />
      );
    }

    return (
      <Courses
        courses={courses}
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
              onClick={() => setCurrentPage("courses")}
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
