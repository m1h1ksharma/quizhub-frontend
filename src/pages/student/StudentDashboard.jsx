import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUserCircle, FaSignOutAlt, FaShieldAlt, FaExclamationTriangle,
  FaStopwatch, FaCheckCircle, FaRocket, FaMoon, FaSun
} from "react-icons/fa";
import API from "../../api/axios";
import Swal from "sweetalert2";

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState({ attempted: false, round: "" });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const token = localStorage.getItem("token");
  const rawName = localStorage.getItem("userName") || "Student";
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  // 1. Success Toast Logic
  useEffect(() => {
    if (location.state?.quizSubmitted) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Quiz Submitted Successfully!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 2. Fetch Status Logic
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const checkStatus = async () => {
      try {
        const res = await API.get("/student/check-status");
        // Yahan ensure kar rhe hain ki data sahi se set ho
        setStatus({
          attempted: res.data.attempted || false,
          round: res.data.round || "Assessment Round"
        });
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    checkStatus();
  }, [navigate, token]);

  // 3. Cursor Glow Effect
  useEffect(() => {
    const moveGlow = (e) => {
      document.documentElement.style.setProperty("--x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", moveGlow);
    return () => window.removeEventListener("mousemove", moveGlow);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) return (
    <div className="loaderPage">
      <div className="loaderRing"></div>
      <p>Loading Dashboard...</p>
      <Styles darkMode={darkMode} />
    </div>
  );

  return (
    <div className={darkMode ? "dashboard dark" : "dashboard light"}>
      <div className="bgBlob"></div>
      <div className="cursorGlow"></div>

      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">
          <span className="piet-text">PIET</span> <span className="quizhub-text">QUIZHUB</span>
        </h2>
        <div className="navActions">
          <div className="userBadge">
            <FaUserCircle />
            <span className="hide-mobile">{userName}</span>
          </div>
          <button className="themeBtn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="logoutBtn" onClick={() => { localStorage.clear(); navigate("/login"); }}>
            <FaSignOutAlt />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="mainWrap">
        <div className="mainCard">
          {status.attempted ? (
            /* Case 1: Quiz Already Done */
            <div className="fade-in">
              <FaCheckCircle size={72} color="#10b981" />
              <h1 className="heroTitle">Quiz Submitted</h1>
              <p className="heroSub">
                Your response for <b>{status.round}</b> has been saved.
                <br />
                Wait for the results to be announced.
              </p>
            </div>
          ) : (
            /* Case 2: Welcome Screen / Start Quiz */
            <div className="fade-in">
              <div className="liveBadge"><FaRocket /> Live Assessment</div>
              <h1 className="heroTitle">{getGreeting()}, {userName.split(" ")[0]}</h1>
              <p className="heroSub">
                <b>{status.round}</b> is now active. 
                <br /> 
                Ready to test your skills?
              </p>
              <button className="primaryBtn" onClick={() => setShowModal(true)}>
                Start Quiz
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Instructions Modal */}
      {showModal && (
        <div className="overlay">
          <div className="modalBox">
            <h2 className="modalHeading">Instructions</h2>
            <div className="ruleBox">
              <FaStopwatch color="#3b82f6" /> 
              <span>Timer runs continuously during the quiz.</span>
            </div>
            <div className="ruleBox">
              <FaExclamationTriangle color="#f59e0b" /> 
              <span>Tab switching will trigger a security warning.</span>
            </div>
            <div className="ruleBox">
              <FaShieldAlt color="#10b981" /> 
              <span>AI Monitoring system is actively enabled.</span>
            </div>
            <div className="modalBtns">
              <button className="cancelBtn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primaryBtn modalStartBtn" onClick={() => navigate("/student/quiz")}>I'm Ready</button>
            </div>
          </div>
        </div>
      )}
      <Styles darkMode={darkMode} />
    </div>
  );
}

function Styles({ darkMode }) {
  return (
    <style>{`
      *{ margin:0; padding:0; box-sizing:border-box; }
      body{ font-family: 'Inter', sans-serif; background: ${darkMode ? '#0f172a' : '#f8fafc'}; }
      
      .dashboard{ min-height:100vh; position:relative; overflow-x:hidden; transition: background 0.4s; }

      /* Background Gradients */
      .light{ background:linear-gradient(135deg,#eff6ff,#ffffff,#dbeafe,#eef2ff); color:#111827; }
      .dark{ background:linear-gradient(135deg,#0f172a,#111827,#1e1b4b,#0f172a); color:#ffffff; }
      .light,.dark{ background-size:400% 400%; animation:bgMove 10s ease infinite; }

      @keyframes bgMove{ 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }

      /* Blobs */
      .bgBlob::before, .bgBlob::after{
        content:""; position:absolute; width:450px; height:450px; border-radius:50%; filter:blur(100px); opacity:0.3; animation:floatBlob 10s ease-in-out infinite alternate; z-index:0;
      }
      .bgBlob::before{ background:#2563eb; top:-150px; left:-150px; }
      .bgBlob::after{ background:#9333ea; bottom:-150px; right:-150px; }
      @keyframes floatBlob{ from{transform:translate(0,0);} to{transform:translate(80px,50px);} }

      .cursorGlow{ position:fixed; left:var(--x,50%); top:var(--y,50%); transform:translate(-50%,-50%); width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(59,130,246,0.15),transparent 75%); pointer-events:none; z-index:1; }

      /* Navbar */
      .navbar{ height:74px; padding:0 5%; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:50; backdrop-filter:blur(16px); }
      .light .navbar{ background:rgba(255,255,255,0.8); border-bottom:1px solid rgba(0,0,0,0.05); }
      .dark .navbar{ background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(255,255,255,0.1); }
      
      .logo{ font-size:22px; font-weight:900; letter-spacing: -0.5px; }
      .piet-text { color: #3b82f6; }
      .quizhub-text { color: ${darkMode ? '#ffffff' : '#111827'}; }

      .navActions{ display:flex; gap:12px; align-items:center; }
      .userBadge, .themeBtn, .logoutBtn{ height:42px; border:none; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.3s; }
      .userBadge{ padding:0 15px; gap:8px; font-weight:700; background: ${darkMode ? 'rgba(255,255,255,0.1)' : '#fff'}; color: ${darkMode ? '#fff' : '#111827'}; }
      .themeBtn{ width:42px; background: ${darkMode ? 'rgba(255,255,255,0.1)' : '#fff'}; color: ${darkMode ? '#fbbf24' : '#64748b'}; }
      .logoutBtn{ width:42px; background:rgba(239,68,68,0.1); color:#ef4444; }
      .logoutBtn:hover { background:#ef4444; color:#fff; }

      /* Main Card */
      .mainWrap{ min-height:calc(100vh - 74px); display:flex; justify-content:center; align-items:center; padding:20px; position:relative; z-index:10; }
      .mainCard{ width:100%; max-width:700px; padding:60px 40px; border-radius:32px; text-align:center; backdrop-filter:blur(20px); transition: 0.3s; }
      .light .mainCard{ background:rgba(255,255,255,0.7); border:1px solid #fff; box-shadow:0 30px 60px rgba(0,0,0,0.05); }
      .dark .mainCard{ background:rgba(30, 41, 59, 0.7); border:1px solid rgba(255,255,255,0.05); box-shadow:0 30px 60px rgba(0,0,0,0.3); }

      .heroTitle{ font-size:48px; font-weight:900; margin:20px 0; color: ${darkMode ? '#fff' : '#111827'}; letter-spacing: -1.5px; }
      .heroSub{ font-size:18px; line-height:1.6; margin-bottom:35px; color: ${darkMode ? '#cbd5e1' : '#475569'}; }
      
      .liveBadge{ display:inline-flex; gap:8px; align-items:center; padding:8px 16px; border-radius:100px; font-weight:800; font-size:12px; background:rgba(59,130,246,0.1); color:#3b82f6; text-transform: uppercase; }

      .primaryBtn{ border:none; padding:16px 35px; border-radius:16px; font-weight:800; cursor:pointer; transition:0.3s; font-size:16px; background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; box-shadow: 0 10px 25px rgba(59,130,246,0.3); }
      .primaryBtn:hover{ transform:translateY(-5px); box-shadow: 0 15px 30px rgba(59,130,246,0.4); }

      /* Modal */
      .overlay{ position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter: blur(8px); display:flex; justify-content:center; align-items:center; padding:20px; z-index:1000; }
      .modalBox{ width:100%; max-width:480px; padding:40px; border-radius:28px; text-align: center; position:relative; }
      .light .modalBox{ background:#fff; color:#1e293b; }
      .dark .modalBox{ background:#1e293b; color:#fff; border: 1px solid rgba(255,255,255,0.1); }
      
      .ruleBox{ display:flex; gap:15px; align-items:center; padding:18px; border-radius:16px; margin-top:15px; text-align: left; background: ${darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}; }
      .modalHeading { font-size: 28px; font-weight: 800; margin-bottom: 10px; }
      .modalBtns { display: flex; gap: 15px; margin-top: 30px; }
      .cancelBtn { flex: 1; padding: 16px; border-radius: 16px; border: none; background: ${darkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}; color: ${darkMode ? '#fff' : '#64748b'}; font-weight: 800; cursor: pointer; }
      .modalStartBtn { flex: 2; }

      .fade-in { animation: fadeIn 0.8s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

      /* Mobile Patch */
      @media(max-width:768px){
        .navbar { padding: 0 20px; }
        .logo { font-size: 18px; }
        .hide-mobile { display: none; }
        .heroTitle { font-size: 32px; }
        .heroSub { font-size: 15px; }
        .mainCard { padding: 40px 20px; margin: 0 10px; }
        .modalBox { padding: 30px 20px; width: 95%; }
        .modalBtns { flex-direction: column; }
        .cancelBtn { order: 2; }
        .modalStartBtn { order: 1; }
      }
    `}</style>
  );
}

export default StudentDashboard;