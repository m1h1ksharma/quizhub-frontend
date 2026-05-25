import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link add kiya forgot password ke liye
import API from "../api/axios";
import Swal from "sweetalert2";
import {
  FaPhoneAlt, FaEnvelope, FaLock, FaUser,
  FaSchool, FaMapMarkerAlt, FaGraduationCap,
  FaBook, FaIdBadge, FaSignInAlt, FaUserPlus, FaArrowLeft, FaEdit,
  FaCode, FaCity
} from "react-icons/fa";

const AREA_LIST = ["ASSANDH", "BAGHPAT", "DELHI", "GANAUR", "KAITHAL", "KARNAL", "KKR", "PUNDRI", "ROHTAK", "SAFIDON", "GHARAUNDA", "GOHANA", "JIND", "NILOKHERI-TARAORI", "PANIPAT", "SAMALKHA", "SHAMLI", "SONIPAT", "Others"].sort();

const COLLEGE_LIST = ["Arya PG College, Panipat", "Baba Fateh Singhji Govt. College, Assandh", "Bhagwan Parshuram College, Kurukshetra", "Chaudhary Ishwar Singh Kanya Mahavidyala, Pundri", "CRA College, Sonipat", "DAV College, Karnal", "DAV College, Pundri", "Dronacharya Degree College, Kurukshetra", "GCW, Rohtak", "Govt. PG College, Panipat", "Govt. College for girls Palwal, Kurukshetra", "Govt. College for women, Rohtak", "Govt. College for Women, Karnal", "Govt. College Women Bastara, Gharaunda", "Govt. College, Bahadurgarh", "Govt. College, Barota", "Govt. College, Gharaunda", "Govt. College, Jind", "Govt. Girls PG College Gohana", "Govt. Pg College, Jind", "Govt College Women, Jind", "Guru Nanak Khalsa College, Karnal", "I.B PG College, Panipat", "Jat College, Kaithal", "PIET, Panipat", "Pt. Chiranji Lal Sharma Govt. College, Karnal", "Pt. Neki Ram Sharma College, Rohtak", "RK PG College, Shamli", "RKSD Evening College Kaithal", "RKSD PG College, Kaithal", "Sh. Lal Nath Hindu College, Rohtak", "Shri Guru Teg Bahadur ji Govt. College, Nilokheri", "Shyam Lal Mukherji College, Delhi", "Vaish Mahila Mahavidyalya, Rohtak", "Others"].sort();

const SCHOOL_LIST = ["Dyal Singh Public School", "SD Vidya Mandir", "DAV Public School", "O.P. Jindal Modern School", "Delhi Public School (DPS)", "Bal Vikas School", "Tagore Baal Niketan", "St. Theresa's Convent", "Pratap Public School", "Gateway International", "Rishikul Vidyapeeth", "Hindu Vidyapeeth", "Indus Public School", "Heritage International", "RKSD Public School", "Modern School, Delhi", "Ryan International", "Silver Bells, Shamli", "Others"].sort();

const SCHOOL_STREAMS = ["Non-Medical (PCM)", "Medical (PCB)", "Commerce", "Arts / Humanities", "Others"];
const UG_STREAMS = ["B.Tech / B.E.", "BCA", "B.Sc (IT/CS)", "B.Sc (General)", "B.Com", "BBA", "B.A.", "B.Pharma", "Others"];

function LoginPage() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobile, setMobile] = useState("");
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [regData, setRegData] = useState({ 
    name: "", fatherName: "", email: "", schoolName: "", 
    city: "", area: "", classLevel: "12th", stream: "" 
  });

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showToast = (msg, icon = 'success') => {
    const Toast = Swal.mixin({
      toast: true, position: 'bottom-end', showConfirmButton: false,
      timer: 3000, timerProgressBar: true,
      background: '#fff', color: '#1e293b'
    });
    Toast.fire({ icon, title: msg });
  };

  const resetForm = () => {
    setMobile(""); setNames([]); setSelectedName(""); setPassword("");
    setEmail(""); setStep(1);
    setRegData({ 
      name: "", fatherName: "", email: "", schoolName: "", 
      city: "", area: "", classLevel: "12th", stream: "" 
    });
  };

  const handleMobileChange = async (e) => {
    const val = e.target.value;
    setMobile(val);
    if (val.length === 10 && !isAdmin && mode === "login") {
      try {
        const res = await API.post("/auth/check-mobile", { mobileNumber: val });
        setNames(res.data);
        if (res.data.length > 0) setSelectedName(res.data[0]);
      } catch (err) {
        setNames([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register" && step === 1) {
      if (!mobile || mobile.length !== 10) {
        showToast("Enter a valid 10-digit mobile number", "error");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const payload = {
          ...regData,
          mobileNumber: mobile.trim(),
          password: password.trim(),
          role: "STUDENT"
        };
        await API.post("/auth/register", payload);
        showToast('Registration Successful! Login Now');
        setMode("login");
        resetForm();
      } else {
        const endpoint = isAdmin ? "/auth/login-admin" : "/auth/login-student";
        const payload = isAdmin
          ? { email: email.trim(), password: password.trim() }
          : { mobileNumber: mobile.trim(), name: selectedName, password: password.trim() };

        const res = await API.post(endpoint, payload);
        
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userName", res.data.name || selectedName);
        
        navigate(res.data.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard");
      }
    } catch (err) {
      console.error("Submission Error:", err.response?.data || err.message);
      const errMsg = err.response?.data?.message || 'Error: Check Credentials';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-viewport">
      <div className="gradient-bg"></div>
      <ul className="bubbles-container">
        {[...Array(8)].map((_, i) => (
          <li key={i} className={`bubble b${i + 1}`}></li>
        ))}
      </ul>

      <div className="login-card" style={{ ...styles.card, maxWidth: "460px", padding: isMobile ? "30px 20px" : "50px" }}>
        <div style={styles.headerBox}>
          <h1 style={{ ...styles.title, fontSize: isMobile ? '30px' : '40px' }}>
            <span style={{ color: '#2563eb' }}>PIET</span> QUIZHUB
          </h1>
          <p style={styles.subtitle}>{mode === "login" ? "Secure Login" : `Create Profile (${step}/2)`}</p>
        </div>

        {mode === "login" && (
          <div style={styles.toggleRow}>
            <button type="button" onClick={() => { setIsAdmin(false); resetForm(); }} style={!isAdmin ? styles.activeTab : styles.tab}>Student</button>
            <button type="button" onClick={() => { setIsAdmin(true); resetForm(); }} style={isAdmin ? styles.activeTab : styles.tab}>Admin</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formBase}>
          {mode === "register" ? (
            <div className="form-animation">
              {step === 1 ? (
                <div style={styles.stepWrapper}>
                  <div style={styles.inputWrapper}><FaUser style={styles.icon}/><input placeholder="Full Name" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} required style={styles.input}/></div>
                  <div style={styles.inputWrapper}><FaIdBadge style={styles.icon}/><input placeholder="Father's Name" value={regData.fatherName} onChange={e => setRegData({...regData, fatherName: e.target.value})} required style={styles.input}/></div>
                  <div style={styles.inputWrapper}><FaEnvelope style={styles.icon}/><input type="email" placeholder="Email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required style={styles.input}/></div>
                  <div style={styles.inputWrapper}><FaPhoneAlt style={styles.icon}/><input placeholder="Mobile" maxLength="10" value={mobile} onChange={e => setMobile(e.target.value)} required style={styles.input}/></div>
                </div>
              ) : (
                <div style={styles.stepWrapper}>
                  <div style={styles.toggleRow}>
                    <button type="button" onClick={() => setRegData({...regData, classLevel: "12th", schoolName: "", area: "", stream: ""})} style={regData.classLevel === "12th" ? styles.activeTab : styles.tab}>School</button>
                    <button type="button" onClick={() => setRegData({...regData, classLevel: "UG", schoolName: "", area: "", stream: ""})} style={regData.classLevel === "UG" ? styles.activeTab : styles.tab}>College</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={styles.inputWrapper}><FaCity style={styles.icon}/><select value={regData.area} onChange={e => setRegData({...regData, area: e.target.value})} required style={styles.select}><option value="">Select Area</option>{AREA_LIST.map((a, i) => <option key={i} value={a}>{a}</option>)}</select></div>
                    <div style={styles.inputWrapper}><FaSchool style={styles.icon}/><select value={regData.schoolName} onChange={e => setRegData({...regData, schoolName: e.target.value})} required style={styles.select}><option value="">Select Institution</option>{(regData.classLevel === "12th" ? SCHOOL_LIST : COLLEGE_LIST).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}<option value="Manual">Others</option></select></div>
                    {regData.schoolName === "Manual" && <div style={styles.inputWrapper}><FaEdit style={styles.icon}/><input placeholder="Type Name" onChange={e => setRegData({...regData, schoolName: e.target.value})} required style={styles.input}/></div>}
                    <div style={styles.inputWrapper}><FaBook style={styles.icon}/><select value={regData.stream} onChange={e => setRegData({...regData, stream: e.target.value})} required style={styles.select}><option value="">Select Stream</option>{(regData.classLevel === "12th" ? SCHOOL_STREAMS : UG_STREAMS).map((s, i) => <option key={i} value={s}>{s}</option>)}<option value="ManualStream">Others (BCA/Tech)</option></select></div>
                    {regData.stream === "ManualStream" && <div style={styles.inputWrapper}><FaCode style={styles.icon}/><input placeholder="Type Course" onChange={e => setRegData({...regData, stream: e.target.value})} required style={styles.input}/></div>}
                    <div style={styles.inputWrapper}><FaLock style={styles.icon}/><input type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.stepWrapper}>
              {isAdmin ? (
                <>
                  <div style={styles.inputWrapper}><FaEnvelope style={styles.icon}/><input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input}/></div>
                  <div style={styles.inputWrapper}><FaLock style={styles.icon}/><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/></div>
                </>
              ) : (
                <>
                  <div style={styles.inputWrapper}><FaPhoneAlt style={styles.icon}/><input type="text" placeholder="Mobile Number" value={mobile} onChange={handleMobileChange} required style={styles.input} maxLength="10"/></div>
                  {names.length > 0 && (
                    <div className="form-animation" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={styles.inputWrapper}><FaUser style={styles.icon}/><select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={styles.select}>{names.map((n, i) => <option key={i} value={n}>{n.toUpperCase()}</option>)}</select></div>
                      <div style={styles.inputWrapper}><FaLock style={styles.icon}/><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/></div>
                    </div>
                  )}
                  {/* 🔥 ADDED: Forgot Password Link */}
                  {!isAdmin && (
                    <div style={{ textAlign: 'right', marginTop: '5px' }}>
                      <Link to="/forgot-password" style={{ color: '#2563eb', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                        Forgot Password?
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            {mode === "register" && step === 2 && <button type="button" onClick={() => setStep(1)} style={styles.backBtn}><FaArrowLeft /></button>}
            <button type="submit" disabled={loading} className="btn-glow" style={styles.btn}>
              {loading ? "..." : (mode === "login" ? "PROCEED" : (step === 1 ? "NEXT" : "JOIN"))}
            </button>
          </div>
        </form>

        <div style={styles.footer}>
          <p style={{ margin: 0, fontWeight: '600', color: '#94a3b8' }}>
            {mode === "login" ? "New User?" : "Member?"} <span style={styles.link} onClick={() => { setMode(mode === "login" ? "register" : "login"); resetForm(); }}>{mode === "login" ? "Register" : "Login"}</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes grad { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .main-viewport { min-height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
        .gradient-bg { position: absolute; inset: 0; background: linear-gradient(-45deg, #f8fafc, #eef2ff, #fdf2f8, #f1f5f9); background-size: 400% 400%; animation: grad 15s ease infinite; z-index: 0; }
        .bubbles-container { position: absolute; inset: 0; z-index: 1; margin:0; padding:0; }
        .bubble { position: absolute; list-style: none; background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; bottom: -150px; animation: floatUp 20s linear infinite; }
        @keyframes floatUp { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 100% { transform: translateY(-1200px) rotate(360deg); opacity: 0; } }
        .b1 { left: 10%; width: 100px; height: 100px; animation-duration: 18s; }
        .b2 { left: 25%; width: 40px; height: 40px; animation-duration: 25s; animation-delay: 2s; }
        .b3 { left: 45%; width: 120px; height: 120px; animation-duration: 22s; animation-delay: 5s; }
        .b4 { left: 60%; width: 70px; height: 70px; animation-duration: 15s; }
        .b5 { left: 80%; width: 150px; height: 150px; animation-duration: 28s; animation-delay: 3s; }
        .b6 { left: 15%; width: 30px; height: 30px; animation-duration: 20s; animation-delay: 7s; }
        .login-card { position: relative; z-index: 10; animation: pop 0.5s ease-out; }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .form-animation { animation: slide 0.4s ease; }
        @keyframes slide { from { transform: translateX(10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }
      `}</style>
    </div>
  );
}

const styles = {
  card: { width: "100%", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderRadius: "40px", boxShadow: "0 25px 60px rgba(0,0,0,0.05)", border: "1px solid #fff" },
  headerBox: { marginBottom: "30px", textAlign: "center" },
  title: { fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: '-2px' },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "5px", fontWeight: '600' },
  toggleRow: { display: "flex", background: "#f1f5f9", padding: "6px", borderRadius: "16px", marginBottom: "20px" },
  tab: { flex: 1, padding: "12px", border: "none", borderRadius: "12px", background: "transparent", cursor: "pointer", color: "#64748b", fontWeight: "700" },
  activeTab: { flex: 1, padding: "12px", border: "none", borderRadius: "12px", background: "#fff", color: "#2563eb", fontWeight: "800", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
  formBase: { display: 'flex', flexDirection: 'column' },
  stepWrapper: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputWrapper: { position: "relative" },
  icon: { position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  input: { width: "100%", padding: "16px 16px 16px 52px", borderRadius: "16px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", fontWeight: '600', color: '#1e293b', background: '#f8fafc' },
  select: { width: "100%", padding: "16px 16px 16px 52px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "15px", fontWeight: '600', color: '#1e293b', cursor: 'pointer' },
  btn: { flex: 1, background: "#0f172a", color: "#fff", border: "none", padding: "18px", borderRadius: "16px", fontWeight: "800", fontSize: "15px", cursor: "pointer", transition: '0.3s' },
  backBtn: { width: '60px', background: '#f1f5f9', border: 'none', borderRadius: '16px', color: '#475569', cursor: 'pointer' },
  footer: { marginTop: "30px", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "20px" },
  link: { color: "#2563eb", fontWeight: "800", cursor: "pointer" }
};

export default LoginPage;