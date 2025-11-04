import { useContext } from "react";
import { Navigate } from "react-router";
import { RoleContext } from "../App";
import Layout from "../Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const roleContext = useContext(RoleContext);
  const token = localStorage.getItem("token");

  if (!token || !roleContext?.isLoggedIn) {
    return <Navigate to="/" replace />;
  }

   return <Layout>{children}</Layout>;
}