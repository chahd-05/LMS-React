function TrainerLayout({ children, onLogout }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>EduLearn — Trainer</h1>

        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}

export default TrainerLayout;
