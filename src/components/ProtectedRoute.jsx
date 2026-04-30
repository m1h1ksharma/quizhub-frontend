import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 1. Agar token nahi hai, toh login par bhej do
  if (!token) {
    return <Navigate to="/login" />;
  }

  // 2. Agar role match nahi karta, toh access block kar do
  // Note: Yahan role case-sensitive ho sakta hai (e.g., ADMIN vs admin)
  if (allowedRole && role !== allowedRole) {
    console.error("Access Denied: Role mismatch");
    return <Navigate to="/login" />;
  }

  // 3. Sab sahi hai toh component dikhao
  return children;
}

export default ProtectedRoute;