import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// --- LAYOUTS & AUTH ---
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// --- PUBLIC PAGES ---
import LoginPage from "./pages/LoginPage";
import QuizPage from "./pages/QuizPage";
import ForgotPassword from "./pages/ForgotPassword"; // Dono recovery steps isi mein handle honge

// --- ADMIN PAGES ---
import Dashboard from "./pages/admin/Dashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import UploadQuestions from "./pages/admin/UploadQuestions";
import LeaderBoard from "./pages/admin/LeaderBoard";
import ManageQuestions from "./pages/admin/ManageQuestions";
import QuizSettings from "./pages/admin/QuizSettings";
import EditQuestion from "./pages/admin/EditQuestion";
import EditStudentResult from "./pages/admin/EditStudentResult";

// --- STUDENT PAGES ---
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentResult from "./pages/student/StudentResult";
import StudentLeaderboard from "./pages/student/Leaderboard";

function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />

      {/* ✅ RECOVERY ROUTES */}
      {/* Step 1: Request OTP/Link ke liye */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Step 2: Email link click karne par bacha yahan aayega */}
      <Route path="/reset-password" element={<ForgotPassword />} />

      {/* --- ADMIN PANEL (Protected) --- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="upload" element={<UploadQuestions />} />
        <Route path="leaderboard" element={<LeaderBoard />} />
        <Route path="manage" element={<ManageQuestions />} />
        <Route path="settings" element={<QuizSettings />} />

        {/* ADMIN EDIT ROUTES */}
        <Route path="edit-question/:id" element={<EditQuestion />} />
        <Route path="edit-result/:id" element={<EditStudentResult />} />
      </Route>

      {/* --- STUDENT PANEL (Protected) --- */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/leaderboard"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLeaderboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/quiz"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <QuizPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/result"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentResult />
          </ProtectedRoute>
        }
      />

      {/* --- 404 NOT FOUND --- */}
      <Route
        path="*"
        element={
          <div style={styles.errorPage}>
            <h1 style={styles.errorTitle}>404</h1>
            <h2 style={{ color: "#1e293b" }}>
              Galt raste pe aa gaye ho bhai...
            </h2>
            <p style={{ color: "#64748b" }}>Ye page exist nahi karta.</p>
            <button
              onClick={() => (window.location.href = "/")}
              style={styles.backLink}
            >
              Go Back Home
            </button>
          </div>
        }
      />
    </Routes>
  );
}

// Custom Styles for 404
const styles = {
  errorPage: {
    padding: "100px",
    textAlign: "center",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: "120px",
    color: "#cbd5e1",
    margin: 0,
    fontWeight: "900",
    lineHeight: 1,
  },
  backLink: {
    color: "#fff",
    background: "#2563eb",
    fontWeight: "800",
    border: "none",
    padding: "16px 35px",
    borderRadius: "15px",
    marginTop: "25px",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.2)",
    fontSize: "15px",
  },
};

export default App;
