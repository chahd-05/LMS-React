
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

function Users({
  users = [],
  loading = false,
  error = "",
  onCreateUser,
  onSelectUser,
}) {
  if (loading) {
    return <Loading message="Loading users..." />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage learners and users on the EduLearn platform.</p>
        </div>

        <Button onClick={onCreateUser}>
          Add User
        </Button>
      </header>

      <ErrorMessage message={error} />

      {users.length === 0 ? (
        <div className="empty-state">
          <h2>No users yet</h2>
          <p>There are currently no users to display.</p>
        </div>
      ) : (
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
