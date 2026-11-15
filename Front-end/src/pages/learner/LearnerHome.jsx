
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function LearnerHome({
  user,
  courses = [],
  loading = false,
  error = "",
  onSelectCourse,
}) {
  if (loading) {
    return <Loading message="Loading your courses..." />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Welcome, {user?.name || "Learner"}!</h1>
          <p>Continue learning and explore your courses.</p>
        </div>
      </header>

      <ErrorMessage message={error} />

      <section className="learner-courses">
        <h2>My Courses</h2>

        {courses.length === 0 ? (
          <div className="empty-state">
            <h3>You are not enrolled in any courses yet.</h3>
            <p>Your courses will appear here when they are available.</p>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <Button
                  variant="secondary"
                  onClick={() => onSelectCourse?.(course)}
                >
                  View Course
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default LearnerHome;
