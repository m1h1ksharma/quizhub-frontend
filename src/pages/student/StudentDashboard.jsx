import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle, FaSignOutAlt, FaCheckCircle, FaRocket,
  FaMoon, FaSun, FaTrophy, FaHourglassHalf, FaExclamationCircle, FaCrown, FaTimes
} from "react-icons/fa";
import Confetti from "react-confetti"; 
import API from "../../api/axios";

function StudentDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ 
    attempted: false, 
    round: "",
    showMarks: false, 
    score: 0, 
    total: 0,
    celebrate: false 
  });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 🎯 PROFILE DRAWER STATES
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  const token = localStorage.getItem("token");
  const rawName = localStorage.getItem("userName") || "Student";
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const fetchStatus = async () => {
    if (!token) { navigate("/login"); return; }
    try {
      const res = await API.get(`/student/check-status?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      
      const isPerfectScore = data.score > 0 && data.total > 0 && data.score === data.total;

      setStatus({
        attempted: data.attempted === true,
        round: data.quizRound || "Assessment Round",
        showMarks: data.showMarks === true,
        score: data.score || 0,
        total: data.total || 0,
        celebrate: isPerfectScore 
      });

      // 🎯 DYNAMIC DATA LOADING FROM CONTROLLER
      if (data.student) {
        setStudentInfo(data.student);
      }
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); navigate("/login"); }
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate, token]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const moveGlow = (e) => {
      document.documentElement.style.setProperty("--x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", moveGlow);
    return () => window.removeEventListener("mousemove", moveGlow);
  }, []);

  if (loading) return (
    <div className={`loaderPage ${darkMode ? 'dark' : 'light'}`}>
      <div className="loaderRing"></div>
      <Styles darkMode={darkMode} />
    </div>
  );

  return (
    <div className={darkMode ? "dashboard dark" : "dashboard light"}>
      
      {/* 🎈 BACKGROUND FLOATING DYNAMIC BUBBLES */}
      <div className="bubble-wrapper">
        <div className="bubble item-1"></div>
        <div className="bubble item-2"></div>
        <div className="bubble item-3"></div>
        <div className="bubble item-4"></div>
        <div className="bubble item-5"></div>
      </div>

      {/* SOFT PASTEL CONFETTI BLAST */}
      {status.showMarks && status.celebrate && (
        <div style={styles.confettiShell}>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false} 
            numberOfPieces={400} 
            gravity={0.1} 
            colors={['#60a5fa', '#c084fc', '#f43f5e', '#fbbf24', '#34d399']} 
          />
        </div>
      )}

      <div className="bgBlob"></div>
      <div className="cursorGlow"></div>

      {/* ASSESSMENT GUIDELINES MODAL */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent bounceIn">
            <div className="modalHeader">
              <FaExclamationCircle size={50} color="#3b82f6" />
              <h2>Assessment Guidelines</h2>
            </div>
            <div className="instructionList">
              <div className="insItem">
                <span className="dot"></span>
                <p><b>Strict Monitoring:</b> Tab switching or minimizing the browser will lead to <b>immediate auto-submission</b>.</p>
              </div>
              <div className="insItem">
                <span className="dot"></span>
                <p><b>Timer:</b> The countdown starts the moment you enter. Keep track of the time on the top right.</p>
              </div>
              <div className="insItem">
                <span className="dot"></span>
                <p><b>Connectivity:</b> Ensure you have a stable internet connection. Do not refresh the page.</p>
              </div>
            </div>
            <div className="modalActions">
              <button className="cancelBtn" onClick={() => setShowModal(false)}>Go Back</button>
              <button className="confirmBtn glow-btn-active" onClick={() => navigate("/student/quiz")}>Start Now</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="logo">
            <span className="piet-text">PIET</span> <span className="quizhub-text">QUIZHUB</span>
          </h2>
          <div className="navActions">
            
            {/* 🎯 USER BADGE TRIGGERS SLIDING SIDEBAR PANEL */}
            <div className="userBadge custom-avatar-badge-shell" onClick={() => setShowProfileDrawer(true)}>
              <div className="avatar-initials-shell">
                {userInitial ? userInitial : <FaUserCircle size={14} />}
                <span className="live-status-dot-beep"></span>
              </div>
              <span className="student-name-text-navbar">{studentInfo?.studentName || userName}</span>
            </div>

            <button className="themeBtn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button className="logoutBtn" onClick={() => { localStorage.clear(); navigate("/login"); }}>
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <section className="mainWrap">
        <div className="dashboard-layout-container">
          <div className="premium-border-reveal-shell animated-glow fade-in">
            <div className="mainCard">
              {status.attempted ? (
                <div className="flex-center">
                  <div className="success-checkmark-glow"><FaCheckCircle color="white" /></div>
                  <h1 className="heroTitle" style={{ marginTop: "15px" }}>Quiz Completed</h1>
                  
                  {status.showMarks ? (
                    <div className="result-portal fade-in">
                      <div className="score-card-premium">
                        <p className="label-text">YOUR ASSESSMENT SCORE</p>
                        <div className="score-flex">
                          <span className="current-score">{status.score}</span>
                          <span className="total-score">/ {status.total}</span>
                        </div>
                        
                        <div className="progress-mini-bar">
                          <div className="fill" style={{ width: `${(status.score / (status.total || 1)) * 100}%` }}></div>
                        </div>
                        
                        <p className="accuracy-percentage-text">
                          {Math.round((status.score / (status.total || 1)) * 100)}% Accuracy Achieved
                        </p>
                      </div>
                      
                      {status.celebrate && (
                        <div className="perfect-score-ribbon-premium fade-in">
                          <FaCrown /> MAXIMUM RANKING MATRIX <FaCrown />
                        </div>
                      )}

                      <button className="leaderboard-btn-premium glow-button-super" onClick={() => navigate("/student/leaderboard")}>
                        <FaTrophy /> VIEW GLOBAL LEADERBOARD
                      </button>
                    </div>
                  ) : (
                    <div className="submission-status">
                      <p className="heroSub">
                        Great Job, {(studentInfo?.studentName || userName).split(" ")[0]}! Your response for <b>{status.round}</b> has been securely synced to our registries.
                      </p>
                      <div className="wait-badge">
                        <FaHourglassHalf /> RESULTS PENDING VALIDATION
                      </div>
                      <p className="pending-note">Scorecard and Rank standing updates will open up once announced by the main coordinator matrix.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-center">
                  <div className="liveBadge live-beep"><FaRocket /> Live Now</div>
                  <h1 className="heroTitle">{greeting}, {(studentInfo?.studentName || userName).split(" ")[0]}!</h1>
                  <p className="heroSub">Round <b>{status.round}</b> is now open. Scale your skills with the matrix!</p>
                  <button className="primaryBtn glow-button-super" onClick={() => setShowModal(true)}>
                    Start Assessment Round
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 🎯 THE RIGHT-SIDE SLIDING DYNAMIC PROFILE DRAWER */}
      {/* ===================================================================== */}
      {showProfileDrawer && (
        <>
          <div 
            className="drawer-backdrop fade-in-backdrop"
            onClick={() => setShowProfileDrawer(false)}
          />

          <div className={`drawer-panel slide-in-right ${darkMode ? 'dark' : 'light'}`}>
            <div className="drawer-header">
              <button onClick={() => setShowProfileDrawer(false)} className="close-drawer-btn">
                <FaTimes /> Close Panel
              </button>
            </div>

            <div className="profile-branding-section">
              <div className="profile-large-avatar-drawer">
                {studentInfo?.studentName?.[0]?.toUpperCase() || userInitial}
              </div>
              <h3 className="profile-name">
                {studentInfo?.studentName?.toUpperCase() || userName.toUpperCase()}
              </h3>
            </div>

            <div className="info-grid-drawer">
              <h4 className="section-title-drawer">User Profile Details</h4>
              
              <div className="info-row-premium">
                <span className="label-drawer">Full Name</span>
                <span className="value-drawer">{studentInfo?.studentName || userName}</span>
              </div>

              <div className="info-row-premium">
                <span className="label-drawer">Class / Course</span>
                <span className="value-drawer">{studentInfo?.className || "N/A"}</span>
              </div>

              <div className="info-row-premium">
                <span className="label-drawer">Father's Name</span>
                <span className="value-drawer">{studentInfo?.fatherName || "N/A"}</span>
              </div>

              <div className="info-row-premium">
                <span className="label-drawer">Email ID</span>
                <span className="value-drawer">{studentInfo?.emailId || "N/A"}</span>
              </div>
              
              <div className="info-row-premium">
                <span className="label-drawer">Phone Number</span>
                <span className="value-drawer">{studentInfo?.studentMobile || "N/A"}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <Styles darkMode={darkMode} celebrate={status.showMarks && status.celebrate}/>
    </div>
  );
}

function Styles({ darkMode, celebrate }) {
  return (
    <style>{`
      * { margin:0; padding:0; box-sizing: border-box; }
      body { font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }
      
      .dashboard { 
        min-height: 100vh; 
        position: relative; 
        z-index: 1; 
        transition: background 1.5s ease;
        animation: ambientBackgroundShift 25s infinite alternate ease-in-out;
      }
      
      @keyframes ambientBackgroundShift {
        0% { background-color: ${darkMode ? '#0b1329' : '#f8fafc'}; }
        100% { background-color: ${darkMode ? '#0f172a' : '#f1f5f9'}; }
      }

      .bgBlob::before, .bgBlob::after { content: ""; position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(120px); opacity: ${darkMode ? '0.12' : '0.14'}; z-index: -1; pointer-events: none; }
      .bgBlob::before { background: #3b82f6; top: -150px; left: -150px; }
      .bgBlob::after { background: #9333ea; bottom: 150px; right: -150px; }
      .cursorGlow { position: fixed; left: var(--x, 50%); top: var(--y, 50%); transform: translate(-50%, -50%); width: 450px; height: 450px; pointer-events: none; z-index: 0; background: radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%); }
      
      .navbar { height: 85px; width: 100%; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(25px); border-bottom: 1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}; display: flex; align-items: center; justify-content: center; }
      .nav-container { width: 100%; max-width: 1400px; padding: 0 5%; display: flex; justify-content: space-between; align-items: center; }
      .logo { font-size: 26px; font-weight: 900; letter-spacing: -1.2px; }
      .piet-text { color: #3b82f6; }
      .quizhub-text { color: ${darkMode ? '#ffffff' : '#0f172a'}; }
      .navActions { display: flex; align-items: center; gap: 15px; }
      
      .custom-avatar-badge-shell {
        gap: 12px !important;
        padding: 0 14px 0 8px !important; 
        transition: 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        cursor: pointer;
      }
      .custom-avatar-badge-shell:hover {
        background: ${darkMode ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff'} !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
      }
      .avatar-initials-shell {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #ffffff;
        font-weight: 900;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        letter-spacing: 0;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
      .live-status-dot-beep {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 9px;
        height: 9px;
        background: #10b981;
        border: 2px solid ${darkMode ? '#0f172a' : '#fff'};
        border-radius: 50%;
      }
      .student-name-text-navbar {
        max-width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .userBadge { height: 46px; padding: 0 18px; border-radius: 14px; font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 10px; background: ${darkMode ? 'rgba(255,255,255,0.04)' : '#fff'}; color: ${darkMode ? '#e2e8f0' : '#1e293b'}; border: 1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; }
      .themeBtn, .logoutBtn { width: 46px; height: 46px; border-radius: 14px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .themeBtn { background: ${darkMode ? 'rgba(255,255,255,0.08)' : '#1e293b'}; color: ${darkMode ? '#facc15' : '#fff'}; }
      .logoutBtn { background: #fee2e2; color: #ef4444; }
      
      .modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
      .modalContent { background: ${darkMode ? '#0f172a' : '#ffffff'}; width: 90%; max-width: 600px; padding: 45px; border-radius: 35px; border: 1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#eee'}; box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
      .modalHeader { margin-bottom: 30px; text-align: center; }
      .modalHeader h2 { font-size: 28px; font-weight: 900; margin-top: 15px; color: ${darkMode ? '#fff' : '#0f172a'}; }
      .instructionList { margin-bottom: 35px; }
      .insItem { display: flex; gap: 15px; align-items: flex-start; margin-bottom: 20px; padding: 15px; background: ${darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc'}; border-radius: 15px; text-align: left; }
      .dot { width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
      .insItem p { font-size: 16px; color: ${darkMode ? '#cbd5e1' : '#475569'}; line-height: 1.5; }
      .modalActions { display: flex; gap: 20px; }
      .cancelBtn, .confirmBtn { flex: 1; padding: 18px; border-radius: 15px; font-weight: 800; border: none; cursor: pointer; transition: 0.3s; font-size: 16px; }
      .cancelBtn { background: ${darkMode ? '#1e293b' : '#f1f5f9'}; color: ${darkMode ? '#94a3b8' : '#64748b'}; }
      .confirmBtn { background: #3b82f6; color: #fff; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
      
      .mainWrap { height: calc(100vh - 85px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 25px; z-index: 10; position: relative; }
      .dashboard-layout-container { width: 100%; max-width: 620px; display: flex; flex-direction: column; gap: 40px; }

      .premium-border-reveal-shell {
        position: relative;
        width: 100%;
        border-radius: 40px;
        padding: 1.5px; 
        overflow: hidden;
        z-index: 1;
        background: ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)'};
      }

      .premium-border-reveal-shell::before {
        content: "";
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
          transparent, 
          rgba(59, 130, 246, 0.6), 
          rgba(139, 92, 246, 0.6), 
          transparent 30%
        );
        animation: outlineSpinReveal 4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        z-index: -2;
      }

      .premium-border-reveal-shell::after {
        content: "";
        position: absolute;
        inset: 1.5px;
        background: ${darkMode ? '#0f172a' : '#ffffff'};
        border-radius: 39px;
        z-index: -1;
      }

      @keyframes outlineSpinReveal {
        0% { transform: rotate(0deg); opacity: 1; }
        60% { opacity: 1; }
        100% { transform: rotate(360deg); opacity: 0.12; } 
      }

      .mainCard { 
        width: 100%; 
        padding: 50px 45px; 
        border-radius: 39px; 
        background: ${darkMode ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.75)'}; 
        backdrop-filter: blur(20px); 
        text-align: center; 
        position: relative;
        z-index: 2;
        border: 1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'};
      }
      
      .animated-glow { box-shadow: 0 20px 50px rgba(59, 130, 246, ${darkMode ? '0.10' : '0.03'}); animation: pulse-border 5s infinite; }
      @keyframes pulse-border { 0%, 100% { box-shadow: 0 20px 50px rgba(59, 130, 246, ${darkMode ? '0.10' : '0.03'}); } 50% { box-shadow: 0 20px 50px rgba(139, 92, 246, ${darkMode ? '0.15' : '0.05'}); } }
      
      .heroTitle { font-size: 38px; font-weight: 900; color: ${darkMode ? '#ffffff' : '#0f172a'}; margin: 15px 0 10px; letter-spacing: -1px; }
      .heroSub { font-size: 18px; color: ${darkMode ? '#94a3b8' : '#64748b'}; margin-bottom: 25px; }
      .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
      
      .success-checkmark-glow { 
        width: 70px; height: 70px; background: #10b981; color: white; border-radius: 50%; 
        display: flex; align-items: center; justify-content: center; font-size: 32px; 
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2); margin: 0 auto; 
        animation: successGlowPulse ${celebrate ? '1.8s' : '4s'} infinite alternate ease-in-out;
      }
      
      @keyframes successGlowPulse {
        0% { box-shadow: 0 10px 25px rgba(16, 185, 129, ${celebrate ? '0.4' : '0.2'}); transform: scale(1); }
        100% { box-shadow: 0 15px 35px rgba(16, 185, 129, ${celebrate ? '0.7' : '0.4'}); transform: scale(1.02); }
      }
      
      .score-card-premium { padding: 10px 0; border-radius: 20px; display: flex; flex-direction: column; align-items: center; width: 100%; }
      .label-text { font-size: 12px; color: #94a3b8; font-weight: 900; letter-spacing: 1px; }
      .score-flex { display: flex; align-items: baseline; margin: 10px 0; }
      .current-score { font-size: 76px; font-weight: 950; color: ${darkMode ? '#f1f5f9' : '#0f172a'}; letter-spacing: -3px; line-height: 1; }
      .total-score { font-size: 24px; font-weight: 700; color: #cbd5e1; margin-left: 5px; }
      .progress-mini-bar { width: 100%; max-width: 320px; height: 8px; background: ${darkMode ? '#1e293b' : '#f1f5f9'}; border-radius: 100px; overflow: hidden; margin: 15px 0; position: relative; }
      .progress-mini-bar .fill { height: 100%; background: #2563eb; border-radius: 100px; transition: 0.5s ease; }
      .accuracy-percentage-text { font-size: 13px; color: #64748b; font-weight: 700; }
      
      .primaryBtn, .leaderboard-btn-premium, .glow-btn-active { 
        background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
        color: #fff; 
        padding: 18px 50px; 
        border-radius: 20px; 
        font-weight: 800; 
        border: none; 
        cursor: pointer; 
        transition: 0.3s ease;
        position: relative;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
        animation: absoluteButtonBreathingGlow 3s infinite alternate ease-in-out;
      }
      
      .leaderboard-btn-premium {
        border-radius: 100px !important;
        padding: 15px 40px !important;
        margin-top: 30px !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
      }

      @keyframes absoluteButtonBreathingGlow {
        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2); }
        100% { transform: scale(1.01); box-shadow: 0 6px 22px rgba(59, 130, 246, 0.4); }
      }

      .primaryBtn:hover, .leaderboard-btn-premium:hover, .glow-btn-active:hover { 
        transform: translateY(-3px) scale(1.02) !important; 
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4) !important; 
      }
      
      .wait-badge { display: inline-flex; align-items: center; gap: 8px; background: #fff7ed; color: #c2410c; font-weight: 900; padding: 8px 20px; border-radius: 100px; font-size: 12px; border: 1px solid #ffedd5; margin-bottom: 15px; }
      .pending-note { font-size: 13px; color: #94a3b8; font-weight: 600; }
      .liveBadge { background: ${darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'}; color: #3b82f6; padding: 10px 22px; border-radius: 100px; font-size: 13px; font-weight: 900; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(59, 130, 246, 0.2); }
      .live-beep { animation: beep 1.5s infinite; }
      @keyframes beep { 0% { transform: scale(1); } 50% { transform: scale(1.03); opacity: 0.9; } 100% { transform: scale(1); } }
      
      .perfect-score-ribbon-premium { margin-bottom: 15px; background: rgba(251, 191, 36, 0.10); color: #d97706; padding: 10px 25px; border-radius: 100px; font-size: 11px; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(251, 191, 36, 0.2); }

      .loaderPage { height: 100vh; display: flex; justify-content: center; align-items: center; background: ${darkMode ? '#0f172a' : '#f8fafc'}; }
      .loaderRing { width: 55px; height: 55px; border: 5px solid rgba(59,130,246,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s infinite linear; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .fade-in { animation: fadeIn 0.8s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      .bounceIn { animation: bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
      @keyframes bounceIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      /* ===================================================================== */
      /* 🎈 CSS FLOATING BACKGROUND BUBBLES SCHEMAS */
      /* ===================================================================== */
      .bubble-wrapper {
        position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none;
      }
      .bubble {
        position: absolute;
        background: ${darkMode 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(139, 92, 246, 0.02))' 
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.03))'};
        border-radius: 50%;
        animation: floatAround 25s infinite linear;
        bottom: -150px;
      }
      .item-1 { width: 100px; height: 100px; left: 7%; animation-duration: 18s; animation-delay: 0s; }
      .item-2 { width: 160px; height: 160px; left: 42%; animation-duration: 26s; animation-delay: 2s; }
      .item-3 { width: 80px; height: 80px; left: 78%; animation-duration: 14s; animation-delay: 4s; }
      .item-4 { width: 200px; height: 200px; left: 22%; animation-duration: 34s; animation-delay: 1s; }
      .item-5 { width: 130px; height: 130px; left: 88%; animation-duration: 22s; animation-delay: 6s; }

      @keyframes floatAround {
        0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-120vh) scale(1.2) rotate(360deg); opacity: 0; }
      }

      /* ===================================================================== */
      /* 🎯 RIGHT DRAWER SLIDER STYLING DEFINITIONS (STRICT COLUMN BLOCKS) */
      /* ===================================================================== */
      .drawer-backdrop {
        position: fixed; inset: 0;
        background: rgba(15, 23, 42, ${darkMode ? '0.4' : '0.25'});
        backdrop-filter: blur(6px); z-index: 9998;
      }
      .drawer-panel {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 380px; maxWidth: 100vw;
        box-shadow: -10px 0 50px -15px rgba(15, 23, 42, 0.15);
        padding: 35px 30px; display: flex;
        flex-direction: column !important; box-sizing: border-box; z-index: 9999;
        transition: background 0.3s ease, border-color 0.3s ease;
      }
      .drawer-panel.dark {
        background: #0f172a; border-left: 1px solid rgba(255,255,255,0.06);
      }
      .drawer-panel.light {
        background: #ffffff; border-left: 1px solid #e2e8f0;
      }
      .drawer-header { display: flex; justify-content: flex-start; margin-bottom: 25px; }
      .close-drawer-btn {
        border: none; padding: 10px 18px; border-radius: 12px;
        font-weight: 800; fontSize: 13px; cursor: pointer;
        display: flex; align-items: center; gap: 6px; transition: 0.2s;
        background: ${darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'};
        color: ${darkMode ? '#94a3b8' : '#475569'};
      }
      .close-drawer-btn:hover {
        background: ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
      }
      .profile-branding-section {
        display: flex; flex-direction: column !important; align-items: center;
        text-align: center; padding-bottom: 25px;
        border-bottom: 1.5px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'};
      }
      .profile-large-avatar-drawer {
        width: 80px; height: 80px; border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff; font-size: 32px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 15px; border: 3px solid #fff;
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.15);
      }
      .profile-name {
        margin: 0; font-size: 20px; font-weight: 900;
        letter-spacing: -0.5px;
        color: ${darkMode ? '#ffffff' : '#0f172a'};
      }
      
      .info-grid-drawer {
        display: flex !important; flex-direction: column !important; gap: 18px; 
        margin-top: 28px; flex-grow: 1; width: 100%; text-align: left;
      }
      .section-title-drawer {
        font-size: 11px; font-weight: 800; color: #94a3b8;
        text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
      }
      
      /* Dynamic Vertical Core Row Fix */
      .info-row-premium {
        display: flex !important; flex-direction: column !important; gap: 4px; 
        padding-bottom: 12px; width: 100%; text-align: left;
        border-bottom: 1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'};
      }
      .label-drawer { color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
      .value-drawer {
        font-weight: 800; font-size: 14px;
        color: ${darkMode ? '#e2e8f0' : '#1e293b'};
        word-break: break-all;
      }

      .slide-in-right { animation: slideInPanel 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .fade-in-backdrop { animation: fadeInOverlay 0.3s ease-out forwards; }
    `}</style>
  );
}

const styles = {
  confettiShell: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1 
  }
};

export default StudentDashboard;