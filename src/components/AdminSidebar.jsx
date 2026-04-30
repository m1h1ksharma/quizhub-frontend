import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartBar, FaUsers, FaUpload, FaTasks, FaTrophy, FaCog,
  FaSignOutAlt, FaDotCircle, FaBars, FaTimes, FaRocket
} from "react-icons/fa";
import API from "../api/axios";

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState("Loading...");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // 1. Mobile Responsiveness Handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Fetch Live Round from Backend
  const fetchLiveRound = async () => {
    try {
      const res = await API.get("/admin/settings/timer");
      // Backend mapping match: activeRound
      setActiveRound(res.data.activeRound || "Normal Quiz");
    } catch (err) {
      console.error("Sidebar Sync Error:", err);
      setActiveRound("Offline");
    }
  };

  useEffect(() => {
    fetchLiveRound();
    // Signal from QuizSettings to update immediately
    window.addEventListener("roundUpdated", fetchLiveRound);
    
    // Auto-sync every 15 seconds
    const interval = setInterval(fetchLiveRound, 15000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("roundUpdated", fetchLiveRound);
    };
  }, []);

  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FaChartBar /> },
    { path: "/admin/students", label: "Students", icon: <FaUsers /> },
    { path: "/admin/upload", label: "Upload Questions", icon: <FaUpload /> },
    { path: "/admin/manage", label: "Manage Content", icon: <FaTasks /> },
    { path: "/admin/leaderboard", label: "Leaderboard", icon: <FaTrophy /> },
    { path: "/admin/settings", label: "System Settings", icon: <FaCog /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Header Toggle */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <h2 style={styles.logoText}>Quiz<span style={{ color: '#2563eb' }}>Hub</span></h2>
          <button onClick={() => setIsOpen(!isOpen)} style={styles.menuBtn}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      )}

      {/* Sidebar Main */}
      <div style={{ ...styles.sidebar, left: (isMobile && !isOpen) ? "-280px" : "0" }}>
        <div style={styles.topSection}>
          {!isMobile && <h2 style={styles.logoText}>Quiz<span style={{ color: '#2563eb' }}>Hub</span></h2>}

          {/* Live Status Card */}
          <div style={styles.statusCard}>
            <div style={styles.statusHeader}>
              <FaDotCircle className="blink-icon" style={styles.liveIcon} />
              <span style={styles.statusLabel}>LIVE INFRASTRUCTURE</span>
            </div>
            <div style={styles.roundBox}>
              <FaRocket size={12} color="#2563eb" />
              <span style={styles.roundName}>{activeRound.toUpperCase()}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={styles.nav}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ 
                    ...styles.navLink, 
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#64748b",
                    fontWeight: isActive ? "700" : "500",
                    borderLeft: isActive ? "4px solid #2563eb" : "4px solid transparent"
                  }}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div style={styles.bottomSection}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt /> Logout Session
          </button>
        </div>
      </div>

      {/* Background Overlay for Mobile */}
      {isMobile && isOpen && <div style={styles.overlay} onClick={() => setIsOpen(false)} />}

      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .blink-icon { animation: blink 1.5s infinite; }
      `}</style>
    </>
  );
}

const styles = {
  sidebar: { width: "260px", height: "100vh", background: "#fff", borderRight: "1px solid #f1f5f9", position: "fixed", top: 0, display: "flex", flexDirection: "column", zIndex: 1100, transition: "0.3s ease" },
  mobileHeader: { position: "fixed", top: 0, width: "100%", height: "60px", background: "#fff", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 1050, boxSizing: "border-box" },
  logoText: { fontSize: "24px", fontWeight: "900", color: "#1e293b", letterSpacing: "-1px" },
  menuBtn: { background: "none", border: "none", fontSize: "24px", color: "#64748b", cursor: "pointer" },
  topSection: { padding: "30px 20px", flex: 1 },
  statusCard: { background: "#f8fafc", padding: "15px", borderRadius: "16px", marginBottom: "25px", border: "1px solid #f1f5f9" },
  statusHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" },
  liveIcon: { color: "#10b981", fontSize: "10px" },
  statusLabel: { fontSize: "10px", fontWeight: "800", color: "#94a3b8", letterSpacing: "1px" },
  roundBox: { display: "flex", alignItems: "center", gap: "8px" },
  roundName: { fontSize: "13px", fontWeight: "700", color: "#1e293b" },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navLink: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 15px", borderRadius: "0 12px 12px 0", textDecoration: "none", fontSize: "14px", transition: "0.2s" },
  bottomSection: { padding: "20px", borderTop: "1px solid #f1f5f9" },
  logoutBtn: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", transition: "0.2s" },
  overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.3)", zIndex: 1000 }
};

export default AdminSidebar;