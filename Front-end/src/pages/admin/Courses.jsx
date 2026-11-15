
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Courses({
  courses = [],
  loading = false,
  error = "",
  onCreateCourse,
  onSelectCourse,
}) {
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

        <Button onClick={onCreateCourse}>
          Add Course
        </Button>
      </header>

      <ErrorMessage message={error} />

      {courses.length === 0 ? (
        <div className="empty-state">
          <h2>No courses yet</h2>
          <p>There are currently no courses to display.</p>
        </div>
      ) : (
        <div className="courses-list">
          {courses.map((course) => (
            <article className="course-card" key={course.id}>
              <div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
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
    </section>
  );
}

export default Courses;
