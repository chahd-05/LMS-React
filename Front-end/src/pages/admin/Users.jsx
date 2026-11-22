
import { useState } from "react";

import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Users({
  users = [],
  loading = false,
  error = "",
  onRefreshUsers,
  onCreateUser,
  onUpdateUser,
  onUpdateUserStatus,
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("learner");
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");
  const [statusError, setStatusError] = useState("");

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesRole && matchesStatus;
  });

  const selectedUser = users.find(
    (user) => String(user.id) === selectedUserId
  );

  const resetFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    if (createLoading) {
      return;
    }

    const nextErrors = {};

    if (createName.trim().length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    }

    if (!createEmail.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createEmail.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (createPassword.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    setCreateFieldErrors(nextErrors);
    setCreateSuccess("");
    setCreateError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCreateLoading(true);

    try {
      await onCreateUser({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        password: createPassword,
      });

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateSuccess("User created successfully.");

      try {
        await onRefreshUsers();
      } catch {
        setCreateError(
          "User created successfully, but the users list could not be refreshed."
        );
      }
    } catch (submissionError) {
      if (submissionError.status === 400) {
        setCreateError("Please check the entered user information.");
      } else if (submissionError.status === 409) {
        setCreateError("A user with this email already exists.");
      } else {
        setCreateError(
          submissionError.message || "Unable to create the user."
        );
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditForm = () => {
    if (!selectedUser) {
      return;
    }

    setEditName(selectedUser.name);
    setEditEmail(selectedUser.email);
    setEditRole(selectedUser.role);
    setEditFieldErrors({});
    setEditSuccess("");
    setEditError("");
    setShowEditForm(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (editLoading || !selectedUser) {
      return;
    }

    const nextErrors = {};

    if (editName.trim().length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    }

    if (!editEmail.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!["learner", "trainer", "admin"].includes(editRole)) {
      nextErrors.role = "Select a valid role.";
    }

    setEditFieldErrors(nextErrors);
    setEditSuccess("");
    setEditError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setEditLoading(true);

    try {
      await onUpdateUser(selectedUser.id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
      });

      setEditSuccess("User updated successfully.");
      setShowEditForm(false);

      try {
        await onRefreshUsers();
      } catch {
        setEditError(
          "User updated successfully, but the users list could not be refreshed."
        );
      }
    } catch (submissionError) {
      if (submissionError.status === 400) {
        setEditError("Please check the entered user information.");
      } else if (submissionError.status === 409) {
        setEditError("A user with this email already exists.");
      } else if (submissionError.status === 404) {
        setEditError("This user no longer exists.");
      } else {
        setEditError(
          submissionError.message || "Unable to update the user."
        );
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedUser || statusLoading) {
      return;
    }

    const nextStatus =
      selectedUser.status === "active" ? "suspended" : "active";
    const action = nextStatus === "active" ? "activate" : "suspend";

    if (!window.confirm(`Do you want to ${action} this user?`)) {
      return;
    }

    setStatusLoading(true);
    setStatusSuccess("");
    setStatusError("");

    try {
      await onUpdateUserStatus(selectedUser.id, nextStatus);
      setStatusSuccess(
        nextStatus === "active"
          ? "User activated successfully."
          : "User suspended successfully."
      );
      try {
        await onRefreshUsers();
      } catch {
        setStatusError(
          "Status changed successfully, but the users list could not be refreshed."
        );
      }
    } catch (submissionError) {
      if (submissionError.status === 400) {
        setStatusError("The requested status is invalid.");
      } else if (submissionError.status === 404) {
        setStatusError("This user no longer exists.");
      } else {
        setStatusError(
          submissionError.message || "Unable to change the user status."
        );
      }
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage learners and users on the EduLearn platform.</p>
        </div>

        <div className="page-header-actions">
          <Button
            variant="secondary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Close Create Form" : "Create User"}
          </Button>
          <Button onClick={onRefreshUsers} disabled={loading}>
            {loading ? "Loading..." : "Refresh Users"}
          </Button>
        </div>
      </header>

      <ErrorMessage message={error} />

      {loading && <Loading message="Loading users..." />}

      {showCreateForm && (
        <form className="user-create-form" onSubmit={handleCreateSubmit}>
          <h2>Create Learner</h2>

          {createSuccess && (
            <p className="success-message" role="status">
              {createSuccess}
            </p>
          )}
          {createError && (
            <p className="error-message" role="alert">
              {createError}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="create-name">Name</label>
            <input
              id="create-name"
              type="text"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
            />
            {createFieldErrors.name && (
              <p className="field-error">{createFieldErrors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="create-email">Email</label>
            <input
              id="create-email"
              type="email"
              value={createEmail}
              onChange={(event) => setCreateEmail(event.target.value)}
            />
            {createFieldErrors.email && (
              <p className="field-error">{createFieldErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="create-password">Password</label>
            <input
              id="create-password"
              type="password"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
            />
            {createFieldErrors.password && (
              <p className="field-error">{createFieldErrors.password}</p>
            )}
          </div>

          <Button type="submit" disabled={createLoading}>
            {createLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="empty-state">
          <h2>No users yet</h2>
          <p>There are currently no users to display.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="users-toolbar">
            <label className="user-filter">
              <span>Role</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="trainer">Trainer</option>
                <option value="learner">Learner</option>
              </select>
            </label>

            <label className="user-filter">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>

            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          <div className="users-content">
            <div>
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <h2>No matching users</h2>
                  <p>Try changing or resetting the filters.</p>
                </div>
              ) : (
                <div className="users-list">
                  {filteredUsers.map((user) => (
                    <article className="user-card" key={user.id}>
                      <div>
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                        <p>
                          Role: {user.role} | Status: {user.status}
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedUserId(String(user.id));
                          setShowEditForm(false);
                          setEditSuccess("");
                          setEditError("");
                          setStatusSuccess("");
                          setStatusError("");
                        }}
                      >
                        View Details
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="user-details-panel" aria-live="polite">
              <h2>User Details</h2>
              {selectedUser ? (
                <>
                  <dl>
                    <div>
                      <dt>Name</dt>
                      <dd>{selectedUser.name}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selectedUser.email}</dd>
                    </div>
                    <div>
                      <dt>Role</dt>
                      <dd>{selectedUser.role}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedUser.status}</dd>
                    </div>
                  </dl>

                  {statusSuccess && (
                    <p className="success-message" role="status">
                      {statusSuccess}
                    </p>
                  )}
                  {statusError && (
                    <p className="error-message" role="alert">
                      {statusError}
                    </p>
                  )}

                  <div className="user-details-actions">
                    <Button
                      variant="secondary"
                      onClick={openEditForm}
                      disabled={showEditForm}
                    >
                      Edit User
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleStatusChange}
                      disabled={statusLoading}
                    >
                      {statusLoading
                        ? "Updating..."
                        : selectedUser.status === "active"
                          ? "Suspend User"
                          : "Activate User"}
                    </Button>
                  </div>

                  {showEditForm && (
                    <form className="user-edit-form" onSubmit={handleEditSubmit}>
                      <h3>Edit User</h3>

                      {editSuccess && (
                        <p className="success-message" role="status">
                          {editSuccess}
                        </p>
                      )}
                      {editError && (
                        <p className="error-message" role="alert">
                          {editError}
                        </p>
                      )}

                      <div className="form-group">
                        <label htmlFor="edit-name">Name</label>
                        <input
                          id="edit-name"
                          type="text"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                        />
                        {editFieldErrors.name && (
                          <p className="field-error">{editFieldErrors.name}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-email">Email</label>
                        <input
                          id="edit-email"
                          type="email"
                          value={editEmail}
                          onChange={(event) => setEditEmail(event.target.value)}
                        />
                        {editFieldErrors.email && (
                          <p className="field-error">{editFieldErrors.email}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-role">Role</label>
                        <select
                          id="edit-role"
                          value={editRole}
                          onChange={(event) => setEditRole(event.target.value)}
                        >
                          <option value="learner">Learner</option>
                          <option value="trainer">Trainer</option>
                          <option value="admin">Admin</option>
                        </select>
                        {editFieldErrors.role && (
                          <p className="field-error">{editFieldErrors.role}</p>
                        )}
                      </div>

                      <div className="user-details-actions">
                        <Button type="submit" disabled={editLoading}>
                          {editLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowEditForm(false)}
                          disabled={editLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <p>Select a user to see their details.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

export default Users;
