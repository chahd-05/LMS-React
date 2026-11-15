function LearnerLayout({ children, onLogout }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>EduLearn — Espace apprenant</h1>

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

export default LearnerLayout;