import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  FaClock, FaLayerGroup, FaTrash, FaTimes, FaListOl, FaPlus,
  FaChevronRight, FaShieldAlt, FaRocket, FaBolt
} from "react-icons/fa";
import LoadingLoader from "../../components/LoadingLoader";

function QuizSettings() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [settings, setSettings] = useState({
    activeRound: "",
    timerMinutes: 10,
    questionLimit: 50,
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundQuestions, setRoundQuestions] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    fetchSettings();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // FIX: Paths sync with backend
      const [roundRes, timerRes, quesRes] = await Promise.all([
        API.get("/admin/questions/rounds"),
        API.get("/admin/settings/timer"),
        API.get("/admin/questions")
      ]);
      setRounds(roundRes.data || []);
      // Timer data sync
      if (timerRes.data) {
        setSettings(prev => ({
          ...prev,
          timerMinutes: timerRes.data.timerMinutes || 10,
          activeRound: timerRes.data.activeRound || "",
          questionLimit: timerRes.data.questionLimit || 50
        }));
      }
      setAllQuestions(quesRes.data || []);
    } catch (err) {
      console.error("Fetch Settings Error", err);
      if (err.response?.status === 403) {
         console.error("DEBUG: Admin credentials required.");
      }
    } finally {
      setLoading(false);
    }
  };

  const premiumAlert = {
    reverseButtons: true,
    scrollbarPadding: false,
    buttonsStyling: false,
    customClass: {
      popup: 'swal-ultra-popup',
      title: 'swal-ultra-title',
      htmlContainer: 'swal-ultra-html',
      confirmButton: 'swal-ultra-confirm',
      cancelButton: 'swal-ultra-cancel'
    }
  };

  const showToast = (msg, icon = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({ icon, title: msg });
  };

  const handleDeleteRound = async (roundName) => {
    if (roundName === settings.activeRound) {
      return Swal.fire({ 
        ...premiumAlert, 
        title: 'Action Restricted',
        text: 'You cannot delete a round that is currently LIVE.', 
        icon: 'error' 
      });
    }

    Swal.fire({
      ...premiumAlert,
      title: 'Confirm Deletion?',
      text: `Are you sure? This will permanently remove the "${roundName.toUpperCase()}" category.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Purge Round',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // FIX: Correct dynamic path[cite: 4]
          await API.delete(`/admin/questions/round/${roundName}`);
          setRounds(rounds.filter((r) => r !== roundName));
          setAllQuestions(allQuestions.filter((q) => q.category !== roundName));
          showToast('Round deleted successfully');
        } catch {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleManageClick = (roundName) => {
    setSelectedRound(roundName);
    const filtered = allQuestions.filter((q) => q.category === roundName);
    setRoundQuestions(filtered);
    setShowManageModal(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await API.delete(`/admin/questions/${questionId}`);
      setRoundQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setAllQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showToast('Question removed');
    } catch {
      showToast('Error removing item', 'error');
    }
  };

  const handleGoLive = async () => {
    try {
      // Backend expects these exact fields
      await API.post("/admin/settings/update-timer", {
        timerMinutes: Number(settings.timerMinutes),
        questionLimit: Number(settings.questionLimit),
        activeRound: selectedRound, // backend key check
      });
      setSettings({ ...settings, activeRound: selectedRound });
      setShowManageModal(false);
      Swal.fire({
        ...premiumAlert,
        title: 'System Live!',
        text: `Round ${selectedRound.toUpperCase()} has been successfully deployed.`,
        icon: 'success',
        timer: 2500,
        showConfirmButton: false
      });
    } catch {
      showToast('Deployment failed', 'error');
    }
  };

  if (loading) return <LoadingLoader message="Calibrating control center..." type="scan" />;

  return (
    <div style={{ ...styles.page, padding: isMobile ? "16px" : "40px" }}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      
      <div style={{ ...styles.header, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ zIndex: 10 }}>
          <h1 style={styles.title}>Quiz <span style={{ color: "#2563eb" }}>Control</span></h1>
          <p style={styles.subtitleText}>Manage live sessions and content distribution</p>
        </div>
        {!isMobile && (
          <div className="glass-chip" style={styles.secureBadge}>
            <FaBolt color="#f59e0b" /> Optimization Active
          </div>
        )}
      </div>

      <div style={{ ...styles.cardGrid, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {rounds.map((round, index) => {
          const isActive = settings.activeRound === round;
          const totalInRound = allQuestions.filter((q) => q.category === round).length;
          return (
            <div key={index} className="elite-card" style={{ ...styles.roundCard, border: isActive ? "2.5px solid #2563eb" : "1px solid #f1f5f9" }}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.iconBox, background: isActive ? "#2563eb" : "#eff6ff", color: isActive ? "#fff" : "#2563eb" }}>
                  <FaLayerGroup />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {isActive && <span style={styles.liveBadge}>LIVE</span>}
                  <button onClick={() => handleDeleteRound(round)} className="purge-btn" style={styles.deleteBtn}><FaTrash /></button>
                </div>
              </div>
              <h3 style={styles.roundTitle}>{round.replace("_", " ").toUpperCase()}</h3>
              <div style={styles.statsBox}> <FaListOl /> {totalInRound} Questions Pool</div>
              <button onClick={() => handleManageClick(round)} className="deploy-btn" style={styles.manageBtn}>
                Configure Round <FaChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {showManageModal && (
        <div style={styles.overlay}>
          <div className="modal-pop" style={{ ...styles.modal, width: isMobile ? "95%" : "750px" }}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedRound?.toUpperCase()}</h2>
                <p style={styles.modalSub}>Adjust timer and payload settings</p>
              </div>
              <button onClick={() => setShowManageModal(false)} style={styles.closeBtn}><FaTimes /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ ...styles.configGridModal, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                <div style={styles.configCardModal}>
                  <label style={styles.label}> <FaClock /> Session Duration (Min) </label>
                  <input type="number" value={settings.timerMinutes} onChange={(e) => setSettings({ ...settings, timerMinutes: e.target.value })} style={styles.inputModal} />
                </div>
                <div style={styles.configCardModal}>
                  <label style={styles.label}><FaListOl /> Display Limit</label>
                  <input type="number" value={settings.questionLimit} onChange={(e) => setSettings({ ...settings, questionLimit: e.target.value })} style={styles.inputModal} />
                </div>
              </div>
              <div style={styles.qHeader}>
                <h3>Assigned Content ({roundQuestions.length})</h3>
                <button onClick={() => navigate(`/admin/upload?round=${selectedRound}`)} style={styles.addBtnModal}> <FaPlus /> Add More</button>
              </div>
              <div className="custom-scroll" style={styles.questionList}>
                {roundQuestions.map((q) => (
                  <div key={q.id} className="q-item-hover" style={styles.questionCard}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.qText}>{q.content?.substring(0, 80)}...</p>
                      <span style={styles.answerText}>Answer Key: {q.correctAns}</span>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="q-del-icon" style={styles.qDelete}><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowManageModal(false)} style={styles.cancelBtn}>Discard Changes</button>
              <button onClick={handleGoLive} style={styles.liveBtn}>
                <FaRocket /> Launch Round
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .elite-card { transition: all 0.3s ease; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); }
        .elite-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05); }
        .deploy-btn:hover { background: #2563eb !important; gap: 15px; }
        .purge-btn:hover { background: #fef2f2 !important; color: #ef4444 !important; }
        .modal-pop { animation: modalScale 0.25s ease-out; }
        @keyframes modalScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.07), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.06), transparent 70%)" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "40px", alignItems: "center", position: 'relative', zIndex: 10 },
  title: { fontSize: "40px", fontWeight: "900", margin: 0, color: "#0f172a", letterSpacing: '-1.5px' },
  subtitleText: { color: "#64748b", marginTop: "8px", fontSize: "15px", fontWeight: "500" },
  secureBadge: { background: "#fff", padding: "12px 22px", borderRadius: "20px", display: "flex", gap: "10px", alignItems: "center", fontWeight: "800", border: "1px solid #f1f5f9", fontSize: '12px', color: '#1e293b' },
  cardGrid: { display: "grid", gap: "30px", position: 'relative', zIndex: 10 },
  roundCard: { borderRadius: "35px", padding: "30px", boxShadow: "0 10px 25px rgba(0,0,0,0.02)", background: '#fff' },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "15px" },
  iconBox: { width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: '22px' },
  deleteBtn: { border: "none", background: "#f8fafc", width: "42px", height: "42px", borderRadius: "14px", cursor: "pointer", color: "#cbd5e1" },
  liveBadge: { background: "#dcfce7", color: "#15803d", padding: "6px 14px", borderRadius: "99px", fontSize: "10px", fontWeight: "900" },
  roundTitle: { fontSize: "24px", fontWeight: "900", margin: '15px 0 10px 0', color: "#0f172a", letterSpacing: '-0.5px' },
  statsBox: { background: "#f8fafc", padding: "10px 18px", borderRadius: "14px", display: "inline-flex", alignItems: "center", gap: "10px", fontWeight: "700", color: "#64748b", fontSize: '14px' },
  manageBtn: { marginTop: "25px", width: "100%", border: "none", background: "#0f172a", color: "#fff", padding: "18px", borderRadius: "18px", cursor: "pointer", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 },
  modal: { background: "#fff", borderRadius: "40px", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.2)", maxHeight: "92vh", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "30px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" },
  modalTitle: { margin: 0, fontWeight: "900", fontSize: '26px' },
  modalSub: { margin: '5px 0 0 0', color: "#94a3b8", fontSize: "15px" },
  closeBtn: { border: "none", background: "#f8fafc", width: "48px", height: "48px", borderRadius: "15px", cursor: "pointer", color: '#94a3b8' },
  modalBody: { padding: "30px 40px", overflowY: "auto", flex: 1 },
  configGridModal: { display: "grid", gap: "25px" },
  configCardModal: { background: "#f8fafc", borderRadius: "24px", padding: "22px", border: "1px solid #eef2f7" },
  label: { display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: "800", color: "#94a3b8", marginBottom: "15px", textTransform: 'uppercase' },
  inputModal: { width: "100%", border: "none", background: "transparent", outline: "none", fontSize: "28px", fontWeight: "900", color: "#2563eb" },
  qHeader: { marginTop: "40px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  addBtnModal: { border: "none", background: "#eff6ff", color: "#2563eb", padding: "12px 20px", borderRadius: "14px", fontWeight: "800", cursor: "pointer" },
  questionList: { display: "flex", flexDirection: "column", gap: "15px", maxHeight: "350px", overflowY: "auto", paddingRight: '8px' },
  questionCard: { border: "1px solid #f1f5f9", borderRadius: "24px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  qText: { margin: 0, fontSize: "15px", color: "#334155", fontWeight: '500', lineHeight: 1.6 },
  answerText: { fontSize: "13px", fontWeight: "900", color: "#10b981", marginTop: '8px', display: 'block' },
  qDelete: { border: "none", background: "#fff", color: "#cbd5e1", width: "42px", height: "42px", borderRadius: "12px", cursor: "pointer" },
  modalFooter: { padding: "30px 40px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "20px" },
  cancelBtn: { border: "none", background: "#f8fafc", padding: "16px 30px", borderRadius: "16px", fontWeight: "800", cursor: "pointer", color: '#64748b' },
  liveBtn: { border: "none", background: "#2563eb", color: "#fff", padding: "16px 35px", borderRadius: "16px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center" },
};

export default QuizSettings;