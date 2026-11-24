import { Link } from "react-router-dom";

function PublicCourse() {
    return (
        <main className="page">

            <h1>Course Catalog</h1>
            <p>Welcome to EduLearn. Explore our available courses.</p>
            <p>The public course catalog will be available soon.</p>

            <Link to="/login">Login to EduLearn</Link>
        </main>
    )
}

export default PublicCourse;