
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Users({
  users = [],
  loading = false,
  error = "",
  onRefreshUsers,
  onSelectUser,
}) {
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

      {users.length > 0 && (
        <div className="users-list">
          {users.map((user) => (
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
                onClick={() => onSelectUser?.(user)}
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

export default Users;
