function AdminLayout({ children, onLogout }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>EduLearn — Administration</h1>

        <button type="button" onClick={onLogout}>
          Déconnexion
        </button>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;