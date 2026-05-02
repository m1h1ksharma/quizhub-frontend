import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaClock, FaLayerGroup, FaPlus, FaCloudUploadAlt, FaBrain, FaTimes,
  FaFileExcel, FaSave, FaDownload, FaInfoCircle, FaTrash, FaMagic
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
  
  // Data States
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
      console.error("Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, icon = 'success') => {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      icon,
      title: msg,
      timerProgressBar: true,
    });
  };

  // --- 1. SETTINGS UPDATE ---
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
      setIsAddingNewRound(false);
      loadInitialData();
    } catch (err) {
      showToast("Update Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EXCEL LOGIC ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setExcelPreview(data);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleExcelUpload = async () => {
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    if (!file || !target) return showToast('File or Round missing!', 'warning');
    const formData = new FormData();
    formData.append("file", file);
    formData.append("round", target);
    try {
      setLoading(true);
      await API.post("/admin/questions/upload-excel", formData);
      showToast('Bulk Sync Complete!');
      setFile(null);
      setExcelPreview([]);
      loadInitialData();
    } catch (err) { showToast('Upload failed', 'error'); }
    finally { setLoading(false); }
  };

  // --- 3. MANUAL LOGIC ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    try {
      setLoading(true);
      await API.post("/admin/questions/add", { ...manualData, category: target });
      showToast('Question Saved!');
      setManualData({ content: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAns: "A" });
    } catch (err) { showToast('Save failed', 'error'); }
    finally { setLoading(false); }
  };

  // --- 4. AI LOGIC ---
  const handleAIGenerate = async () => {
    if (!aiConfig.topic) return showToast("Topic is required", "warning");
    try {
      setLoading(true);
      const res = await API.post("/admin/questions/ai-generate", aiConfig);
      // AI response is raw string, we parse it
      const questions = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setAiPreview(questions);
      showToast("AI Synthesis Ready!");
    } catch (err) {
      showToast("AI Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveAiQuestions = async () => {
    const target = isAddingNewRound ? newRoundName.trim() : selectedRound;
    const finalQuestions = aiPreview.map(q => ({ ...q, category: target }));
    try {
      setLoading(true);
      await API.post("/admin/questions/ai-save-bulk", finalQuestions);
      showToast("AI Questions Committed!");
      setAiPreview([]);
    } catch (err) { showToast("Save failed", "error"); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingLoader message="Processing Quiz Assets..." />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Upload <span style={{ color: "#2563eb" }}>Center</span></h1>
          <p>Manage Excel, Manual, and AI Generated Questions</p>
        </div>

        {/* --- Config Section --- */}
        <div style={styles.configGrid}>
          <div style={styles.glassCard}>
            <div style={styles.cardHeader}>
              <span><FaLayerGroup color="#2563eb" /> Select Round</span>
              <button onClick={() => setIsAddingNewRound(!isAddingNewRound)} style={styles.smallBtn}>
                {isAddingNewRound ? <FaTimes /> : <FaPlus />}
              </button>
            </div>
            {!isAddingNewRound ? (
              <select value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)} style={styles.input}>
                {availableRounds.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>
            ) : (
              <input placeholder="New Round Name..." value={newRoundName} onChange={(e) => setNewRoundName(e.target.value)} style={styles.input} />
            )}
          </div>

          <div style={styles.glassCard}>
            <span><FaClock color="#f59e0b" /> Settings</span>
            <div style={styles.timerRow}>
              <input type="number" value={quizTimer} onChange={(e) => setQuizTimer(e.target.value)} style={styles.miniInput} title="Minutes" />
              <input type="number" value={questionLimit} onChange={(e) => setQuestionLimit(e.target.value)} style={styles.miniInput} title="Limit" />
              <button onClick={handleUpdateSettings} style={styles.saveBtn}>Apply</button>
            </div>
          </div>
        </div>

        {/* --- Tabs --- */}
        <div style={styles.tabs}>
          <button onClick={() => setActiveTab("excel")} style={{...styles.tab, borderBottom: activeTab === "excel" ? "3px solid #2563eb" : "none"}}><FaFileExcel /> Excel</button>
          <button onClick={() => setActiveTab("manual")} style={{...styles.tab, borderBottom: activeTab === "manual" ? "3px solid #2563eb" : "none"}}><FaPlus /> Manual</button>
          <button onClick={() => setActiveTab("ai")} style={{...styles.tab, borderBottom: activeTab === "ai" ? "3px solid #2563eb" : "none"}}><FaMagic /> AI Synth</button>
        </div>

        {/* --- Content Area --- */}
        <div style={styles.mainCard}>
          {activeTab === "excel" && (
            <div>
              <div style={styles.dropZone} onClick={() => document.getElementById('exFile').click()}>
                <FaCloudUploadAlt size={40} color="#2563eb" />
                <p>{file ? file.name : "Click to select Excel file"}</p>
                <input id="exFile" type="file" hidden onChange={handleFileChange} />
              </div>
              {excelPreview.length > 0 && (
                <button onClick={handleExcelUpload} style={styles.primaryBtn}>Upload {excelPreview.length} Questions</button>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit}>
              <textarea placeholder="Enter Question..." value={manualData.content} onChange={(e) => setManualData({...manualData, content: e.target.value})} style={styles.textarea} required />
              <div style={styles.optionGrid}>
                {["A", "B", "C", "D"].map(o => (
                  <input key={o} placeholder={`Option ${o}`} value={manualData[`option${o}`]} onChange={(e) => setManualData({...manualData, [`option${o}`]: e.target.value})} style={styles.input} required />
                ))}
              </div>
              <select value={manualData.correctAns} onChange={(e) => setManualData({...manualData, correctAns: e.target.value})} style={styles.input}>
                <option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option>
              </select>
              <button type="submit" style={styles.primaryBtn}>Save Question</button>
            </form>
          )}

          {activeTab === "ai" && (
            <div>
              <div style={styles.aiFlex}>
                <input placeholder="Topic (e.g. Java, History)" value={aiConfig.topic} onChange={(e) => setAiConfig({...aiConfig, topic: e.target.value})} style={styles.input} />
                <select value={aiConfig.difficulty} onChange={(e) => setAiConfig({...aiConfig, difficulty: e.target.value})} style={styles.input}>
                  <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                </select>
                <input type="number" value={aiConfig.count} onChange={(e) => setAiConfig({...aiConfig, count: e.target.value})} style={styles.miniInput} />
              </div>
              <button onClick={handleAIGenerate} style={styles.aiBtn}>Generate Questions</button>
              {aiPreview.length > 0 && (
                <div style={{marginTop: '20px'}}>
                  <p>{aiPreview.length} Questions Generated</p>
                  <button onClick={saveAiQuestions} style={styles.primaryBtn}>Commit to Database</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "20px", background: "#f8fafc" },
  container: { maxWidth: "900px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "30px" },
  title: { fontSize: "32px", fontWeight: "800" },
  configGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
  glassCard: { background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  timerRow: { display: "flex", gap: "10px", marginTop: "10px" },
  input: { width: "100%", padding: "12px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  miniInput: { width: "70px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" },
  smallBtn: { border: "none", background: "#eff6ff", color: "#2563eb", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" },
  saveBtn: { flex: 1, background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  tabs: { display: "flex", background: "#fff", borderRadius: "10px", marginBottom: "20px", overflow: "hidden" },
  tab: { flex: 1, padding: "15px", border: "none", background: "none", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  mainCard: { background: "#fff", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  dropZone: { border: "2px dashed #cbd5e1", padding: "40px", textAlign: "center", borderRadius: "15px", cursor: "pointer" },
  primaryBtn: { width: "100%", padding: "15px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", marginTop: "15px" },
  textarea: { width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "10px" },
  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  aiFlex: { display: "flex", gap: "10px", marginBottom: "10px" },
  aiBtn: { width: "100%", padding: "12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }
};

export default UploadQuestions;