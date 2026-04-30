import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from "../api/axios"; 

function PasscodeModal({ onClose }) {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!code) {
      alert("Please enter the code!");
      return;
    }

    try {
      const res = await API.post("/auth/verify-quiz-code", { code: code });
      if (res.status === 200) {
        navigate("/student/quiz"); 
      }
    } catch (err) {
      console.error("Verification Error:", err);
      alert(err.response?.data?.message || "Invalid Passcode! Instructor se sahi code lein.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Close Button */}
        <button onClick={onClose} style={styles.closeBtn}><X size={24}/></button>
        
        <div style={styles.iconContainer}>
          <KeyRound size={isMobile() ? 32 : 40} color="#2563eb" />
        </div>

        <h3 style={styles.title}>Enter Instructor Code</h3>
        <p style={styles.subtitle}>
          This quiz is locked. Enter the access code provided by your instructor to start.
        </p>
        
        <input 
          type="text" 
          placeholder="e.g. PIET2026" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.input}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          autoFocus
        />
        
        <button onClick={handleVerify} style={styles.verifyBtn}>
          Unlock & Start Quiz
        </button>
      </div>
    </div>
  );
}

// Helper function to check mobile within the component for small style tweaks
const isMobile = () => window.innerWidth < 768;

const styles = {
  overlay: { 
    position: "fixed", top:0, left:0, width: "100%", height: "100%", 
    background: "rgba(15, 23, 42, 0.8)", 
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
    backdropFilter: "blur(6px)",
    padding: "20px" // Padding taaki mobile par modal screen edges se na chipke
  },
  modal: { 
    background: "#fff", 
    padding: isMobile() ? "30px 20px" : "40px", 
    borderRadius: "20px", 
    width: "100%", 
    maxWidth: "400px", 
    textAlign: "center", 
    position: "relative", 
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    animation: "modalFadeIn 0.3s ease-out"
  },
  closeBtn: { 
    position: "absolute", top: "15px", right: "15px", 
    border: "none", background: "none", cursor: "pointer", 
    color: "#94a3b8", padding: "5px" 
  },
  iconContainer: { marginBottom: "15px", display: "flex", justifyContent: "center" },
  title: { fontSize: isMobile() ? "18px" : "22px", fontWeight: "800", color: "#1e293b", margin: "0 0 10px 0" },
  subtitle: { fontSize: "14px", color: "#64748b", marginBottom: "25px", lineHeight: "1.5" },
  input: { 
    width: "100%", 
    padding: "14px", 
    border: "2px solid #e2e8f0", 
    borderRadius: "12px", 
    marginBottom: "20px", 
    fontSize: "18px", 
    textAlign: "center", 
    boxSizing: "border-box",
    fontWeight: "700", 
    letterSpacing: "2px", 
    outline: "none", 
    backgroundColor: "#f8fafc",
    transition: "all 0.2s"
  },
  verifyBtn: { 
    width: "100%", 
    padding: "16px", 
    background: "#2563eb", 
    color: "#fff", 
    border: "none", 
    borderRadius: "12px", 
    fontWeight: "700", 
    cursor: "pointer",
    fontSize: "16px", 
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
    transition: "transform 0.1s active" 
  }
};

export default PasscodeModal;