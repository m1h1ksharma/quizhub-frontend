import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { FaClock, FaSave, FaLayerGroup, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function QuizSettings() {
  const [timerValue, setTimerValue] = useState("");
  const [targetRound, setTargetRound] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Backend se Current Config Load Karo (No Hardcoding)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get("/admin/settings/timer");
        // Backend keys match: timerValue, activeRound
        setTimerValue(res.data.timerValue || 10);
        setTargetRound(res.data.activeRound || "Normal Quiz");
      } catch (err) {
        console.error("Fetch Settings Error:", err);
        showFeedback("error", "Could not load settings from server.");
      }
    };
    fetchSettings();
  }, []);

  // 2. Feedback Message Handler
  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // 3. Settings Update Handler
  const handleUpdate = async () => {
    if (!timerValue || !targetRound) {
      showFeedback("error", "Fields cannot be empty!");
      return;
    }

    setLoading(true);
    try {
      // Backend mapping match: timerValue, activeRound
      await API.put("/admin/settings/update-timer", {
        timerValue: parseInt(timerValue),
        activeRound: targetRound
      });

      showFeedback("success", "System Configuration Updated Successfully!");

      // 4. Sidebar ko signal bhejta hai bina refresh kiye update karne ke liye
      window.dispatchEvent(new Event("roundUpdated")); 
    } catch (err) {
      console.error("Update Error:", err);
      showFeedback("error", "Failed to update settings. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h2 style={styles.title}>System Configuration</h2>
        <p style={styles.subtitle}>Manage global quiz timer and active round status</p>
      </div>

      {message.text && (
        <div style={{ ...styles.alert, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2" }}>
          {message.type === "success" ? <FaCheckCircle color="#16a34a" /> : <FaExclamationTriangle color="#dc2626" />}
          <span style={{ color: message.type === "success" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
            {message.text}
          </span>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.inputGroup}>
          <label style={styles.label}><FaClock /> Quiz Timer (Minutes)</label>
          <input 
            type="number" 
            value={timerValue} 
            onChange={(e) => setTimerValue(e.target.value)} 
            style={styles.input}
            placeholder="e.g. 15"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}><FaLayerGroup /> Active Quiz Round</label>
          <input 
            type="text" 
            value={targetRound} 
            onChange={(e) => setTargetRound(e.target.value)} 
            style={styles.input}
            placeholder="e.g. Technical Round"
          />
          <small style={styles.helperText}>This round name will be visible to all students live.</small>
        </div>

        <button 
          onClick={handleUpdate} 
          disabled={loading} 
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
        >
          <FaSave /> {loading ? "Syncing..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "40px auto", padding: "0 20px" },
  headerSection: { marginBottom: "30px", textAlign: "left" },
  title: { fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: 0 },
  subtitle: { color: "#64748b", fontSize: "14px", marginTop: "5px" },
  card: { background: "#fff", padding: "35px", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" },
  inputGroup: { marginBottom: "25px" },
  label: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", marginBottom: "10px" },
  input: { width: "100%", padding: "15px", borderRadius: "14px", border: "2px solid #e2e8f0", fontSize: "16px", transition: "0.3s", outline: "none", boxSizing: "border-box" },
  helperText: { fontSize: "11px", color: "#94a3b8", marginTop: "5px", display: "block" },
  btn: { width: "100%", padding: "18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer", display: "flex", justifyContent: "center", gap: "10px", fontSize: "16px", boxShadow: "0 10px 20px rgba(37, 99, 235, 0.2)" },
  alert: { padding: "15px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }
};

export default QuizSettings;