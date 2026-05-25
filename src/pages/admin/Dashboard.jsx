import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaUsers, FaQuestionCircle, FaTrophy, FaLayerGroup, FaPlus,
  FaSync, FaChartLine, FaClock, FaShieldAlt, FaCircle
} from "react-icons/fa";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import LoadingLoader from "../../components/LoadingLoader";

function Dashboard() {
  const navigate = useNavigate();
  
  // States - High Concurrency Stats
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalQuestions: 0, 
    totalRounds: 0, 
    topScore: 0,
    activeStudents: 0 
  });
  const [settings, setSettings] = useState({ roundName: "", showResult: false });
  const [submissions, setSubmissions] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Data Logic: Syncing Stats, Graph, and Active Round
  const fetchData = async () => {
    try {
      const res = await API.get("/admin/dashboard/stats");
      
      // Dashboard Stats
      setStats({
        totalUsers: res.data.totalUsers || 0,
        totalQuestions: res.data.totalQuestions || 0,
        totalRounds: res.data.totalRounds || 0,
        topScore: res.data.topScore || 0,
        activeStudents: res.data.activeStudents || 0
      });
      
      setSubmissions(res.data.recentSubmissions || []);
      setGraphData(res.data.graphData || []);

      // Active Configuration fetch karna (Student side active round pata karne ke liye)
      const configRes = await API.get("/admin/settings/timer");
      const currentActiveRound = configRes.data.activeRound;
      
      if (currentActiveRound) {
        const setRes = await API.get(`/admin/settings/${currentActiveRound}`);
        setSettings({
            roundName: currentActiveRound,
            showResult: setRes.data.showResult
        });
      }
    } catch (err) {
      console.error("Dashboard Sync Fail:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic: Result Toggle API Call
  const handleToggleResult = async () => {
    try {
      const newStatus = !settings.showResult;
      // Backend mapping update: /api/admin/settings/toggle-result/{roundName}?status=true
      await API.put(`/admin/settings/toggle-result/${settings.roundName}?status=${newStatus}`);
      
      setSettings(prev => ({ ...prev, showResult: newStatus }));
      
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: `Results for ${settings.roundName} are now ${newStatus ? 'LIVE' : 'HIDDEN'}`,
        showConfirmButton: false, timer: 2000
      });
    } catch (err) {
      Swal.fire('Error', 'Failed to update result status.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh stats every 30 seconds for live feel
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingLoader message="Connecting to High-Concurrency Engine..." />;

  return (
    <div style={styles.container}>
      {/* Background Mesh Glow */}
      <div style={styles.glowOverlay}></div>
      
      {/* --- HEADER --- */}
      <header style={styles.header} className="fade-in">
        <div>
          <h1 style={styles.mainTitle}>QuizHub <span style={{ color: "#2563eb" }}>Admin</span></h1>
          <div style={styles.statusBadge}>
            <div className="pulse-dot"></div> System Status: {stats.activeStudents} Students Live
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchData} className="btn-secondary"><FaSync /> Sync Data</button>
          <button onClick={() => navigate("/admin/upload")} className="btn-primary"><FaPlus /> New Assessment</button>
        </div>
      </header>

      {/* --- RESULT CONTROL PANEL --- */}
      <div style={styles.controlPanel} className="fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={styles.iconCircle}><FaShieldAlt /></div>
          <div>
            <h3 style={styles.panelHeadline}>Result Publication Switch</h3>
            <p style={styles.panelSub}>Active Round: <b>{settings.roundName || "Not Set"}</b></p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
           <span style={{ fontSize: "14px", fontWeight: "900", color: settings.showResult ? "#10b981" : "#94a3b8" }}>
             {settings.showResult ? "LIVE ON DASHBOARD" : "HIDDEN FROM STUDENTS"}
           </span>
           <label className="switch">
              <input type="checkbox" checked={settings.showResult} onChange={handleToggleResult} disabled={!settings.roundName} />
              <span className="slider round"></span>
           </label>
        </div>
      </div>

      {/* --- STATISTICS GRID --- */}
      <div style={styles.statsGrid}>
        {[
          { label: "Registered Students", val: stats.totalUsers, icon: <FaUsers />, color: "#3b82f6" },
          { label: "Question Bank", val: stats.totalQuestions, icon: <FaQuestionCircle />, color: "#8b5cf6" },
          { label: "Quiz Rounds", val: stats.totalRounds, icon: <FaLayerGroup />, color: "#10b981" },
          { label: "Highest Score", val: stats.topScore, icon: <FaTrophy />, color: "#f59e0b" }
        ].map((card, i) => (
          <div key={i} className="stat-card-premium fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ ...styles.cardIcon, background: card.color + "15", color: card.color }}>{card.icon}</div>
            <p style={styles.cardLabel}>{card.label}</p>
            <h2 style={styles.cardValue}>{card.val}</h2>
          </div>
        ))}
      </div>

      {/* --- ANALYTICS & FEED SECTION --- */}
      <div style={styles.contentGrid}>
        
        {/* Participation Curve (Graph) */}
        <div className="glass-panel analytics-box fade-in">
          <h3 style={styles.panelTitle}><FaChartLine /> Participation Curve</h3>
          <div style={{ height: 320, width: '100%', marginTop: "25px" }}>
            <ResponsiveContainer>
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={4} fill="url(#curveColor)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Submissions Feed (CSS Fixed) */}
        <div className="glass-panel feed-box fade-in">
          <h3 style={styles.panelTitle}><FaClock /> Real-time Feed</h3>
          <div className="feed-scroll-area">
            {submissions.length > 0 ? submissions.map((sub, i) => (
              <div key={i} className="feed-row-item">
                <div className="avatar-circle">{sub.studentName?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="student-name">{sub.studentName}</span>
                    <span className="score-badge">{sub.score} / {sub.totalQuestions}</span>
                  </div>
                  <div className="round-info">
                    <FaCircle size={6} color="#3b82f6" /> {sub.quizRound}
                  </div>
                </div>
              </div>
            )) : <div className="no-data">Waiting for submissions...</div>}
          </div>
        </div>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .stat-card-premium { background: #fff; padding: 30px; border-radius: 30px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.01); transition: 0.3s; }
        .stat-card-premium:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
        
        .glass-panel { background: #fff; border-radius: 35px; border: 1px solid #f1f5f9; padding: 30px; display: flex; flex-direction: column; }
        
        .btn-primary { background: #0f172a; color: #fff; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
        .btn-secondary { background: #fff; border: 1.5px solid #e2e8f0; padding: 14px 28px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; }

        .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse-anim 1.5s infinite; margin-right: 10px; }
        @keyframes pulse-anim { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

        /* Feed Styling - FIXED */
        .feed-scroll-area { 
            margin-top: 25px; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            max-height: 400px; 
            overflow-y: auto; 
            padding-right: 8px; 
        }
        .feed-scroll-area::-webkit-scrollbar { width: 5px; }
        .feed-scroll-area::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        .feed-row-item { display: flex; gap: 15px; padding: 18px; background: #f8fafc; border-radius: 20px; border: 1px solid transparent; transition: 0.2s; align-items: center; }
        .feed-row-item:hover { background: #fff; border-color: #3b82f6; transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        
        .avatar-circle { width: 45px; height: 45px; background: #eff6ff; color: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; flex-shrink: 0; }
        .student-name { font-weight: 800; color: #1e293b; font-size: 15px; }
        .score-badge { background: #fff; color: #2563eb; padding: 4px 12px; border-radius: 10px; font-size: 13px; font-weight: 900; border: 1px solid #dbeafe; }
        .round-info { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 12px; margin-top: 4px; font-weight: 700; }
        .no-data { text-align: center; margin-top: 50px; color: #94a3b8; font-weight: 800; font-style: italic; }

        /* Switch UI */
        .switch { position: relative; display: inline-block; width: 54px; height: 30px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e2e8f0; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input:checked + .slider { background-color: #2563eb; }
        input:checked + .slider:before { transform: translateX(24px); }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", padding: "40px", position: "relative", overflowX: "hidden" },
  glowOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: "450px", background: "radial-gradient(circle at 50% -100px, rgba(37,99,235,0.06), transparent)", zIndex: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", position: "relative", zIndex: 1 },
  mainTitle: { fontSize: "36px", fontWeight: "900", margin: 0, letterSpacing: "-1.5px", color: "#0f172a" },
  statusBadge: { display: "inline-flex", alignItems: "center", padding: "8px 18px", background: "#fff", borderRadius: "100px", fontSize: "13px", fontWeight: "800", border: "1px solid #f1f5f9", marginTop: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" },
  headerActions: { display: "flex", gap: "15px" },
  controlPanel: { background: "#fff", padding: "30px 45px", borderRadius: "30px", border: "1.5px solid #dbeafe", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px", position: "relative", zIndex: 1, boxShadow: "0 10px 30px rgba(37,99,235,0.05)" },
  iconCircle: { width: "55px", height: "55px", background: "#f0f7ff", color: "#2563eb", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  panelHeadline: { margin: 0, fontSize: "20px", fontWeight: "900", color: "#0f172a" },
  panelSub: { margin: 0, fontSize: "14px", color: "#64748b", marginTop: "4px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "25px", marginBottom: "40px" },
  cardIcon: { width: "60px", height: "60px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", marginBottom: "22px" },
  cardLabel: { fontSize: "15px", color: "#64748b", fontWeight: "800", margin: 0 },
  cardValue: { fontSize: "42px", fontWeight: "900", margin: "10px 0 0 0", color: "#0f172a", letterSpacing: "-1px" },
  contentGrid: { display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "30px" },
  panelTitle: { fontSize: "20px", fontWeight: "900", margin: 0, display: "flex", alignItems: "center", gap: "12px", color: "#0f172a" }
};

export default Dashboard;