
import { useState } from "react";

import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Users({
  users = [],
  loading = false,
  error = "",
  onRefreshUsers,
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);

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

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage learners and users on the EduLearn platform.</p>
        </div>

        <Button onClick={onRefreshUsers} disabled={loading}>
          {loading ? "Loading..." : "Refresh Users"}
        </Button>
      </header>

      <ErrorMessage message={error} />

      {loading && <Loading message="Loading users..." />}

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
                        onClick={() => setSelectedUserId(String(user.id))}
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
