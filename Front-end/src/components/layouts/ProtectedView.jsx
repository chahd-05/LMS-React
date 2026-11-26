
import { Navigate, Outlet } from "react-router";

function ProtectedView({ session, allowedRoles, }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

export default ProtectedView;
