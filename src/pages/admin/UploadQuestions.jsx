import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaClock, FaLayerGroup, FaPlus, FaCloudUploadAlt, FaBrain, FaTimes,
  FaFileExcel, FaSave, FaRobot, FaDownload, FaInfoCircle, FaTrash
} from "react-icons/fa";
import LoadingLoader from "../../components/LoadingLoader";

function UploadQuestions() {
  const [activeTab, setActiveTab] = useState("excel");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState("");
  const [isAddingNewRound, setIsAddingNewRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [quizTimer, setQuizTimer] = useState(10);
  const [questionLimit, setQuestionLimit] = useState(50);
  const [excelPreview, setExcelPreview] = useState([]);
  const [aiConfig, setAiConfig] = useState({ topic: "", count: 5, difficulty: "Medium" });
  const [aiPreview, setAiPreview] = useState([]);
  const [manualData, setManualData] = useState({
    content: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAns: "A",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    loadInitialData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [roundsRes, timerRes] = await Promise.all([
        API.get("/admin/questions/rounds"),
        API.get("/admin/settings/timer"),
      ]);
      if (roundsRes.data?.length > 0) {
        setAvailableRounds(roundsRes.data);
        setSelectedRound(roundsRes.data[0]);
      }
      if (timerRes.data) {
        setQuizTimer(timerRes.data.timerMinutes || 10);
        setQuestionLimit(timerRes.data.questionLimit || 50);
      }
    } catch (err) {
      console.error("Initial Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, icon = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      customClass: { popup: 'swal-premium-toast' }
    });
    Toast.fire({ icon, title: msg });
  };

  // 1. UPDATE GLOBAL SETTINGS (Timer & Limit)
  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
      await API.post("/admin/settings/update-timer", {
        timerMinutes: quizTimer,
        questionLimit: questionLimit,
        roundName: target || "Normal Quiz"
      });
      showToast("System Config Updated!");
      loadInitialData();
    } catch (err) {
      showToast("Update Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. EXCEL UPLOAD LOGIC (Fixed FormData issue)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile); // File state set ho rahi hai

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setExcelPreview(data);
        showToast(`Staged ${data.length} questions`, 'info');
      } catch (err) {
        showToast("Invalid Excel structure", "error");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleExcelUpload = async () => {
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    if (!file || !target) return showToast('File or Round missing!', 'warning');

    const formData = new FormData();
    formData.append("file", file); // Correctly appending the file object
    formData.append("round", target);

    try {
      setLoading(true);
      await API.post("/admin/questions/upload-excel", formData);
      showToast('Bulk Sync Complete!');
      setFile(null);
      setExcelPreview([]);
      loadInitialData();
    } catch (err) {
      showToast('Upload failed (Check 403)', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    try {
      setLoading(true);
      await API.post("/admin/questions/add", { ...manualData, category: target });
      showToast('Question Saved!');
      setManualData({ content: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAns: "A" });
      loadInitialData();
    } catch (err) { showToast('Failed to save', 'error'); }
    finally { setLoading(false); }
  };

  const downloadTemplate = () => {
    const templateData = [{
      content: "Example Question?", optionA: "Opt 1", optionB: "Opt 2", optionC: "Opt 3", optionD: "Opt 4", correctAns: "A"
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuizTemplate");
    XLSX.writeFile(wb, "QuizHub_Template.xlsx");
    showToast("Template Downloaded!");
  };

  if (loading) return <LoadingLoader message="Syncing Question Hub..." type="scan" />;

  return (
    <div style={styles.page}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
        
        <div style={styles.header}>
          <h1 style={styles.title}>Upload <span style={{ color: "#2563eb" }}>Hub</span></h1>
          <p style={styles.subtitleText}>Architecting {availableRounds.length} Active Quiz Segments</p>
        </div>

        {/* --- Config Section --- */}
        <div style={{ ...styles.configGrid, gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr" }}>
          <div className="glass-card" style={styles.configCard}>
            <div style={styles.cardTop}>
              <div style={styles.cardTitle}><FaLayerGroup color="#2563eb" /> Active Target</div>
              <button onClick={() => setIsAddingNewRound(!isAddingNewRound)} style={styles.iconBtn}>
                {isAddingNewRound ? <FaTimes /> : <FaPlus />}
              </button>
            </div>
            {!isAddingNewRound ? (
              <select value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)} style={styles.select}>
                {availableRounds.map((rnd, i) => (<option key={i} value={rnd}>{rnd.toUpperCase()}</option>))}
              </select>
            ) : (
              <input type="text" placeholder="Naming New Round..." value={newRoundName} onChange={(e) => setNewRoundName(e.target.value)} style={styles.input} />
            )}
          </div>

          <div className="glass-card" style={styles.configCard}>
            <div style={styles.cardTitle}><FaClock color="#f59e0b" /> System Config</div>
            <div style={styles.timerRow}>
              <div style={{flex: 1}}>
                 <label style={styles.miniLabel}>Mins</label>
                 <input type="number" value={quizTimer} onChange={(e) => setQuizTimer(e.target.value)} style={styles.timerInput} />
              </div>
              <div style={{flex: 1}}>
                 <label style={styles.miniLabel}>Limit</label>
                 <input type="number" value={questionLimit} onChange={(e) => setQuestionLimit(e.target.value)} style={styles.timerInput} />
              </div>
              <button onClick={handleUpdateSettings} style={styles.timerBtn}>Update</button>
            </div>
          </div>
        </div>

        {/* --- Tabs --- */}
        <div style={{ ...styles.tabs, flexDirection: isMobile ? "column" : "row" }}>
          <button onClick={() => setActiveTab("excel")} style={{...styles.tabBtn, background: activeTab === "excel" ? "#2563eb" : "#fff", color: activeTab === "excel" ? "#fff" : "#64748b"}}>
            <FaFileExcel /> Excel Bulk
          </button>
          <button onClick={() => setActiveTab("manual")} style={{...styles.tabBtn, background: activeTab === "manual" ? "#2563eb" : "#fff", color: activeTab === "manual" ? "#fff" : "#64748b"}}>
            <FaPlus /> Manual Entry
          </button>
        </div>

        {/* --- Main Panel --- */}
        <div className="main-panel-glass" style={styles.mainCard}>
          {activeTab === "excel" && (
            <div>
              <div style={styles.formatInfo}>
                <div style={styles.formatHeader}><FaInfoCircle color="#059669" /><span style={{ fontWeight: '800' }}> Expected Format</span></div>
                <p style={styles.formatText}>Columns: content, optionA, optionB, optionC, optionD, correctAns</p>
                <button onClick={downloadTemplate} style={styles.downloadBtn}><FaDownload /> Get Template</button>
              </div>
              <div className="dropzone" onClick={() => document.getElementById('exFile').click()} style={styles.dropZone}>
                <FaCloudUploadAlt size={50} color="#2563eb" />
                <h3 style={styles.dropTitle}>Drop .xlsx file here</h3>
                <input id="exFile" type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{display: 'none'}} />
              </div>
              {excelPreview.length > 0 && (
                <div style={styles.previewBox}>
                  <div className="custom-scroll" style={styles.previewScroll}>
                    <table style={styles.table}>
                      <tbody>{excelPreview.map((r, i) => (
                        <tr key={i}><td style={styles.td}>{r.content?.substring(0, 50)}...</td><td style={styles.td}><span style={styles.keyBadge}>{r.correctAns}</span></td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button onClick={handleExcelUpload} style={styles.primaryBtn}>Initiate Bulk Sync</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit}>
              <textarea placeholder="Question content..." value={manualData.content} onChange={(e) => setManualData({ ...manualData, content: e.target.value })} style={styles.textarea} required />
              <div style={styles.optionGrid}>
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt} style={styles.manualOptWrap}>
                    <span style={styles.optLabel}>{opt}</span>
                    <input placeholder={`Option ${opt}`} value={manualData[`option${opt}`]} onChange={(e) => setManualData({ ...manualData, [`option${opt}`]: e.target.value })} style={styles.input} required />
                  </div>
                ))}
              </div>
              <button type="submit" style={styles.primaryBtn}><FaSave /> Save Question</button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        .glass-card:hover { transform: translateY(-5px); border-color: #2563eb !important; }
        .dropzone:hover { background: #f0f7ff !important; border-color: #2563eb !important; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.07), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.05), transparent 70%)" },
  container: { maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 10 },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "40px", fontWeight: "900", color: "#0f172a" },
  subtitleText: { color: "#64748b", fontWeight: "600" },
  configGrid: { display: "grid", gap: "20px", marginBottom: "35px" },
  configCard: { background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #f1f5f9" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "center" },
  cardTitle: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", color: "#1e293b" },
  iconBtn: { width: "38px", height: "38px", borderRadius: "10px", border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer" },
  input: { width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", outline: "none" },
  select: { width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", background: '#fff' },
  timerRow: { display: "flex", gap: "12px", marginTop: "10px", alignItems: 'flex-end' },
  miniLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginLeft: '5px' },
  timerInput: { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: '900' },
  timerBtn: { padding: "14px 20px", border: "none", background: "#0f172a", color: "#fff", borderRadius: "14px", cursor: "pointer", fontWeight: "800" },
  tabs: { display: "flex", gap: "15px", marginBottom: "35px" },
  tabBtn: { flex: 1, padding: "16px", borderRadius: "18px", border: "1px solid #e2e8f0", fontWeight: "800", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  mainCard: { background: "#fff", borderRadius: "32px", padding: "30px", border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" },
  formatInfo: { background: "#f0fdf4", padding: "15px", borderRadius: "15px", marginBottom: "20px" },
  formatHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' },
  formatText: { fontSize: '12px', color: '#065f46' },
  downloadBtn: { background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', marginTop: '10px' },
  dropZone: { border: "2px dashed #dbeafe", borderRadius: "20px", padding: "40px", textAlign: "center", background: "#f8fafc", cursor: 'pointer' },
  dropTitle: { marginTop: "10px", fontWeight: "800" },
  previewScroll: { maxHeight: "250px", overflowY: "auto", marginTop: '20px' },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" },
  keyBadge: { background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: "5px", fontWeight: '900' },
  primaryBtn: { width: "100%", marginTop: "20px", padding: "18px", borderRadius: "16px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "800", cursor: "pointer" },
  textarea: { width: "100%", minHeight: "120px", padding: "15px", borderRadius: "15px", border: "1px solid #e2e8f0", marginBottom: '15px' },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  manualOptWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  optLabel: { width: '30px', height: '30px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }
};

export default UploadQuestions;