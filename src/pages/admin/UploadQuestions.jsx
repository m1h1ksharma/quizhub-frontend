import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaClock, FaLayerGroup, FaPlus, FaCloudUploadAlt, FaMagic, FaTimes,
  FaFileExcel, FaSave, FaDownload, FaInfoCircle, FaTrash, FaCheckCircle
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
      if (roundsRes.data) {
        setAvailableRounds(roundsRes.data);
        setSelectedRound(roundsRes.data[0] || "Normal Quiz");
      }
      if (timerRes.data) {
        setQuizTimer(timerRes.data.timerMinutes || 10);
        setQuestionLimit(timerRes.data.questionLimit || 50);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const showToast = (msg, icon = 'success') => {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2500,
      icon,
      title: msg,
      background: '#fff',
      color: '#1e293b',
      timerProgressBar: true,
    });
  };

  const handleExcelUpload = async () => {
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    if (!file || !target) return showToast('Details missing!', 'warning');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("round", target);
    try {
      setLoading(true);
      await API.post("/admin/questions/upload-excel", formData);
      showToast('Bulk Sync Complete!');
      setFile(null); setExcelPreview([]);
      loadInitialData();
    } catch (err) { showToast('Upload Failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleAIGenerate = async () => {
    if (!aiConfig.topic) return showToast("Topic required", "warning");
    try {
      setLoading(true);
      const res = await API.post("/admin/questions/ai-generate", aiConfig);
      const questions = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setAiPreview(questions);
      showToast("AI Synthesis Ready!", "success");
    } catch (err) { showToast("AI Error", "error"); }
    finally { setLoading(false); }
  };

  const saveAiQuestions = async () => {
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    const finalQuestions = aiPreview.map(q => ({ ...q, category: target }));
    try {
      setLoading(true);
      await API.post("/admin/questions/ai-save-bulk", finalQuestions);
      showToast("AI Assets Committed!");
      setAiPreview([]);
    } catch (err) { showToast("Commit Failed", "error"); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingLoader message="Syncing Quiz Hub..." type="scan" />;

  return (
    <div style={styles.page}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      
      <div style={{ ...styles.container, padding: isMobile ? "15px" : "40px" }}>
        <header style={styles.header}>
          <h1 style={styles.title}>Upload <span style={{ color: "#2563eb" }}>Hub</span></h1>
          <p style={styles.subtitle}>Architecting {availableRounds.length} Active Quiz Segments</p>
        </header>

        {/* Config Cards */}
        <div style={{ ...styles.configGrid, gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr" }}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.cardLabel}><FaLayerGroup color="#2563eb" /> Active Target</span>
              <button onClick={() => setIsAddingNewRound(!isAddingNewRound)} style={styles.toggleBtn}>
                {isAddingNewRound ? <FaTimes /> : <FaPlus />}
              </button>
            </div>
            {!isAddingNewRound ? (
              <select value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)} style={styles.select}>
                {availableRounds.map((r, i) => <option key={i} value={r}>{r.toUpperCase()}</option>)}
              </select>
            ) : (
              <input placeholder="Naming New Round..." value={newRoundName} onChange={(e) => setNewRoundName(e.target.value)} style={styles.input} />
            )}
          </div>

          <div className="glass-card" style={styles.card}>
            <span style={styles.cardLabel}><FaClock color="#f59e0b" /> System Config</span>
            <div style={styles.timerRow}>
              <input type="number" value={quizTimer} onChange={(e) => setQuizTimer(e.target.value)} style={styles.timerInput} title="Minutes" />
              <input type="number" value={questionLimit} onChange={(e) => setQuestionLimit(e.target.value)} style={styles.timerInput} title="Limit" />
              <button onClick={() => showToast("Settings Staged", "info")} style={styles.applyBtn}>Apply</button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabs}>
          <button onClick={() => setActiveTab("excel")} style={{...styles.tabBtn, background: activeTab === "excel" ? "#2563eb" : "#fff", color: activeTab === "excel" ? "#fff" : "#64748b"}}>
            <FaFileExcel /> Excel Bulk
          </button>
          <button onClick={() => setActiveTab("manual")} style={{...styles.tabBtn, background: activeTab === "manual" ? "#2563eb" : "#fff", color: activeTab === "manual" ? "#fff" : "#64748b"}}>
            <FaPlus /> Manual Entry
          </button>
          <button onClick={() => setActiveTab("ai")} style={{...styles.tabBtn, background: activeTab === "ai" ? "#2563eb" : "#fff", color: activeTab === "ai" ? "#fff" : "#64748b"}}>
            <FaMagic /> AI Synth
          </button>
        </div>

        {/* Main Panel Area */}
        <div className="main-panel-glass" style={styles.mainPanel}>
          {activeTab === "excel" && (
            <div>
              <div style={styles.formatBox}>
                <FaInfoCircle color="#059669" /> <span>Required Columns: content, optionA, optionB, optionC, optionD, correctAns</span>
              </div>
              <div style={styles.dropZone} onClick={() => document.getElementById('exFile').click()}>
                <FaCloudUploadAlt size={50} color="#2563eb" />
                <h3 style={{ margin: "10px 0" }}>{file ? file.name : "Drop .xlsx file here"}</h3>
                <input id="exFile" type="file" hidden onChange={(e) => {
                  const f = e.target.files[0];
                  setFile(f);
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: "binary" }).Sheets[XLSX.read(evt.target.result, { type: "binary" }).SheetNames[0]]);
                    setExcelPreview(data);
                  };
                  reader.readAsBinaryString(f);
                }} />
              </div>
              {excelPreview.length > 0 && (
                <div style={styles.previewContainer}>
                  <div style={styles.previewScroll}>
                    <table style={styles.table}>
                      <tbody>{excelPreview.map((r, i) => (
                        <tr key={i}><td style={styles.td}>{r.content?.substring(0, 60)}...</td><td style={styles.td}><span style={styles.badge}>{r.correctAns}</span></td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button onClick={handleExcelUpload} style={styles.primaryBtn}>Initiate Bulk Sync ({excelPreview.length})</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <form style={styles.form}>
              <textarea placeholder="Write your question here..." style={styles.textarea} value={manualData.content} onChange={(e) => setManualData({...manualData, content: e.target.value})} />
              <div style={styles.optionGrid}>
                {["A", "B", "C", "D"].map(opt => (
                  <div key={opt} style={styles.optInputWrap}>
                    <span style={styles.optPrefix}>{opt}</span>
                    <input placeholder={`Option ${opt}`} style={styles.optInput} value={manualData[`option${opt}`]} onChange={(e) => setManualData({...manualData, [`option${opt}`]: e.target.value})} />
                  </div>
                ))}
              </div>
              <select style={styles.select} value={manualData.correctAns} onChange={(e) => setManualData({...manualData, correctAns: e.target.value})}>
                <option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option>
              </select>
              <button style={styles.primaryBtn}><FaSave /> Save to Question Bank</button>
            </form>
          )}

          {activeTab === "ai" && (
            <div>
              <div style={styles.aiHeader}>
                <FaMagic color="#8b5cf6" /> <span>AI Synthesis Engine</span>
              </div>
              <div style={styles.aiConfigRow}>
                <input placeholder="Topic (e.g. Java Streams, History)" style={styles.input} value={aiConfig.topic} onChange={(e) => setAiConfig({...aiConfig, topic: e.target.value})} />
                <select style={styles.select} value={aiConfig.difficulty} onChange={(e) => setAiConfig({...aiConfig, difficulty: e.target.value})}>
                  <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                </select>
                <input type="number" style={{...styles.timerInput, width: '80px'}} value={aiConfig.count} onChange={(e) => setAiConfig({...aiConfig, count: e.target.value})} />
              </div>
              <button onClick={handleAIGenerate} style={styles.aiBtn}>Generate Questions</button>
              
              {aiPreview.length > 0 && (
                <div style={{ marginTop: '25px' }}>
                  <div style={styles.previewScroll}>
                    {aiPreview.map((q, idx) => (
                      <div key={idx} style={styles.aiItem}>
                        <strong>Q{idx+1}:</strong> {q.content}
                      </div>
                    ))}
                  </div>
                  <button onClick={saveAiQuestions} style={styles.primaryBtn}>Commit AI Questions</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.8) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3) !important; transition: all 0.3s ease; }
        .glass-card:hover { transform: translateY(-5px); border-color: #2563eb !important; }
        .main-panel-glass { background: #fff; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent)", borderRadius: "50%" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent)", borderRadius: "50%" },
  container: { maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 10 },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "42px", fontWeight: "900", color: "#0f172a", marginBottom: "10px" },
  subtitle: { color: "#64748b", fontWeight: "600", letterSpacing: "0.5px" },
  configGrid: { display: "grid", gap: "25px", marginBottom: "35px" },
  card: { padding: "25px", borderRadius: "24px" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  cardLabel: { fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" },
  toggleBtn: { width: "35px", height: "35px", borderRadius: "10px", border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer" },
  select: { width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", outline: "none", background: "#fff", fontWeight: "600" },
  input: { width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", outline: "none" },
  timerRow: { display: "flex", gap: "12px", marginTop: "15px" },
  timerInput: { width: "100%", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "800" },
  applyBtn: { padding: "0 25px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" },
  tabs: { display: "flex", gap: "15px", marginBottom: "35px" },
  tabBtn: { flex: 1, padding: "16px", borderRadius: "18px", border: "1px solid #e2e8f0", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  mainPanel: { padding: "40px" },
  formatBox: { background: "#f0fdf4", padding: "15px", borderRadius: "15px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px", color: "#16a34a", fontSize: "14px", fontWeight: "600" },
  dropZone: { border: "2px dashed #dbeafe", borderRadius: "25px", padding: "50px", textAlign: "center", background: "#f8fafc", cursor: "pointer", transition: "all 0.3s ease" },
  previewScroll: { maxHeight: "300px", overflowY: "auto", margin: "20px 0", border: "1px solid #f1f5f9", borderRadius: "15px" },
  table: { width: "100%", borderCollapse: "collapse" },
  td: { padding: "12px 20px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#475569" },
  badge: { background: "#dbeafe", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontWeight: "800" },
  primaryBtn: { width: "100%", padding: "18px", borderRadius: "16px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "800", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  textarea: { width: "100%", minHeight: "120px", padding: "18px", borderRadius: "18px", border: "1px solid #e2e8f0", marginBottom: "20px", fontSize: "15px", resize: "none" },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
  optInputWrap: { display: "flex", alignItems: "center", gap: "10px" },
  optPrefix: { width: "35px", height: "35px", background: "#f1f5f9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "#64748b" },
  optInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" },
  aiHeader: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", fontSize: "18px", marginBottom: "20px", color: "#8b5cf6" },
  aiConfigRow: { display: "flex", gap: "15px", marginBottom: "20px" },
  aiBtn: { width: "100%", padding: "15px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", fontWeight: "800", cursor: "pointer" },
  aiItem: { padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" }
};

export default UploadQuestions;