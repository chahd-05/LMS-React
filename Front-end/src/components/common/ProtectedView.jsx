function ProtectedView({ session, allowedRoles, children }) {
    if(!session) {
        return <p>connexion requise</p>
    }

    if(!allowedRoles.includes(session.role)) {
        return <p role="alert">accés refusé</p>
    }

    return children;
}

export default ProtectedView;
