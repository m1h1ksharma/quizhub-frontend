import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
// 🔥 1. SweetAlert2 Import kiya
import Swal from "sweetalert2"; 
import {
  FaUsers,
  FaQuestionCircle,
  FaTrophy,
  FaLayerGroup,
  FaPlus,
  FaSync,
  FaChartLine,
  FaClock,
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LoadingLoader from "../../components/LoadingLoader";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalRounds: 0,
    topScore: 0,
  });

  const [submissions, setSubmissions] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/dashboard/stats");

      setStats({
        totalUsers: res.data.totalUsers,
        totalQuestions: res.data.totalQuestions,
        totalRounds: res.data.totalRounds,
        topScore: res.data.topScore,
      });

      setSubmissions(res.data.recentSubmissions || []);
      setGraphData(res.data.graphData || []);
      setLoading(false);
    } catch (err) {
      console.error("Sync failed", err);
      setLoading(false);
      
      // 🔥 2. Window Alert ki jagah Professional Toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'error',
        title: 'Sync Failed! Checking server...'
      });
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return <LoadingLoader message="Syncing Live Data..." type="scan" />;

  return (
    <div
      style={{
        ...styles.container,
        padding: isMobile ? "16px" : "38px",
      }}
    >
      {/* BACKGROUND */}
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      <div style={styles.meshThree}></div>

      {/* HEADER */}
      <div
        style={{
          ...styles.header,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: "18px",
        }}
      >
        <div style={{ zIndex: 2 }}>
          <h1
            style={{
              ...styles.mainTitle,
              fontSize: isMobile ? "28px" : "38px",
            }}
          >
            QuizHub <span style={{ color: "#2563eb" }}>Insights</span>
          </h1>

          <div style={styles.statusBadge}>
            <div className="pulse-dot"></div>
            Live Monitoring Active
          </div>
        </div>

        <div
          style={{
            ...styles.headerActions,
            width: isMobile ? "100%" : "auto",
          }}
        >
          <button
            onClick={fetchStats}
            className="btn-secondary"
            style={{
              ...styles.secondaryBtn,
              width: isMobile ? "50%" : "auto",
            }}
          >
            <FaSync />
            Refresh
          </button>
          <button
            onClick={() => navigate("/admin/upload")}
            className="btn-primary"
            style={{
              ...styles.primaryBtn,
              width: isMobile ? "50%" : "auto",
            }}
          >
            <FaPlus />
            New Round
          </button>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          ...styles.statsGrid,
          gridTemplateColumns: isMobile
            ? "repeat(2,1fr)"
            : "repeat(4,1fr)",
        }}
      >
        {[
          { label: "Active Students", val: stats.totalUsers, icon: <FaUsers />, color: "#3b82f6" },
          { label: "Questions", val: stats.totalQuestions, icon: <FaQuestionCircle />, color: "#8b5cf6" },
          { label: "Rounds", val: stats.totalRounds, icon: <FaLayerGroup />, color: "#10b981" },
          { label: "High Score", val: stats.topScore, icon: <FaTrophy />, color: "#f59e0b" },
        ].map((item, i) => (
          <div key={i} className="hover-card" style={styles.statCard}>
            <div
              style={{
                ...styles.iconWrap,
                background: item.color + "15",
                color: item.color,
              }}
            >
              {item.icon}
            </div>
            <p style={styles.statLabel}>{item.label}</p>
            <h2 style={styles.statValue}>{item.val}</h2>
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div
        style={{
          ...styles.mainGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1.8fr 1fr",
        }}
      >
        {/* GRAPH */}
        <div style={styles.mainCard}>
          <div style={styles.cardTop}>
            <h3 style={styles.cardTitle}>
              <FaChartLine />
              Performance Curve
            </h3>
          </div>

          <div style={{ height: isMobile ? 260 : 340, marginTop: "18px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={styles.tooltip} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fill="url(#blueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FEED */}
        <div style={styles.mainCard}>
          <div style={styles.cardTop}>
            <h3 style={styles.cardTitle}>
              <FaClock />
              Recent Activity
            </h3>
          </div>

          <div style={styles.feedList}>
            {submissions.length > 0 ? (
              submissions.slice(0, 5).map((sub, i) => (
                <div key={i} className="feed-item" style={styles.feedItem}>
                  <div style={styles.feedAvatar}>
                    {sub.studentName?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.feedRow}>
                      <span style={styles.studentName}>{sub.studentName}</span>
                      <span style={styles.scorePill}>{sub.score}/{sub.quizLimit || sub.totalQuestions}</span>
                    </div>
                    <p style={styles.feedMeta}>
                      {sub.quizRound} • {new Date(sub.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyBox}>No recent submissions</div>
            )}
          </div>

          <button onClick={() => navigate("/admin/students")} className="footer-btn" style={styles.footerBtn}>
            Analyze All Records
          </button>
        </div>
      </div>

      <style>{`
        .hover-card{ transition:all .28s ease; }
        .hover-card:hover{ transform:translateY(-6px); border-color:#2563eb; box-shadow:0 22px 40px rgba(37,99,235,.10); }
        .btn-primary:hover{ transform:translateY(-2px); box-shadow:0 16px 28px rgba(37,99,235,.25); }
        .btn-secondary:hover, .footer-btn:hover{ background:#f1f5f9 !important; }
        .feed-item:hover{ background:#f8fafc; transform:translateX(4px); }
        .pulse-dot{ width:8px; height:8px; border-radius:50%; background:#10b981; margin-right:8px; animation:pulse 1.8s infinite; }
        @keyframes pulse{ 0%{transform:scale(.9);opacity:1;} 70%{transform:scale(1.5);opacity:.25;} 100%{transform:scale(.9);opacity:1;} }
        ::-webkit-scrollbar{ width:6px; }
        ::-webkit-scrollbar-thumb{ background:#dbeafe; border-radius:20px; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eef4ff 50%,#f8fafc 100%)", position: "relative", overflow: "hidden" },
  meshOne: { position: "absolute", top: "-120px", right: "-100px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.12), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-120px", left: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.10), transparent 70%)" },
  meshThree: { position: "absolute", top: "35%", left: "45%", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.06), transparent 70%)", transform: "translate(-50%, -50%)" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "30px", padding: "24px", borderRadius: "28px", background: "rgba(255,255,255,.78)", border: "1px solid rgba(255,255,255,.7)", backdropFilter: "blur(18px)", boxShadow: "0 18px 40px rgba(15,23,42,.05)", position: "relative", zIndex: 2 },
  mainTitle: { margin: 0, fontWeight: "900", color: "#0f172a", letterSpacing: "-1px", lineHeight: 1.1 },
  statusBadge: { marginTop: "12px", display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "999px", background: "#ffffff", color: "#64748b", fontWeight: "700", fontSize: "12px", boxShadow: "0 10px 22px rgba(15,23,42,.04)" },
  headerActions: { display: "flex", gap: "12px" },
  primaryBtn: { border: "none", background: "#2563eb", color: "#fff", padding: "12px 20px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  secondaryBtn: { border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", padding: "12px 20px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  statsGrid: { display: "grid", gap: "18px", marginBottom: "28px", position: "relative", zIndex: 2 },
  statCard: { background: "rgba(255,255,255,.88)", border: "1px solid #eef2f7", borderRadius: "24px", padding: "24px", minHeight: "170px", boxShadow: "0 14px 28px rgba(15,23,42,.04)" },
  iconWrap: { width: "50px", height: "50px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "16px" },
  statLabel: { margin: 0, fontSize: "13px", color: "#64748b", fontWeight: "700" },
  statValue: { margin: "8px 0 0 0", fontSize: "32px", fontWeight: "900", color: "#0f172a" },
  mainGrid: { display: "grid", gap: "22px", position: "relative", zIndex: 2 },
  mainCard: { background: "rgba(255,255,255,.88)", border: "1px solid #eef2f7", borderRadius: "30px", padding: "28px", boxShadow: "0 18px 38px rgba(15,23,42,.05)", backdropFilter: "blur(14px)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" },
  tooltip: { borderRadius: "16px", border: "none", boxShadow: "0 18px 28px rgba(0,0,0,.10)", padding: "10px" },
  feedList: { marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "330px", overflowY: "auto" },
  feedItem: { display: "flex", gap: "12px", padding: "12px", borderRadius: "16px", border: "1px solid #f1f5f9" },
  feedAvatar: { width: "42px", height: "42px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  feedRow: { display: "flex", justifyContent: "space-between", gap: "10px" },
  studentName: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  scorePill: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "800" },
  feedMeta: { margin: "6px 0 0 0", fontSize: "11px", color: "#94a3b8", fontWeight: "700" },
  emptyBox: { padding: "24px", textAlign: "center", borderRadius: "18px", background: "#f8fafc", color: "#94a3b8", fontWeight: "700" },
  footerBtn: { width: "100%", marginTop: "18px", border: "none", background: "#f8fafc", color: "#2563eb", padding: "14px", borderRadius: "16px", fontWeight: "800", cursor: "pointer" },
};

export default Dashboard;