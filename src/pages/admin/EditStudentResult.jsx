import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { FaSave, FaArrowLeft, FaUserEdit } from "react-icons/fa";

function EditStudentResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [formData, setFormData] = useState({
    studentName: "",
    studentMobile: "",
    score: 0,
    totalQuestions: 0,
    quizRound: ""
  });

  // Mobile check logic
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // FIX: Added leading slash and backticks for ID
        const res = await API.get(`/admin/results/${id}`);
        setFormData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        alert("Result data fetch failed!");
        navigate("/admin/students");
      }
    };
    fetchResult();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // FIX: Added leading slash and backticks for ID
      await API.put(`/admin/update-result/${id}`, formData);
      alert("Student Result Updated!");
      navigate("/admin/students");
    } catch (err) {
      alert("Update failed! Check Backend connection.");
    }
  };

  if (loading) return <div style={styles.loader}>Loading Student Data...</div>;

  return (
    <div style={{ ...styles.wrapper, padding: isMobile ? "15px" : "30px" }}>
      <button onClick={() => navigate("/admin/students")} style={styles.backBtn}>
        <FaArrowLeft /> {isMobile ? "Back" : "Back to Students List"}
      </button>

      <div style={{ ...styles.card, padding: isMobile ? "25px 20px" : "40px" }}>
        <div style={styles.header}>
          <FaUserEdit size={isMobile ? 20 : 24} color="#2563eb" />
          <h2 style={{ ...styles.title, fontSize: isMobile ? "18px" : "22px" }}>Edit Student Result</h2>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Student Name</label>
            <input 
              name="studentName"
              value={formData.studentName} 
              onChange={handleChange} 
              required
              style={styles.input} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mobile Number</label>
            <input 
              name="studentMobile"
              value={formData.studentMobile} 
              onChange={handleChange} 
              required
              style={styles.input} 
            />
          </div>

          <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Score</label>
              <input 
                type="number" 
                name="score"
                value={formData.score} 
                onChange={handleChange} 
                required
                style={styles.input} 
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Total Questions</label>
              <input 
                type="number" 
                name="totalQuestions"
                value={formData.totalQuestions} 
                onChange={handleChange} 
                required
                style={styles.input} 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Quiz Round</label>
            <input 
              name="quizRound"
              value={formData.quizRound} 
              onChange={handleChange} 
              required
              style={styles.input} 
            />
          </div>

          <button type="submit" style={styles.saveBtn}>
            <FaSave /> {isMobile ? "Update" : "Update Record"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: "700px", margin: "auto", minHeight: "100vh" },
  loader: { textAlign: 'center', padding: '100px', fontSize: '18px', fontWeight: '700', color: '#64748b' },
  backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "700", marginBottom: "20px" },
  card: { background: "#fff", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
  title: { margin: 0, fontWeight: "900", color: "#1e293b" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: '0.5px' },
  input: { padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "16px", fontWeight: '500', background: '#f8fafc' },
  grid: { display: "grid", gap: "20px" },
  saveBtn: { background: "#2563eb", color: "#fff", border: "none", padding: "16px", borderRadius: "14px", fontWeight: "800", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px", boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }
};

export default EditStudentResult;