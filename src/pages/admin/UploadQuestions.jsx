import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaClock, FaLayerGroup, FaPlus, FaCloudUploadAlt, FaBrain, FaTimes,
  FaFileExcel, FaSave, FaRobot, FaDownload, FaInfoCircle
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
    } catch (err) {
      console.error("Initial Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, icon = 'success') => {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2500,
      icon,
      title: msg,
      timerProgressBar: true,
      customClass: { popup: 'swal-premium-toast' }
    });
  };

  const downloadTemplate = () => {
    const templateData = [{
      content: "Example Question?", optionA: "Opt 1", optionB: "Opt 2",
      optionC: "Opt 3", optionD: "Opt 4", correctAns: "A"
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuizTemplate");
    XLSX.writeFile(wb, "QuizHub_Template.xlsx");
    showToast("Template Downloaded!");
  };

  const getTargetCategory = () => isAddingNewRound ? newRoundName.trim() : selectedRound;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setExcelPreview(data);
        showToast(`Staged ${data.length} questions`, 'info');
      } catch (err) {
        showToast('Invalid Excel structure', 'error');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleExcelUpload = async () => {
    const target = getTargetCategory();
    if (!target || !file) return showToast('Select file and round', 'warning');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("round", target);
    try {
      setLoading(true);
      await API.post("/admin/questions/upload-excel", formData);
      showToast('Bulk upload successful!');
      setExcelPreview([]);
      setFile(null);
      loadInitialData();
    } catch (err) { showToast('Upload failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleAIGenerate = async () => {
    if (!aiConfig.topic) return showToast('Enter a topic', 'warning');
    setLoading(true);
    try {
      const res = await API.post("/admin/questions/ai-generate", aiConfig);
      let data = res.data;
      if (typeof data === "string") data = JSON.parse(data.replace(/```json/g, "").replace(/```/g, "").trim());
      setAiPreview(Array.isArray(data) ? data : data.questions || []);
      showToast('AI Synthesis complete');
    } catch (err) { showToast('AI Engine Error', 'error'); }
    finally { setLoading(false); }
  };

  const handleAISave = async () => {
    const target = getTargetCategory();
    if (!target || aiPreview.length === 0) return showToast('No data to save', 'warning');
    setLoading(true);
    try {
      const finalData = aiPreview.map(q => ({ ...q, category: target }));
      await API.post("/admin/questions/ai-save-bulk", finalData);
      showToast('AI Assets committed');
      setAiPreview([]);
      loadInitialData();
    } catch (err) { showToast('Cloud sync failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const target = getTargetCategory();
    setLoading(true);
    try {
      await API.post("/admin/questions/add", { ...manualData, category: target });
      showToast('Asset Archived');
      setManualData({ content: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAns: "A" });
      loadInitialData();
    } catch (err) { showToast('Add failed', 'error'); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingLoader message="Syncing Question Hub..." type="scan" />;

  return (
    <div style={styles.page}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>Upload <span style={{ color: "#2563eb" }}>Hub</span></h1>
          <p style={styles.subtitleText}>Architecting {availableRounds.length} Active Quiz Segments</p>
        </div>

        {/* CONFIG SECTION */}
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
                {availableRounds.map((rnd, i) => <option key={i} value={rnd}>{rnd.toUpperCase()}</option>)}
              </select>
            ) : (
              <input placeholder="Naming New Round..." value={newRoundName} onChange={(e) => setNewRoundName(e.target.value)} style={styles.input} />
            )}
          </div>

          <div className="glass-card" style={styles.configCard}>
            <div style={styles.cardTitle}><FaClock color="#f59e0b" /> Global Timer</div>
            <div style={styles.timerRow}>
              <input type="number" value={quizTimer} onChange={(e) => setQuizTimer(e.target.value)} style={styles.timerInput} />
              <button style={styles.timerBtn} onClick={() => showToast("Timer Staged", "info")}>Update</button>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{ ...styles.tabs, flexDirection: isMobile ? "column" : "row" }}>
          {[
            { key: "excel", label: "Excel Bulk", icon: <FaFileExcel /> },
            { key: "manual", label: "Manual Entry", icon: <FaPlus /> },
            { key: "ai", label: "AI Synth", icon: <FaRobot /> }
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} 
              style={{
                ...styles.tabBtn,
                background: activeTab === tab.key ? "#2563eb" : "#fff",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                borderColor: activeTab === tab.key ? "#2563eb" : "#e2e8f0",
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-panel-glass" style={styles.mainCard}>
          {activeTab === "excel" && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={styles.formatInfo}>
                <div style={styles.formatHeader}>
                  <FaInfoCircle color="#059669" />
                  <span style={{ fontWeight: '800', color: '#065f46' }}> Expected Excel Structure</span>
                </div>
                <p style={styles.formatText}>Columns: content, optionA, optionB, optionC, optionD, correctAns (A/B/C/D)</p>
                <button onClick={downloadTemplate} style={styles.downloadBtn}><FaDownload /> Download Template</button>
              </div>
              <div className="dropzone" style={styles.dropZone} onClick={() => document.querySelector('input[type="file"]').click()}>
                <FaCloudUploadAlt size={50} color="#2563eb" />
                <h3 style={styles.dropTitle}>Dynamic Data Ingestion</h3>
                <p style={styles.dropText}>Click to browse or drop .xlsx assets</p>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              {excelPreview.length > 0 && (
                <div style={styles.previewBox}>
                  <div style={styles.previewHeader}><FaFileExcel color="#10b381" /> Staged Records: {excelPreview.length}</div>
                  <div className="custom-scroll" style={styles.previewScroll}>
                    <table style={styles.table}>
                      <thead><tr><th style={styles.th}>Question</th><th style={styles.th}>Key</th></tr></thead>
                      <tbody>
                        {excelPreview.map((r, i) => (
                          <tr key={i}>
                            <td style={styles.td}>{r.content?.substring(0, 60)}...</td>
                            <td style={styles.td}><span style={styles.keyBadge}>{r.correctAns}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={handleExcelUpload} style={styles.primaryBtn}>Initiate Bulk Sync</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "ai" && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={styles.aiHeader}>
                <FaBrain size={28} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontWeight: '900' }}>AI Core</h3>
              </div>
              <input placeholder="Enter topic (e.g. Core Java)" value={aiConfig.topic} onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })} style={styles.input} />
              <div style={styles.aiGrid}>
                <input type="number" value={aiConfig.count} onChange={(e) => setAiConfig({ ...aiConfig, count: e.target.value })} style={styles.input} />
                <select value={aiConfig.difficulty} onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })} style={styles.select}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <button onClick={handleAIGenerate} style={styles.aiBtn}>Synthesize AI Content</button>
              {aiPreview.length > 0 && (
                <div style={{ marginTop: '25px' }}>
                  <div className="custom-scroll" style={styles.previewScroll}>
                    {aiPreview.map((q, i) => (<div key={i} style={styles.aiItem}><strong>{i + 1}.</strong> {q.content}</div>))}
                  </div>
                  <button onClick={handleAISave} style={styles.primaryBtn}>Commit AI Assets</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} style={{ animation: 'fadeIn 0.4s ease' }}>
              <textarea placeholder="Write question content..." value={manualData.content} onChange={(e) => setManualData({ ...manualData, content: e.target.value })} style={styles.textarea} required />
              <div style={{ ...styles.optionGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt} style={styles.manualOptWrap}>
                    <span style={styles.optLabel}>{opt}</span>
                    <input placeholder={`Option ${opt} detail`} value={manualData[`option${opt}`]} onChange={(e) => setManualData({ ...manualData, [`option${opt}`]: e.target.value })} style={styles.input} required />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <select value={manualData.correctAns} onChange={(e) => setManualData({ ...manualData, correctAns: e.target.value })} style={{ ...styles.select, flex: 1 }}>
                  <option value="A">Choice: A</option>
                  <option value="B">Choice: B</option>
                  <option value="C">Choice: C</option>
                  <option value="D">Choice: D</option>
                </select>
                <button type="submit" style={{ ...styles.primaryBtn, flex: 1, marginTop: 0 }}>
                  <FaSave /> Save Asset
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .glass-card:hover { transform: translateY(-5px); border-color: #2563eb !important; box-shadow: 0 15px 30px rgba(15,23,42,0.05) !important; }
        .glass-card { transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-radius: 28px; padding: 24px; border: 1px solid #f1f5f9; }
        .dropzone:hover { border-color: #2563eb !important; background: #f0f7ff !important; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 10px; }
        .swal-premium-toast { border-radius: 15px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(10px) !important; border: 1px solid #e2e8f0 !important; }
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
  title: { fontSize: "40px", fontWeight: "900", color: "#0f172a", letterSpacing: '-1.5px' },
  subtitleText: { color: "#64748b", fontWeight: "600", fontSize: '14px' },
  configGrid: { display: "grid", gap: "20px", marginBottom: "35px" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "center" },
  cardTitle: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", color: "#1e293b", fontSize: '15px' },
  iconBtn: { width: "38px", height: "38px", borderRadius: "10px", border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer" },
  input: { width: "100%", padding: "14px 18px", borderRadius: "14px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", color: '#1e293b', fontWeight: '600' },
  select: { width: "100%", padding: "14px 18px", borderRadius: "14px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontWeight: '800', background: '#fff' },
  timerRow: { display: "flex", gap: "12px", marginTop: "15px" },
  timerInput: { width: "85px", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: '900', fontSize: '16px' },
  timerBtn: { padding: "14px 20px", border: "none", background: "#0f172a", color: "#fff", borderRadius: "14px", cursor: "pointer", fontWeight: "800" },
  tabs: { display: "flex", gap: "15px", marginBottom: "35px" },
  tabBtn: { flex: 1, padding: "16px", borderRadius: "18px", border: "1px solid", fontWeight: "800", cursor: "pointer", transition: "0.3s", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  mainCard: { background: "#ffffffcc", backdropFilter: 'blur(20px)', borderRadius: "32px", padding: "30px", border: "1px solid #f1f5f9", boxShadow: "0 20px 40px rgba(0,0,0,0.03)" },
  formatInfo: { background: "#f0fdf4", padding: "20px", borderRadius: "20px", marginBottom: "25px", border: "1px solid #dcfce7" },
  formatHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  formatText: { fontSize: '13px', color: '#065f46', margin: '0 0 15px 0', lineHeight: '1.5' },
  downloadBtn: { background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  dropZone: { border: "2px dashed #dbeafe", borderRadius: "24px", padding: "45px 20px", textAlign: "center", background: "#f8fafc", cursor: 'pointer' },
  dropTitle: { marginTop: "15px", fontWeight: "900", color: "#0f172a", fontSize: '18px' },
  dropText: { fontSize: "13px", color: "#64748b" },
  previewBox: { marginTop: "30px" },
  previewHeader: { marginBottom: "15px", fontWeight: "800", color: "#0f172a", fontSize: '15px' },
  previewScroll: { maxHeight: "280px", overflowY: "auto", borderRadius: "20px", border: "1px solid #f1f5f9", padding: "15px", background: "#f8fafc" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", paddingBottom: "12px", fontSize: "11px", color: "#94a3b8", textTransform: 'uppercase' },
  td: { padding: "12px 0", borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: '#334155', fontWeight: '500' },
  keyBadge: { background: "#f0fdf4", color: "#16a34a", padding: "4px 10px", borderRadius: "6px", fontWeight: '900', fontSize: '12px' },
  primaryBtn: { width: "100%", marginTop: "20px", padding: "18px", borderRadius: "16px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "800", cursor: "pointer" },
  aiHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  aiBtn: { width: "100%", marginTop: "18px", padding: "18px", borderRadius: "16px", border: "none", background: "linear-gradient(90deg, #8b5cf6, #6d28d9)", color: "#fff", fontWeight: "800", cursor: "pointer" },
  aiGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" },
  aiItem: { padding: "15px 10px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: '#1e293b', fontWeight: '500' },
  textarea: { width: "100%", minHeight: "140px", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", fontWeight: '500', resize: "vertical", fontFamily: "inherit" },
  manualOptWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  optLabel: { width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#64748b' },
  optionGrid: { display: "grid", gap: "15px", marginTop: "20px" },
};

export default UploadQuestions;