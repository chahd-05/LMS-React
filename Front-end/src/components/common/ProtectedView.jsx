
import { Navigate } from "react-router-dom";

function ProtectedView({ session, allowedRoles, children }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default ProtectedView;
