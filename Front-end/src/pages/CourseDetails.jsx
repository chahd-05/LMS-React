import { useParams, Link } from "react-router-dom";

function CourseDetails({ courses = [] }) {
  const { courseId } = useParams();

  const course = courses.find(
    (item) => String(item.id) === courseId
  );

  if (!course) {
    return (
      <main>
        <h1>Course Not Found</h1>
        <Link to="/admin/courses">Back to Courses</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>{course.title}</h1>

      <p>{course.description}</p>

      <h2>Objectives</h2>
      <ul>
        {course.objectives?.map((objective, index) => (
          <li key={index}>{objective}</li>
        ))}
      </ul>

      <p>Category: {course.category}</p>
      <p>Level: {course.level}</p>
      <p>
        Duration: {course.estimatedDuration} minutes
      </p>

      <Link to="/admin/courses">Back to Courses</Link>
    </main>
  );
}

export default CourseDetails;
