
import { useState } from "react";

import "./App.css";

import AdminLayout from "./components/layouts/AdminLayout";
import LearnerLayout from "./components/layouts/LearnerLayout";

import Courses from "./pages/Admin/Courses";
import Users from "./pages/Admin/Users";
import LearnerHome from "./pages/Learner/LearnerHome";

function App() {
  const [currentRole, setCurrentRole] = useState("admin");
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

  const handleLogout = () => {
    setCurrentRole("admin");
    setCurrentPage("courses");
  };

  const renderAdminPage = () => {
    if (currentPage === "users") {
      return (
        <Users
          users={users}
          onCreateUser={() => console.log("Create user")}
          onSelectUser={(user) => console.log("Selected user:", user)}
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

  if (currentRole === "learner") {
    return (
      <LearnerLayout onLogout={handleLogout}>
        <LearnerHome
          user={{ name: "Sara" }}
          courses={courses}
          onSelectCourse={(course) =>
            console.log("Selected course:", course)
          }
        />
      </LearnerLayout>
    );
  }

  return (
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

        <button
          type="button"
          onClick={() => setCurrentRole("learner")}
        >
          Preview Learner
        </button>
      </nav>

      {renderAdminPage()}
    </AdminLayout>
  );
}

export default App;
