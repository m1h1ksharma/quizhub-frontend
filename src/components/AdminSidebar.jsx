import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartBar, FaUpload, FaTrophy, FaSignOutAlt, FaTasks, FaCog, FaDotCircle, FaUsers, FaBars, FaTimes, FaRocket
} from "react-icons/fa";
import API from "../api/axios";

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState("Loading...");
  const [isOpen, setIsOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLiveRound = async () => {
    try {
      const res = await API.get("/admin/settings/timer");
      const currentRound = res.data.activeRound || res.data.roundName || "Not Set";
      setActiveRound(currentRound);
    } catch (err) {
      setActiveRound("Normal Quiz");
    }
  };

  useEffect(() => {
    fetchLiveRound();
    window.addEventListener("roundUpdated", fetchLiveRound);
    const interval = setInterval(fetchLiveRound, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("roundUpdated", fetchLiveRound);
    };
  }, []);

  const links = [
    { path: "/admin/dashboard", label: "Insights Dashboard", icon: <FaChartBar /> },
    { path: "/admin/students", label: "Candidate Management", icon: <FaUsers /> },
    { path: "/admin/upload", label: "Resource Upload", icon: <FaUpload /> },
    { path: "/admin/manage", label: "Content Control", icon: <FaTasks /> },
    { path: "/admin/leaderboard", label: "Global Ranking", icon: <FaTrophy /> },
    { path: "/admin/settings", label: "System Config", icon: <FaCog /> }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* --- Mobile Top Bar --- */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <div style={styles.brandGroup}>
             <h2 style={{ margin: 0, fontSize: "22px", fontWeight: '900', letterSpacing: '-1px' }}>
               Quiz<span style={{color: '#2563eb'}}>Hub</span>
             </h2>
          </div>
          <button onClick={toggleMenu} style={styles.menuIcon}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      )}

      {/* --- Main Sidebar Container --- */}
      <div style={{ 
        ...styles.sidebar, 
        left: (isMobile && !isOpen) ? "-100%" : "0",
        width: isMobile ? "280px" : "260px",
      }}>
        <div style={styles.topSection}>
          {!isMobile && (
            <div style={styles.brandGroupLarge}>
               <h2 style={styles.logo}>Quiz<span style={{color: '#2563eb'}}>Hub</span></h2>
            </div>
          )}

          {/* LIVE STATUS CARD */}
          <div className="status-card-hover" style={styles.statusCard}>
            <div style={styles.statusHeader}>
              <FaDotCircle className="blink" style={styles.statusIcon} />
              <span style={styles.statusText}>LIVE INFRASTRUCTURE</span>
            </div>
            <div style={styles.roundInfo}>
              <FaRocket size={12} color="#2563eb" />
              <strong style={styles.roundName}>
                {activeRound.replace("_", " ").toUpperCase()}
              </strong>
            </div>
          </div>

          <nav style={styles.nav}>
            {links.map((link, i) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={i}
                  to={link.path}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={isActive ? "active-sidebar-link" : "sidebar-link"}
                  style={{ ...styles.link, ...(isActive && styles.activeLink) }}
                >
                  <span style={styles.iconContainer}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={styles.bottomSection}>
          <button onClick={handleLogout} style={styles.logoutBtn} className="logout-hover">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && isMobile && <div onClick={toggleMenu} style={styles.overlay} />}

      <style>
        {`
          @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
          .blink { animation: blink 1.5s infinite; }
          
          .sidebar-link { 
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            color: #64748b !important;
          }
          .sidebar-link:hover { 
            background: #f8fafc !important; 
            color: #0f172a !important; 
            transform: translateX(5px);
          }
          
          .active-sidebar-link { 
            background: #eff6ff !important; 
            color: #2563eb !important; 
            font-weight: 700 !important;
            box-shadow: inset 4px 0 0 #2563eb;
          }

          .logout-hover { transition: 0.3s; }
          .logout-hover:hover { background-color: #fef2f2 !important; color: #dc2626 !important; }
        `}
      </style>
    </>
  );
}

const styles = {
  sidebar: { height: "100vh", background: "#ffffff", position: "fixed", top: 0, display: "flex", flexDirection: "column", boxShadow: "10px 0 30px rgba(0,0,0,0.03)", borderRight: "1px solid #f1f5f9", zIndex: 1100, transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '70px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #f1f5f9', zIndex: 1050 },
  brandGroup: { display: 'flex', alignItems: 'center' },
  brandGroupLarge: { marginBottom: '40px', paddingLeft: '10px' },
  menuIcon: { background: '#f8fafc', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#1e293b', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.1)', backdropFilter: 'blur(4px)', zIndex: 1090 },
  topSection: { padding: "35px 20px", flex: 1, overflowY: "auto" },
  bottomSection: { padding: "20px", borderTop: "1px solid #f8fafc" },
  logo: { fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: '-1.5px' },
  statusCard: { padding: "16px", borderRadius: "18px", background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: "30px" },
  statusHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: '8px' },
  statusIcon: { color: "#10b981", fontSize: "10px" },
  statusText: { fontSize: "10px", fontWeight: "800", color: "#94a3b8", letterSpacing: '0.5px' },
  roundInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  roundName: { fontSize: "13px", fontWeight: "800", color: "#1e293b" },
  nav: { display: "flex", flexDirection: "column", gap: "8px" },
  link: { padding: "14px 16px", borderRadius: "14px", textDecoration: "none", display: "flex", gap: "12px", alignItems: "center", transition: "0.3s", fontSize: "14px", fontWeight: "600" },
  iconContainer: { fontSize: '18px', display: 'flex', alignItems: 'center' },
  logoutBtn: { width: "100%", background: "#fff", border: "1px solid #f1f5f9", padding: "14px", borderRadius: "14px", color: "#ef4444", fontWeight: "700", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" },
};

export default AdminSidebar;