
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function LearnerHome({
  user,
  courses = [],
  loading = false,
  error = "",
  onRefreshCourses,
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
          {user?.email && (
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          )}
        </div>
        <Button onClick={onRefreshCourses} disabled={loading}>
          {loading ? "Loading..." : "Refresh My Courses"}
        </Button>
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
                <p>
                  Category: {course.category} | Level: {course.level}
                </p>
                <span>{course.status}</span>
                <p>Enrollment: {course.enrollmentStatus || "active"}</p>
                <p>Progress: {course.progress || 0}%</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default LearnerHome;
