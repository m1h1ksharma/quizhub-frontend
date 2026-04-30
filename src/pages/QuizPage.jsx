import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { 
  FaClock, FaShieldAlt, FaChevronLeft, FaChevronRight, 
  FaExclamationTriangle, FaEye, FaForward, FaRocket, FaBolt, FaCheckCircle
} from "react-icons/fa";
import LoadingLoader from "../components/LoadingLoader";
import Swal from "sweetalert2";

function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState(0); 
  const [currentRound, setCurrentRound] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const isSubmittingRef = useRef(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    const handleMouseMove = (e) => {
      if (!isMobile) {
        setMousePos({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2
        });
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMobile]);

  useEffect(() => {
    const initQuiz = async () => {
      if (!token) { navigate("/login"); return; }
      try {
        const configHeaders = { headers: { Authorization: `Bearer ${token}` } };
        const res = await API.get("/student/quiz-config", configHeaders);
        const activeRound = res.data.activeRound || "Normal_Quiz";
        const timerMins = res.data.timerMinutes || 10;
        const qRes = await API.get(`/student/questions/${activeRound}`, configHeaders);
        let fetchedQ = (qRes.data || []).filter(q => q !== null);
        if (fetchedQ.length === 0) { navigate("/student/dashboard"); return; }

        const savedAnswers = localStorage.getItem(`quiz_ans_${activeRound}`);
        const savedReview = localStorage.getItem(`quiz_rev_${activeRound}`);
        const savedTime = localStorage.getItem(`quiz_time_${activeRound}`);
        const savedOrder = localStorage.getItem(`quiz_order_${activeRound}`);

        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        if (savedReview) setMarkedForReview(JSON.parse(savedReview));
        if (savedOrder) { setQuestions(JSON.parse(savedOrder)); } 
        else {
          const shuffled = fetchedQ.sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
          localStorage.setItem(`quiz_order_${activeRound}`, JSON.stringify(shuffled));
        }
        setTimeLeft(savedTime ? parseInt(savedTime) : timerMins * 60);
        setCurrentRound(activeRound);
        setLoading(false);
      } catch (err) { navigate("/student/dashboard"); }
    };
    initQuiz();
  }, [token, navigate]);

  const submitQuiz = async (isForced = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await API.post("/student/submit", answers, { headers: { Authorization: `Bearer ${token}` } });
      
      // LocalStorage Cleanup
      localStorage.removeItem(`quiz_ans_${currentRound}`);
      localStorage.removeItem(`quiz_rev_${currentRound}`);
      localStorage.removeItem(`quiz_time_${currentRound}`);
      localStorage.removeItem(`quiz_order_${currentRound}`);
      
      // ✅ SEEDHA DASHBOARD PAR REDIRECT (Bina kisi popup ke)
      navigate("/student/dashboard", { state: { quizSubmitted: true } });

    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      Swal.fire('Error', 'Submission failed. Please check connection.', 'error');
    }
  };

  // Visibility Check (Tab Switching)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !loading && !isSubmittingRef.current) {
        setWarnings(prev => {
          const next = prev + 1;
          if (next >= 2) { submitQuiz(true); return next; } 
          else { 
            Swal.fire({
              title: '⚠️ SECURITY WARNING',
              text: 'Tab switching is not allowed. Final attempt will lead to auto-submission.',
              icon: 'warning',
              confirmButtonColor: '#2563eb',
            });
            return next; 
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmittingRef.current) { submitQuiz(true); return; }
    if (timeLeft > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          localStorage.setItem(`quiz_time_${currentRound}`, newTime); 
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading, currentRound]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <LoadingLoader message="Shielding Assessment Portal..." />;

  const currentQ = questions[currentIndex] || null;

  return (
    <div className="arena-viewport">
      <div className="arena-gradient"></div>
      <div className="orb orb-1" style={{ transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)` }}></div>
      <div className="orb orb-2" style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)` }}></div>

      <header style={styles.header}>
        <div style={styles.brand}>
          <div className="logo-box"><FaShieldAlt /></div>
          <span>QUIZHUB <span style={styles.roundTag}>{currentRound?.replace("_", " ")}</span></span>
        </div>
        
        <div style={styles.timerGroup}>
          {warnings > 0 && <span style={styles.warningBadge}>SECURITY ALERT</span>}
          <div style={{...styles.timer, color: timeLeft < 60 ? '#ef4444' : '#1e293b'}}>
            <FaClock className={timeLeft < 60 ? "blink" : ""} /> {formatTime(timeLeft)}
          </div>
          <button onClick={() => setShowConfirm(true)} disabled={isSubmitting} className="finish-btn">FINISH</button>
        </div>
      </header>

      <div style={{...styles.main, gridTemplateColumns: isMobile ? "1fr" : "1fr 340px"}}>
        <div style={styles.quizWrapper}>
          <div style={styles.qHeader}>
            <div style={{display:'flex', justifyContent:'space-between', width:'100%', fontWeight:'800', color:'#64748b', fontSize:'12px'}}>
                <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                <span style={{color: '#2563eb'}}>{Math.round(((currentIndex + 1)/questions.length)*100)}% COMPLETE</span>
            </div>
            <div style={styles.pBar}><div style={{...styles.pFill, width: `${((currentIndex + 1)/questions.length)*100}%`}}></div></div>
          </div>

          <div className="glass-card" style={{...styles.qCard, padding: isMobile ? '25px' : '40px'}}>
            {currentQ && (
              <>
                <h2 style={{...styles.qText, fontSize: isMobile ? '19px' : '24px'}}>{currentQ.content}</h2>
                <div style={styles.optionsGrid}>
                  {["A", "B", "C", "D"].map(opt => (
                    <div 
                      key={opt} 
                      onClick={() => {
                        const newAnswers = { ...answers, [currentQ.id]: opt };
                        setAnswers(newAnswers);
                        localStorage.setItem(`quiz_ans_${currentRound}`, JSON.stringify(newAnswers));
                      }}
                      className={`opt-item ${answers[currentQ.id] === opt ? 'selected' : ''}`}
                    >
                      <span className="opt-indicator">{opt}</span>
                      <span>{currentQ[`option${opt}`]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={styles.navAction}>
            <div style={{display: 'flex', gap: '15px', flex: 1}}>
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="nav-ctrl-btn">
                  <FaChevronLeft /> PREV
                </button>
                <button onClick={() => {
                   const qId = currentQ?.id;
                   const newState = { ...markedForReview, [qId]: !markedForReview[qId] };
                   setMarkedForReview(newState);
                   localStorage.setItem(`quiz_rev_${currentRound}`, JSON.stringify(newState));
                }} className={`nav-ctrl-btn ${markedForReview[currentQ?.id] ? 'review-active' : ''}`}>
                   <FaEye /> REVIEW
                </button>
            </div>
            <div style={{display: 'flex', gap: '15px', flex: 1}}>
                <button onClick={() => { if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1); }} className="nav-ctrl-btn">SKIP</button>
                <button onClick={() => currentIndex === questions.length - 1 ? setShowConfirm(true) : setCurrentIndex(prev => prev + 1)} className="nav-ctrl-btn primary">
                  {currentIndex === questions.length - 1 ? "FINISH" : "NEXT"} <FaChevronRight />
                </button>
            </div>
          </div>
        </div>

        <aside className="glass-card" style={styles.paletteArea}>
          <h4 style={{fontWeight: '900', color: '#0f172a', marginBottom: '15px'}}>NAVIGATOR</h4>
          <div style={styles.legendContainer}>
            <div style={styles.legendItem}><span style={{...styles.legendDot, background: '#10b981'}}></span> Done</div>
            <div style={styles.legendItem}><span style={{...styles.legendDot, background: '#8b5cf6'}}></span> Review</div>
            <div style={styles.legendItem}><span style={{...styles.legendDot, background: '#f59e0b'}}></span> Skip</div>
          </div>
          <div style={styles.pGrid}>
            {questions.map((q, i) => {
              const answered = !!answers[q.id];
              const reviewed = !!markedForReview[q.id];
              const visited = i < currentIndex && !answered;
              return (
                <button key={i} onClick={() => setCurrentIndex(i)} className={`p-dot ${currentIndex === i ? 'current' : ''} ${reviewed ? 'review' : answered ? 'attempted' : visited ? 'skipped' : ''}`}>{i + 1}</button>
              );
            })}
          </div>
        </aside>
      </div>

      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div className="modal-pop" style={styles.modal}>
            <FaExclamationTriangle size={50} color="#f59e0b" style={{marginBottom: '15px'}}/>
            <h2 style={{fontWeight:'900', color:'#0f172a'}}>Submit Quiz?</h2>
            <p style={{color:'#64748b', fontWeight:'600'}}>Are you sure you want to end your assessment?</p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowConfirm(false)} style={styles.cancelBtn}>REVIEW</button>
              <button onClick={() => submitQuiz()} className="confirm-submit-btn">SUBMIT</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .arena-viewport { min-height: 100vh; position: relative; overflow-x: hidden; font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; }
        .arena-gradient { position: absolute; inset: 0; background: radial-gradient(at 0% 0%, rgba(37,99,235,0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139,92,246,0.05) 0px, transparent 50%); z-index: -2; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: 0.5; pointer-events: none; }
        .orb-1 { width: 500px; height: 500px; background: #dbeafe; top: -150px; left: -150px; }
        .orb-2 { width: 400px; height: 400px; background: #ede9fe; bottom: -100px; right: -100px; }
        .glass-card { background: rgba(255,255,255,0.85); backdrop-filter: blur(30px); border-radius: 35px; border: 1px solid #fff; box-shadow: 0 30px 70px rgba(0,0,0,0.04); }
        .opt-item { padding: 18px 25px; border-radius: 20px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 15px; font-weight: 700; color: #334155; }
        .opt-item:hover { border-color: #2563eb; background: #f8faff; }
        .opt-item.selected { background: #eff6ff; border: 2px solid #2563eb; color: #2563eb; }
        .p-dot { height: 45px; border-radius: 12px; font-weight: 900; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; transition: 0.3s; }
        .p-dot.current { border: 2.5px solid #0f172a; transform: scale(1.1); }
        .p-dot.attempted { background: #10b981; color: #fff; border: none; }
        .p-dot.review { background: #8b5cf6; color: #fff; border: none; }
        .p-dot.skipped { background: #f59e0b; color: #fff; border: none; }
        .nav-ctrl-btn { padding: 16px; border-radius: 18px; border: 1px solid #e2e8f0; background: #fff; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
        .nav-ctrl-btn.primary { background: #0f172a; color: #fff; border: none; }
        .nav-ctrl-btn.review-active { background: #8b5cf6; color: #fff; border: none; }
        .finish-btn { background: #ef4444; color: #fff; border: none; padding: 12px 25px; border-radius: 14px; font-weight: 900; cursor: pointer; }
        .confirm-submit-btn { flex: 1; padding: 18px; border-radius: 18px; border: none; background: #2563eb; color: #fff; font-weight: 800; cursor: pointer; }
        .blink { animation: blinkAnim 1s infinite; }
        @keyframes blinkAnim { 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

const styles = {
    header: { background: "rgba(255,255,255,0.8)", height: "85px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.05)", position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', padding: '0 5%' },
    brand: { display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '900', fontSize: '20px' },
    logoBox: { background: '#2563eb', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    roundTag: { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '10px', fontSize: '11px' },
    timerGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    warningBadge: { background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900' },
    timer: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', background: '#fff', padding: '12px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', fontSize: '16px' },
    main: { maxWidth: "1500px", margin: "0 auto", display: "grid", gap: "30px", padding: "30px" },
    quizWrapper: { display: 'flex', flexDirection: 'column', gap: '20px' },
    qHeader: { display: 'flex', flexDirection: 'column', gap: '10px' },
    pBar: { width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '20px', overflow: 'hidden' },
    pFill: { height: '100%', background: '#2563eb', transition: '0.4s' },
    qCard: { background: "#fff", borderRadius: "20px", display: 'flex', flexDirection: 'column' },
    qText: { lineHeight: "1.5", color: "#0f172a", fontWeight: '800', margin: 0 },
    optionsGrid: { display: "flex", flexDirection: "column", gap: "15px", marginTop: '25px' },
    navAction: { display: 'flex', justifyContent: 'space-between', gap: '15px' },
    paletteArea: { padding: "30px 20px", height: "fit-content" },
    legendContainer: { display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' },
    legendItem: { fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' },
    legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
    pGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" },
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: 'blur(10px)', display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 },
    modal: { background: "#fff", padding: "45px", borderRadius: "40px", textAlign: "center", maxWidth: '450px' },
    modalActions: { display: 'flex', gap: '15px', marginTop: '35px' },
    cancelBtn: { flex: 1, padding: '18px', borderRadius: '18px', border: '1px solid #f1f5f9', background: '#fff', fontWeight: '800', color: '#94a3b8', cursor: 'pointer' }
};

export default QuizPage;