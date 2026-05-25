import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  FaClock, FaShieldAlt, FaChevronLeft, FaChevronRight,
  FaExclamationTriangle, FaEye, FaForward, FaLock
} from "react-icons/fa";
import LoadingLoader from "../components/LoadingLoader";
import Swal from "sweetalert2";

function QuizPage() {
  const navigate = useNavigate();

  // CORE TESTING STATES DATA REGISTRIES
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // SECURITY TRACKING & SCREEN RED-ALERT BOUNDS CONFIGURATIONS
  const [isTabActive, setIsTabActive] = useState(true);
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isSubmittingRef = useRef(false);
  const timerRef = useRef(null);
  const token = localStorage.getItem("token");

  // 🎯 REAL-TIME REF SYNC TO FIX THE STALE CLOSURE 0/5 SCORE BUG
  const answersRef = useRef({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Initial Data Fetch & Component Mount LifeCycle Hook
  useEffect(() => {
    const initQuiz = async () => {
      if (!token) { navigate("/login"); return; }
      try {
        const checkRes = await API.get("/student/check-status");
        if (checkRes.data.attempted) {
          navigate("/student/dashboard");
          return;
        }

        const activeRound = checkRes.data.quizRound || checkRes.data.round || "Assessment Round";
        const adminLimit = checkRes.data.quizLimit || 10;
        const durationMins = checkRes.data.duration || 15;
        
        setCurrentRound(activeRound);

        const qRes = await API.get(`/student/questions/${encodeURIComponent(activeRound)}`);
        let allFetchedQ = (qRes.data || []).filter(q => q !== null);
        
        if (allFetchedQ.length === 0) {
          navigate("/student/dashboard");
          return;
        }

        await API.post("/student/quiz/enter");

        const savedAns = localStorage.getItem(`quiz_ans_${activeRound}`);
        const savedRev = localStorage.getItem(`quiz_rev_${activeRound}`);
        const savedOrder = localStorage.getItem(`quiz_order_${activeRound}`);
        const savedTime = localStorage.getItem(`quiz_time_${activeRound}`);

        if (savedAns) {
          const parsed = JSON.parse(savedAns);
          setAnswers(parsed);
          answersRef.current = parsed;
        }
        if (savedRev) setMarkedForReview(JSON.parse(savedRev));

        let finalSet = [];
        if (savedOrder) {
          finalSet = JSON.parse(savedOrder);
        } else {
          finalSet = [...allFetchedQ].sort(() => Math.random() - 0.5).slice(0, adminLimit);
          localStorage.setItem(`quiz_order_${activeRound}`, JSON.stringify(finalSet));
        }
        setQuestions(finalSet);

        setTimeLeft(savedTime ? parseInt(savedTime) : durationMins * 60);
        setLoading(false);

      } catch (err) {
        console.error("Critical failure during quiz page initialization sequence:", err);
        navigate("/student/dashboard");
      }
    };

    initQuiz();
  }, [token, navigate]);

  // 2. Continuous Operational Assessment Clock Handlers Background Thread
  useEffect(() => {
    if (loading || timeLeft === null || isSubmitting) return;

    if (timeLeft === 0 && !isSubmittingRef.current) {
      autoSubmitQuiz("Assessment countdown timer expired! Automated response submission active.");
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        const nextTime = prev - 1;
        localStorage.setItem(`quiz_time_${currentRound}`, nextTime.toString());
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading, isSubmitting, currentRound]);

  // 3. Security Tracking System Monitoring Architecture Layer
  useEffect(() => {
    if (loading || isSubmitting) return;

    const handleVisibility = () => {
      if (document.hidden && !loading && !isSubmittingRef.current) {
        setIsTabActive(false); 
        setWarningCount((prev) => {
          const nextWarning = prev + 1;
          if (nextWarning >= 2) {
            autoSubmitQuiz("Security violation triggered! Maximum tab switching limit breached.");
          } else {
            Swal.fire({
              title: 'SECURITY BREACH DETECTED',
              html: 'Tab switching behaviors are strictly recorded across drive coordinators.<br/>Next instance enforces instant <b>AUTO-SUBMISSION</b>.',
              icon: 'error',
              confirmButtonColor: '#ef4444',
              allowOutsideClick: false,
              backdrop: 'rgba(220, 38, 38, 0.85)'
            }).then(() => setIsTabActive(true));
          }
          return nextWarning;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading, isSubmitting, currentRound]);

  // THE FIXED SUBMISSION METHOD
  const submitQuiz = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true); 

    try {
      const res = await API.post("/student/submit", answersRef.current);
      await API.post("/student/quiz/exit");

      localStorage.removeItem(`quiz_ans_${currentRound}`);
      localStorage.removeItem(`quiz_rev_${currentRound}`);
      localStorage.removeItem(`quiz_time_${currentRound}`);
      localStorage.removeItem(`quiz_order_${currentRound}`);

      if (timerRef.current) clearInterval(timerRef.current);

      setIsSubmitting(false);
      setShowConfirm(false);

      Swal.fire({
        title: 'Quiz Submitted Successfully!',
        text: res.data.showResult 
          ? `Evaluation compiled successfully. Final score yields: ${res.data.score} / ${res.data.total}`
          : 'Your response parameters have been encrypted and saved safely.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        navigate("/student/dashboard", { replace: true }); 
      });

    } catch (err) {
      console.error("Submission exception route captured:", err);
      isSubmittingRef.current = false;
      setIsSubmitting(false); 
      Swal.fire('Submission Error', 'Failed to link parameters stream registry. Check connection.', 'error');
    }
  };

  // 🎯 FIXED AUTO-SUBMIT METHOD: GRABS ACCURATE LATEST REF AND LOCALSTORAGE ANSWERS
  const autoSubmitQuiz = async (reason) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // ✅ READ ANSWERS FROM LATEST STATE REF ON CLOSURE POPUP INJECTION
      let payloadAnswers = answersRef.current;
      
      // ✅ DEEP FALLBACK LAYER: IF MEMORY IS STALE, GRAB CODES DIRECTLY FROM CACHED LOCALSTORAGE
      if (!payloadAnswers || Object.keys(payloadAnswers).length === 0) {
        const fallbackAns = localStorage.getItem(`quiz_ans_${currentRound}`);
        if (fallbackAns) {
          payloadAnswers = JSON.parse(fallbackAns);
        }
      }

      const res = await API.post("/student/submit", payloadAnswers);
      await API.post("/student/quiz/exit");

      localStorage.removeItem(`quiz_ans_${currentRound}`);
      localStorage.removeItem(`quiz_rev_${currentRound}`);
      localStorage.removeItem(`quiz_time_${currentRound}`);
      localStorage.removeItem(`quiz_order_${currentRound}`);

      if (timerRef.current) clearInterval(timerRef.current);

      setIsSubmitting(false);
      setShowConfirm(false);

      Swal.fire({
        title: 'Assessment Closed',
        text: reason,
        icon: 'info',
        confirmButtonColor: '#2563eb',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        navigate("/student/dashboard", { replace: true });
      });
    } catch (err) {
      console.error("Failover trace execution caught inside auto-triggers:", err);
      setIsSubmitting(false);
      navigate("/student/dashboard", { replace: true });
    }
  };

  const handleOptionClick = (qId, optionLabel) => {
    const nextAns = { ...answers, [qId]: optionLabel };
    setAnswers(nextAns);
    localStorage.setItem(`quiz_ans_${currentRound}`, JSON.stringify(nextAns));
  };

  const handleReviewToggle = (qId) => {
    const nextRev = { ...markedForReview, [qId]: !markedForReview[qId] };
    setMarkedForReview(nextRev);
    localStorage.setItem(`quiz_rev_${currentRound}`, JSON.stringify(nextRev));
  };

  const formatTime = (s) => {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingLoader />;
  const currentQ = questions[currentIndex];
  if (!currentQ) return <LoadingLoader />;

  const attemptedCount = Object.keys(answers).length;
  const skippedCount = questions.filter((q, i) => i < currentIndex && !answers[q.id]).length;

  return (
    <div className={`arena-viewport ${!isTabActive ? "red-alert-bg" : ""}`}>
      
      {!isTabActive && (
        <div className="red-overlay">SECURITY ALERT: FRAUDULENT TAB BEHAVIOR DETECTED. RETURN IMMEDIATELY.</div>
      )}

      {isSubmitting && (
        <div style={styles.submittingOverlay}>
          <div style={styles.submittingCard}>
            <div style={styles.spinner}></div>
            <h2 style={{margin:"15px 0 5px 0", color:"#1e293b", fontWeight:900, fontSize: "22px"}}>Finalizing Response...</h2>
            <p style={{margin:0, color:"#64748b", fontSize:"14px", fontWeight:600}}>Syncing operational vectors securely to server registries.</p>
          </div>
        </div>
      )}

      {showConfirm && !isSubmitting && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ marginTop: "10px", marginBottom: "15px" }}>
              <FaExclamationTriangle size={48} color="#f59e0b" />
            </div>
            <h2 style={{ fontWeight: 900, color: "#0f172a", fontSize: "22px", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Submit Assessment?</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: '600', color: '#64748b', lineHeight: 1.5 }}>
              You have attempted <b>{attemptedCount}</b> out of <b>{questions.length}</b> question structures. Are you sure you want to exit evaluation sheets?
            </p>
            <div className="modal-btns">
              <button onClick={() => setShowConfirm(false)} className="cancel-btn">Back to Assessment</button>
              <button onClick={submitQuiz} className="submit-btn">Submit Now</button>
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.brand}>
          <div className="logo-box"><FaShieldAlt /></div>
          <span>QUIZHUB <span style={styles.roundTag}>{currentRound.replace("_", " ")}</span></span>
        </div>
        <div style={styles.timerGroup}>
          <div style={{...styles.timer, color: timeLeft < 60 ? '#ef4444' : '#10b981'}} className={timeLeft < 60 ? "blink" : ""}>
            <FaClock style={{marginRight: '8px'}} /> {formatTime(timeLeft)}
          </div>
          <button onClick={() => setShowConfirm(true)} className="finish-btn">FINISH EXAM</button>
        </div>
      </header>

      <main style={styles.mainWrapper}>
        <div style={{ ...styles.main, gridTemplateColumns: isMobile ? "1fr" : "1fr 360px" }}>
          
          <div style={styles.quizWrapper}>
            <div className="glass-card">
              <div style={styles.qHeader}>
                <span style={styles.qBadge}>QUESTION {currentIndex + 1} OF {questions.length}</span>
                <div style={styles.pBar}>
                  <div style={{ ...styles.pFill, width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
              </div>
              
              <h2 style={styles.qText}>{currentQ.questionText || currentQ.content}</h2>
              
              <div style={styles.optionsGrid}>
                {["optionA", "optionB", "optionC", "optionD"].map((optKey, idx) => {
                  const labels = ["A", "B", "C", "D"];
                  const currentLabel = labels[idx];
                  const isSelected = answers[currentQ.id] === currentLabel;
                  return (
                    <div 
                      key={optKey} 
                      onClick={() => handleOptionClick(currentQ.id, currentLabel)}
                      className={`opt-item ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="opt-indicator">{currentLabel}</span>
                      <span style={{ fontWeight: 600 }}>{currentQ[optKey]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={styles.navAction}>
              <div style={{display:'flex', gap:'12px'}}>
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="nav-ctrl-btn">
                  <FaChevronLeft /> PREV
                </button>
                <button 
                  onClick={() => handleReviewToggle(currentQ.id)}
                  className={`nav-ctrl-btn ${markedForReview[currentQ.id] ? 'review-active' : ''}`}
                >
                  <FaEye /> REVIEW
                </button>
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <button onClick={() => currentIndex === questions.length - 1 ? setShowConfirm(true) : setCurrentIndex(prev => prev + 1)} className="nav-ctrl-btn skip-btn">SKIP</button>
                <button onClick={() => currentIndex === questions.length - 1 ? setShowConfirm(true) : setCurrentIndex(prev => prev + 1)} className="nav-ctrl-btn primary">NEXT</button>
              </div>
            </div>
          </div>

          <aside className="glass-card" style={styles.paletteArea}>
            <div style={styles.counterGrid}>
              <div style={styles.counterItem}><span className="count-num" style={{color: '#10b981'}}>{attemptedCount}</span><span className="count-label">Attempted</span></div>
              <div style={styles.counterItem}><span className="count-num" style={{color: '#f59e0b'}}>{skippedCount}</span><span className="count-label">Skipped</span></div>
            </div>
            
            <h4 style={styles.navTitle}>QUESTION PALETTE</h4>
            
            <div style={styles.legendGrid}>
              <div style={styles.legendItem}><span style={{...styles.dot, background: '#10b981'}}></span> Attempted</div>
              <div style={styles.legendItem}><span style={{...styles.dot, background: '#8b5cf6'}}></span> Reviewed</div>
              <div style={styles.legendItem}><span style={{...styles.dot, background: '#f59e0b'}}></span> Skipped</div>
              <div style={styles.legendItem}><span style={{...styles.dot, background: '#e2e8f0', border:'1px solid #ccc'}}></span> Unvisited</div>
            </div>

            <div style={styles.pGrid}>
              {questions.map((q, i) => {
                const isAns = !!answers[q.id];
                const isRev = !!markedForReview[q.id];
                const isSkip = i < currentIndex && !isAns;
                const isCurrent = currentIndex === i;

                let dotClass = "";
                if (isRev) dotClass = "review";
                else if (isAns) dotClass = "answered";
                else if (isSkip) dotClass = "skipped";

                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`p-dot ${isCurrent ? 'current' : ''} ${dotClass}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </aside>

        </div>
      </main>
      <style>{`
        .arena-viewport { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; transition: 0.3s; padding-bottom: 40px; }
        .red-alert-bg { background: #fee2e2 !important; }
        .red-overlay { position: fixed; inset: 0; background: rgba(220, 38, 38, 0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; color: white; font-size: 26px; font-weight: 900; text-align: center; padding: 40px; backdrop-filter: blur(5px); }
        .glass-card { background: #fff; border-radius: 28px; border: 1px solid #e2e8f0; padding: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.01); }
        
        .opt-item { padding: 18px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 12px; cursor: pointer; display: flex; align-items: center; gap: 15px; font-weight: 700; color: #334155; transition: 0.2s; background: #fff; width: 100%; box-sizing: border-box; }
        .opt-item:hover { background: #f8fafc; border-color: #cbd5e1; }
        .opt-item.selected { background: #eff6ff; border: 2px solid #3b82f6; color: #1e40af; }
        .opt-indicator { width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; color: #475569; display: flex; flex-shrink: 0; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; }
        .opt-item.selected .opt-indicator { background: #3b82f6; color: #fff; }
        
        .p-dot { height: 42px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-weight: 800; color: #475569; cursor: pointer; transition: 0.2s; }
        .p-dot:hover { border-color: #cbd5e1; background: #f8fafc; }
        .p-dot.answered { background: #10b981 !important; color: #fff !important; border: none !important; box-shadow: 0 4px 10px rgba(16,185,129,0.2); }
        .p-dot.review { background: #8b5cf6 !important; color: #fff !important; border: none !important; box-shadow: 0 4px 10px rgba(139,92,246,0.2); }
        .p-dot.skipped { background: #f59e0b !important; color: #fff !important; border: none !important; box-shadow: 0 4px 10px rgba(245,158,11,0.2); }
        .p-dot.current { border: 3px solid #0f172a !important; transform: scale(1.08); z-index: 5; }
        
        .nav-ctrl-btn { padding: 14px 24px; border-radius: 15px; border: 1px solid #e2e8f0; font-weight: 800; cursor: pointer; background: #fff; color: #475569; display: flex; align-items: center; gap: 8px; transition: 0.2s; height: 50px; text-transform: uppercase; font-size: 13px; }
        .nav-ctrl-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .nav-ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .nav-ctrl-btn.primary { background: #0f172a; color: #fff; border: none; padding: 14px 28px; }
        .nav-ctrl-btn.primary:hover { background: #1e293b; }
        .nav-ctrl-btn.review-active { background: #8b5cf6; color: #fff; border: none; }
        
        .skip-btn { border-color: #f59e0b; color: #d97706; }
        .skip-btn:hover { background: #fff7ed !important; }
        .finish-btn { background: #ef4444; color: #fff; border: none; padding: 12px 22px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(239,68,68,0.2); }
        .finish-btn:hover { background: #dc2626; transform: translateY(-1px); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-box { background: #fff; padding: 32px 40px; border-radius: 28px; text-align: center; width: 90% !important; maxWidth: 520px !important; box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.2); border: 1px solid #f1f5f9; box-sizing: border-box; }
        .modal-btns { display: flex; gap: 12px; margin-top: 5px; width: 100%; justify-content: center; }
        .submit-btn { flex: 1; max-width: 200px; padding: 14px; border-radius: 12px; background: #1d4ed8; color: #fff; border: none; font-weight: 800; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(29,78,216,0.2); transition: 0.2s; }
        .submit-btn:hover { background: #1e40af; transform: translateY(-1px); }
        .cancel-btn { flex: 1; max-width: 200px; padding: 14px; border-radius: 12px; background: #f1f5f9; color: #475569; border: none; font-weight: 800; cursor: pointer; font-size: 14px; transition: 0.2s; }
        .cancel-btn:hover { background: #e2e8f0; }
        
        .blink { animation: blinkAnim 1s infinite; }
        @keyframes blinkAnim { 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

const styles = {
  header: { height: '80px', background: '#fff', display: 'flex', justifyContent: 'space-between', padding: '0 4%', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', fontSize: '20px', color: '#0f172a' },
  logoBox: { background: '#3b82f6', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  roundTag: { background: '#f1f5f9', color: '#3b82f6', fontSize: '11px', padding: '5px 12px', borderRadius: '8px', marginLeft: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timerGroup: { display: 'flex', gap: '15px', alignItems: 'center' },
  timer: { fontWeight: '900', fontSize: '18px', background: '#f8fafc', padding: '10px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' },
  
  mainWrapper: { width: "100%", paddingTop: "115px", boxSizing: "border-box" },
  main: { display: 'grid', gap: '25px', padding: '0 4%', width: '100%', maxWidth: '1500px', margin: '0 auto', boxSizing: 'border-box' },
  quizWrapper: { display: 'flex', flexDirection: 'column', gap: '20px' },
  qHeader: { marginBottom: '20px' },
  qBadge: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' },
  pBar: { height: '6px', background: '#e2e8f0', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' },
  pFill: { height: '100%', background: '#3b82f6', transition: '0.4s ease' },
  qText: { fontSize: '22px', fontWeight: '900', marginBottom: '25px', color: '#0f172a', lineHeight: 1.5 },
  optionsGrid: { display: 'flex', flexDirection: 'column', width: '100%' },
  navAction: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', width: '100%' },
  paletteArea: { height: 'fit-content' },
  pGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '20px' },
  counterGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' },
  counterItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  navTitle: { fontWeight: '900', fontSize: '14px', color: '#0f172a', marginBottom: '15px', letterSpacing: '0.5px' },
  legendGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: '#64748b' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  submittingOverlay: { position: "fixed", inset: 0, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  submittingCard: { background: "#fff", padding: "35px 50px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  spinner: { width: "40px", height: "40px", border: "4px solid rgba(59,130,246,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s infinite linear" }
};

export default QuizPage;