import { Outlet } from "react-router";

function LearnerLayout({ onLogout, user }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="learner-layout-title">
          <h1>EduLearn — Espace apprenant</h1>
          {user?.name && <p>{user.name}</p>}
        </div>

        <button type="button" onClick={onLogout} aria-label="Se déconnecter">
          Déconnexion
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default LearnerLayout;