import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHome, FaSignOutAlt } from "react-icons/fa";

function StudentResult() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.card, 
        padding: isMobile ? "40px 20px" : "50px",
        width: isMobile ? "95%" : "90%"
      }}>
        <FaCheckCircle size={isMobile ? 60 : 80} color="#22c55e" />
        <h1 style={{
          ...styles.title, 
          fontSize: isMobile ? "24px" : "30px"
        }}>Submission Successful!</h1>
        <p style={{
          ...styles.text, 
          fontSize: isMobile ? "14px" : "16px"
        }}>Your response has been recorded. Thank you for your efforts.</p>
        
        <div style={styles.infoNote}>
          <p>⚠️ <b>Note:</b> Your score is secure and will be announced after evaluation.</p>
        </div>

        <div style={{
          ...styles.btnRow, 
          flexDirection: isMobile ? "column" : "row" 
        }}>
          <button onClick={() => navigate("/student/dashboard")} style={styles.btnDashboard}>
            <FaHome /> DASHBOARD
          </button>
          <button onClick={() => {localStorage.clear(); navigate("/login");}} style={styles.btnLogout}>
            <FaSignOutAlt /> LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  card: { background: "#fff", borderRadius: "30px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.04)", maxWidth: "480px", border: "1px solid #f1f5f9" },
  title: { fontWeight: "900", color: "#1e293b", marginBottom: "15px", marginTop: "20px" },
  text: { color: "#64748b", marginBottom: "35px" },
  infoNote: { background: "#eff6ff", padding: "20px", borderRadius: "18px", color: "#1d4ed8", fontSize: "13px", marginBottom: "40px", textAlign: "left" },
  btnRow: { display: "flex", gap: "12px" },
  btnDashboard: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", borderRadius: "15px", border: "none", background: "#1e293b", color: "#fff", fontWeight: "800", cursor: "pointer", minHeight: "55px" },
  btnLogout: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", borderRadius: "15px", border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: "800", cursor: "pointer", minHeight: "55px" }
};

export default StudentResult;