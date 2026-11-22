
import { useState } from "react";

import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Courses({
  courses = [],
  loading = false,
  error = "",
  onCreateCourse,
  onRefreshCourses,
  onUpdateCourse,
  onUpdateCourseStatus,
  canManageCourses = false,
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [level, setLevel] = useState("beginner");
  const [category, setCategory] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseSuccess, setCourseSuccess] = useState("");
  const [courseError, setCourseError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const getCourseStatus = (course) => {
    const rawStatus =
      course.status || course.publicationStatus || "draft";
    const status = String(rawStatus).trim().toLowerCase();

    if (["draft", "published", "archived"].includes(status)) {
      return status;
    }

    return "draft";
  };

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
      statusFilter === "all" || getCourseStatus(course) === statusFilter;

    return matchesCategory && matchesStatus;
  });

  const resetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const selectedCourse = courses.find(
    (course) => String(course.id) === selectedCourseId
  );

  const openCourseDetails = (course) => {
    setSelectedCourseId(String(course.id));
  };

  const closeCourseDetails = () => {
    setSelectedCourseId(null);
  };

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setObjectives("");
    setLevel("beginner");
    setCategory("");
    setEstimatedDuration("");
    setFieldErrors({});
    setCourseError("");
    setCourseSuccess("");
  };

  const cancelCreateForm = () => {
    clearForm();
    setShowCreateForm(false);
  };

  const openCreateForm = () => {
    clearForm();
    setShowEditForm(false);
    setEditingCourseId(null);
    setCourseSuccess("");
    setCourseError("");
    setShowCreateForm(!showCreateForm);
  };

  const openEditForm = (course) => {
    setShowCreateForm(false);
    setEditingCourseId(course.id);
    setTitle(course.title || "");
    setDescription(course.description || "");
    setObjectives(
      Array.isArray(course.objectives)
        ? course.objectives.join("\n")
        : ""
    );
    setLevel(course.level || "beginner");
    setCategory(course.category || "");
    setEstimatedDuration(String(course.estimatedDuration || ""));
    setFieldErrors({});
    setCourseSuccess("");
    setCourseError("");
    setShowEditForm(true);
  };

  const validateCourse = () => {
    const nextErrors = {};

    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (!category.trim()) nextErrors.category = "Category is required.";
    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      nextErrors.level = "Select a valid level.";
    }
    if (!estimatedDuration || Number(estimatedDuration) < 1) {
      nextErrors.estimatedDuration =
        "Estimated duration must be at least 1.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getCoursePayload = () => ({
    title: title.trim(),
    description: description.trim(),
    objectives: objectives
      .split("\n")
      .map((objective) => objective.trim())
      .filter((objective) => objective !== ""),
    level,
    category: category.trim(),
    estimatedDuration: Number(estimatedDuration),
  });

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (courseLoading || !validateCourse()) return;

    setCourseLoading(true);
    setCourseSuccess("");
    setCourseError("");

    try {
      await onCreateCourse(getCoursePayload());
      clearForm();
      setShowCreateForm(false);
      setCourseSuccess("Course created successfully.");
      await onRefreshCourses?.();
    } catch (submissionError) {
      if (submissionError.status === 400) {
        setCourseError("Please check the entered course information.");
      } else if (submissionError.status === 409) {
        setCourseError("This course conflicts with existing course data.");
      } else {
        setCourseError(submissionError.message || "Unable to create the course.");
      }
    } finally {
      setCourseLoading(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (courseLoading || !editingCourseId || !validateCourse()) return;

    setCourseLoading(true);
    setCourseSuccess("");
    setCourseError("");

    try {
      await onUpdateCourse(editingCourseId, getCoursePayload());
      setShowEditForm(false);
      setCourseSuccess("Course updated successfully.");
      await onRefreshCourses?.();
    } catch (submissionError) {
      if (submissionError.status === 400) {
        setCourseError("Please check the entered course information.");
      } else if (submissionError.status === 404) {
        setCourseError("This course no longer exists.");
      } else if (submissionError.status === 409) {
        setCourseError("This course conflicts with existing course data.");
      } else {
        setCourseError(submissionError.message || "Unable to update the course.");
      }
    } finally {
      setCourseLoading(false);
    }
  };

  const handleStatusChange = async (course, status) => {
    if (courseLoading) return;

    const action =
      status === "archived"
        ? "archive"
        : status === "draft"
          ? "unpublish"
          : "publish";

    if (!window.confirm(`Do you want to ${action} this course?`)) return;

    setCourseLoading(true);
    setCourseSuccess("");
    setCourseError("");

    try {
      await onUpdateCourseStatus(course.id, status);
      setCourseSuccess(
        status === "archived"
          ? "Course archived successfully."
          : status === "draft"
            ? "Course unpublished successfully."
            : "Course published successfully."
      );
      await onRefreshCourses?.();
    } catch (submissionError) {
      if (submissionError.status === 404) {
        setCourseError("This course no longer exists.");
      } else if (submissionError.status === 409) {
        setCourseError("The course status cannot be changed.");
      } else if (submissionError.status === 400) {
        setCourseError("The requested course status is invalid.");
      } else {
        setCourseError(
          submissionError.message || "Unable to change the course status."
        );
      }
    } finally {
      setCourseLoading(false);
    }
  };

  const renderCourseFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="course-title">Title</label>
        <input
          id="course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {fieldErrors.title && (
          <p className="field-error">{fieldErrors.title}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {fieldErrors.description && (
          <p className="field-error">{fieldErrors.description}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="course-objectives">Objectives (one per line)</label>
        <textarea
          id="course-objectives"
          value={objectives}
          onChange={(event) => setObjectives(event.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="course-category">Category</label>
        <input
          id="course-category"
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        {fieldErrors.category && (
          <p className="field-error">{fieldErrors.category}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="course-level">Level</label>
        <select
          id="course-level"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        {fieldErrors.level && (
          <p className="field-error">{fieldErrors.level}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="course-duration">Estimated duration (minutes)</label>
        <input
          id="course-duration"
          type="number"
          min="1"
          value={estimatedDuration}
          onChange={(event) => setEstimatedDuration(event.target.value)}
        />
        {fieldErrors.estimatedDuration && (
          <p className="field-error">
            {fieldErrors.estimatedDuration}
          </p>
        )}
      </div>
    </>
  );

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
          {canManageCourses && (
            <Button variant="secondary" onClick={openCreateForm}>
              {showCreateForm ? "Close Create Form" : "Add Course"}
            </Button>
          )}
        </div>
      </header>

      <ErrorMessage message={error} />
      {courseSuccess && (
        <p className="success-message" role="status">
          {courseSuccess}
        </p>
      )}
      {courseError && (
        <p className="error-message" role="alert">
          {courseError}
        </p>
      )}

      {showCreateForm && (
        <form className="course-form" onSubmit={handleCreateSubmit}>
          <h2>Create Course</h2>
          {renderCourseFields()}
          <div className="course-form-actions">
            <Button type="submit" disabled={courseLoading}>
              {courseLoading ? "Creating..." : "Create Course"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={cancelCreateForm}
              disabled={courseLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showEditForm && (
        <form className="course-form" onSubmit={handleEditSubmit}>
          <h2>Edit Course</h2>
          {renderCourseFields()}
          <div className="course-form-actions">
            <Button type="submit" disabled={courseLoading}>
              {courseLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditForm(false)}
              disabled={courseLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

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
            <div className="courses-content">
              <div className="courses-list">
                {filteredCourses.map((course) => (
                  <article className="course-card" key={course.id}>
                    <div>
                      <h2>{course.title}</h2>
                      <p>{course.description}</p>
                      <p>
                        Category: {course.category} | Level: {course.level}
                      </p>
                      <span>{getCourseStatus(course)}</span>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => openCourseDetails(course)}
                    >
                      View Details
                    </Button>
                    {canManageCourses && (
                      <div className="course-card-actions">
                        <Button
                          variant="secondary"
                          onClick={() => openEditForm(course)}
                          disabled={courseLoading}
                        >
                          Edit
                        </Button>
                        {getCourseStatus(course) === "published" && (
                          <Button
                            variant="secondary"
                            onClick={() => handleStatusChange(course, "draft")}
                            disabled={courseLoading}
                          >
                            Unpublish
                          </Button>
                        )}
                        {getCourseStatus(course) !== "archived" && (
                          <Button
                            variant="secondary"
                            onClick={() => handleStatusChange(course, "archived")}
                            disabled={courseLoading}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {selectedCourse && (
                <aside className="course-details-panel" aria-live="polite">
                  <div className="course-details-header">
                    <h2>Course Details</h2>
                    <Button
                      variant="secondary"
                      onClick={closeCourseDetails}
                    >
                      Close
                    </Button>
                  </div>

                  <dl>
                    <div>
                      <dt>Title</dt>
                      <dd>{selectedCourse.title}</dd>
                    </div>
                    <div>
                      <dt>Description</dt>
                      <dd>{selectedCourse.description}</dd>
                    </div>
                    <div>
                      <dt>Objectives</dt>
                      <dd>
                        {Array.isArray(selectedCourse.objectives) &&
                        selectedCourse.objectives.length > 0
                          ? selectedCourse.objectives.join(", ")
                          : "No objectives provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Category</dt>
                      <dd>{selectedCourse.category}</dd>
                    </div>
                    <div>
                      <dt>Level</dt>
                      <dd>{selectedCourse.level}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>
                        {selectedCourse.estimatedDuration
                          ? `${selectedCourse.estimatedDuration} minutes`
                          : "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{getCourseStatus(selectedCourse)}</dd>
                    </div>
                  </dl>
                </aside>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Courses;
