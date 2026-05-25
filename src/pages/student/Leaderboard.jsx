import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaTrophy, FaArrowLeft, FaCrown, FaUserGraduate, FaFire, FaMedal } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoadingLoader from "../../components/LoadingLoader";

const Leaderboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoundName, setActiveRoundName] = useState("Assessment");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // 1. Pehle current status se active round ka naam pata karo
        const statusRes = await API.get("/student/check-status");
        const liveRound = statusRes.data.quizRound || statusRes.data.round || "Assessment Round";
        setActiveRoundName(liveRound.replace("_", " ").toUpperCase());

        // 2. 🔥 SECURE FILTERED ENDPOINT: Ab bacho ke liye strictly live data load karo
        const res = await API.get("/student/leaderboard/active");
        setResults(res.data || []);
      } catch (err) {
        console.error("Leaderboard security fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <LoadingLoader message="Accessing Hall of Fame..." />;

  const topThree = results.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.glowOverlay}></div>

      {/* --- PREMIER BACK BUTTON --- */}
      <button onClick={() => navigate(-1)} className="back-btn-premium">
        <FaArrowLeft /> <span>Return to Base</span>
      </button>

      <div style={styles.contentWrapper} className="fade-in">
        <div style={styles.headerSection}>
          <h1 style={styles.title}>Global <span style={{ color: "#2563eb" }}>Leaderboard</span></h1>
          <p style={styles.subtitle}>
            <FaFire color="#ef4444" /> Real-time rankings for <b>{activeRoundName}</b>
          </p>
        </div>

        {/* --- DYNAMIC PODIUM SECTION --- */}
        {results.length > 0 && (
          <div style={styles.podiumContainer}>
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="podium-card silver fade-in-up" style={{ animationDelay: '0.2s' }}>
                <FaMedal className="medal-icon" color="#94a3b8" />
                <div className="podium-avatar">{topThree[1].studentName?.[0]}</div>
                <p className="podium-name">{topThree[1].studentName}</p>
                <span className="podium-score">{topThree[1].score} Pts</span>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="podium-card gold fade-in-up">
                <FaCrown className="crown-icon" />
                <div className="podium-avatar main">{topThree[0].studentName?.[0]}</div>
                <p className="podium-name main">{topThree[0].studentName}</p>
                <span className="podium-score main">{topThree[0].score} Pts</span>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="podium-card bronze fade-in-up" style={{ animationDelay: '0.4s' }}>
                <FaMedal className="medal-icon" color="#cd7f32" />
                <div className="podium-avatar">{topThree[2].studentName?.[0]}</div>
                <p className="podium-name">{topThree[2].studentName}</p>
                <span className="podium-score">{topThree[2].score} Pts</span>
              </div>
            )}
          </div>
        )}

        {/* --- DETAILED RANKINGS TABLE --- */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? results.map((res, index) => (
                <tr key={index} className="premium-row">
                  <td style={styles.td}>
                    <div className={`rank-badge rank-${index + 1}`}>
                       {index < 3 ? <FaTrophy size={14} /> : index + 1}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                       <div className="avatar-mini">{res.studentName?.[0]?.toUpperCase() || <FaUserGraduate />}</div>
                       <span style={{fontWeight: '700'}}>{res.studentName}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span className="status-pill">Verified</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.scoreBox}>
                       <span className="big-score">{res.score}</span>
                       <span className="small-total">/ {res.totalQuestions || 5}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="no-data">No candidate submissions recorded in this live round yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.8s ease-out; }
        .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .back-btn-premium {
          position: fixed; top: 30px; left: 40px; background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px); border: 1px solid #e2e8f0; padding: 12px 25px;
          border-radius: 100px; cursor: pointer; z-index: 100; font-weight: 800;
          display: flex; align-items: center; gap: 10px; transition: 0.3s; color: #1e293b;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .back-btn-premium:hover { background: #0f172a; color: #fff; transform: scale(1.05); }

        .podium-card { background: #fff; padding: 25px; border-radius: 25px; display: flex; flex-direction: column; align-items: center; width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; position: relative; }
        .gold { border: 2px solid #fbbf24; transform: translateY(-20px); }
        .silver { border: 1px solid #cbd5e1; }
        .bronze { border: 1px solid #fed7aa; }
        .podium-avatar { width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #334155; margin-bottom: 10px; }
        .podium-avatar.main { width: 80px; height: 80px; background: #fef3c7; color: #d97706; font-size: 32px; border: 4px solid #fff; box-shadow: 0 10px 20px rgba(245,158,11,0.15); }
        .podium-name { font-weight: 700; color: #64748b; font-size: 14px; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .podium-name.main { color: #1e293b; font-size: 18px; }
        .podium-score { font-weight: 900; color: #2563eb; margin-top: 5px; }

        .premium-row { transition: 0.3s; border-bottom: 1px solid #f8fafc; }
        .premium-row:hover { background: #fff; transform: scale(1.01) translateX(10px); box-shadow: 0 10px 20px rgba(0,0,0,0.01); }
        
        .rank-badge { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; }
        .rank-1 { background: #fef3c7; color: #d97706; }
        .rank-2 { background: #f1f5f9; color: #64748b; }
        .rank-3 { background: #fff7ed; color: #c2410c; }
        
        .avatar-mini { width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
        .status-pill { background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        
        .scoreBox { display: flex; align-items: baseline; gap: 3px; }
        .big-score { font-weight: 900; color: #1e293b; font-size: 18px; }
        .small-total { color: #94a3b8; font-size: 13px; font-weight: 700; }
        
        .crown-icon { position: absolute; top: -25px; font-size: 40px; color: #fbbf24; filter: drop-shadow(0 5px 10px rgba(251, 191, 36, 0.4)); }
        .medal-icon { margin-bottom: 10px; font-size: 24px; }
        .no-data { text-align: center; padding: 40px; color: #94a3b8; font-weight: 700; }
      `}</style>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", padding: "60px 20px", position: "relative" },
  glowOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: "500px", background: "radial-gradient(circle at 50% -100px, rgba(37,99,235,0.08), transparent)", zIndex: 0 },
  contentWrapper: { position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto" },
  headerSection: { textAlign: "center", marginBottom: "60px" },
  title: { fontSize: "48px", fontWeight: "950", margin: 0, letterSpacing: "-2px", color: "#0f172a" },
  subtitle: { color: "#64748b", fontSize: "18px", marginTop: "10px", fontWeight: "600", display: "flex", alignItems: "center", justifycontent: "center", gap: "10px" },
  podiumContainer: { display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "25px", marginBottom: "60px" },
  tableCard: { background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)", borderRadius: "35px", padding: "20px", border: "1px solid #fff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "20px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "900", letterSpacing: "1px" },
  td: { padding: "20px", verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: "15px" }
};

export default Leaderboard;