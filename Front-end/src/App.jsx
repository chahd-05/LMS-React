
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

  const [users] = useState([
    {
      id: 1,
      name: "Sara Ahmed",
      email: "sara@example.com",
      role: "learner",
      status: "active",
    },
    {
      id: 2,
      name: "Youssef Ali",
      email: "youssef@example.com",
      role: "learner",
      status: "active",
    },
  ]);

  const handleLogin = async ({ email, password }) => {
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const { token, user } = response.data;

      setToken(token);
      setCurrentUser(user);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentPage("courses");
  };

  const renderAdminPage = () => {
    if (currentPage === "users") {
      return (
        <Users
          users={users}
          onCreateUser={() => console.log("Create user")}
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
          <LearnerHome
            user={{ name: currentUser.name }}
            courses={courses}
            onSelectCourse={(course) =>
              console.log("Selected course:", course)
            }
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
          <nav className="page-navigation">
            <button
              type="button"
              onClick={() => setCurrentPage("courses")}
            >
              Courses
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage("users")}
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
