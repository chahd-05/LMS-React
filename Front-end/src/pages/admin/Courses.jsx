
import { useState } from "react";

import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Courses({
  courses = [],
  loading = false,
  error = "",
  onCreateCourse,
  onSelectCourse,
  onRefreshCourses,
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = [];
  courses.forEach((course) => {
    if (
      course.category &&
      !categories.includes(course.category)
    ) {
      categories.push(course.category);
    }
  });

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      categoryFilter === "all" || course.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;

    return matchesCategory && matchesStatus;
  });

  const resetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  if (loading) {
    return <Loading message="Loading courses..." />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Courses</h1>
          <p>Manage the courses available on EduLearn.</p>
        </div>

        <div className="page-header-actions">
          <Button onClick={onRefreshCourses}>Refresh Courses</Button>
          <Button variant="secondary" onClick={onCreateCourse}>
            Add Course
          </Button>
        </div>
      </header>

      <ErrorMessage message={error} />

      {courses.length === 0 ? (
        <div className="empty-state">
          <h2>No courses yet</h2>
          <p>There are currently no courses to display.</p>
        </div>
      ) : (
        <>
          <div className="courses-toolbar">
            <label className="course-filter">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="course-filter">
              <span>Publication</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All publications</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <h2>No matching courses</h2>
              <p>Try changing or resetting the filters.</p>
            </div>
          ) : (
            <div className="courses-list">
              {filteredCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div>
                    <h2>{course.title}</h2>
                    <p>{course.description}</p>
                    <p>
                      Category: {course.category} | Level: {course.level}
                    </p>
                    <span>{course.status}</span>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => onSelectCourse?.(course)}
                  >
                    View Details
                  </Button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Courses;
