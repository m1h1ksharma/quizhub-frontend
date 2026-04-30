import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import Swal from "sweetalert2"; 
import { FaSave, FaArrowLeft } from "react-icons/fa";

function EditQuestion() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [formData, setFormData] = useState({
        content: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAns: "A",
        category: ""
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const res = await API.get(`/admin/questions/${id}`);
                setFormData(res.data);
                setLoading(false);
            } catch (err) {
                showToast("Data fetch failed!", "error");
                navigate("/admin/manage");
            }
        };
        fetchQuestion();
    }, [id, navigate]);

    
    const showToast = (msg, icon = 'success') => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end', 
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            scrollbarPadding: false,
            customClass: {
                popup: 'swal-cool-toast' 
            }
        });
        Toast.fire({ icon, title: msg });
  };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/admin/questions/${id}`, formData);
            
            
            showToast('Changes Saved Successfully!');

            
            setTimeout(() => {
                navigate("/admin/manage"); 
            }, 1200);

        } catch (err) {
            showToast("Update failed!", "error");
        }
    };

    if (loading) return <div style={styles.loader}>Syncing...</div>;

  return (
    <div style={{ ...styles.pageContainer, padding: isMobile ? "15px" : "40px" }}>
      <button onClick={() => navigate("/admin/manage")} style={styles.backBtn}>
        <FaArrowLeft /> Back to List
      </button>

      <div style={{ ...styles.card, padding: isMobile ? "20px" : "40px" }}>
        <h2 style={{ ...styles.title, fontSize: isMobile ? "22px" : "32px" }}>
            Edit Question <span style={{color: '#2563eb'}}>#{id}</span>
        </h2>
        
        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Question Content</label>
            <textarea 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                required 
                style={styles.textarea} 
            />
          </div>

          <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            {['A', 'B', 'C', 'D'].map((opt) => (
                <div key={opt} style={styles.inputGroup}>
                    <label style={styles.label}>Option {opt}</label>
                    <input 
                        name={`option${opt}`} 
                        value={formData[`option${opt}`]} 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
                </div>
            ))}
          </div>

          <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correct Answer</label>
              <select name="correctAns" value={formData.correctAns} onChange={handleChange} style={styles.select}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Category</label>
              <input name="category" value={formData.category} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <button type="submit" className="save-btn-hover" style={styles.saveBtn}>
            <FaSave /> Commit Changes
          </button>
        </form>
      </div>

      <style>{`
        .save-btn-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4); }
        
        /* 🔥 COOL ROUNDED TOAST CSS */
        .swal-cool-toast {
            border-radius: 16px !important; // Rectangle ki jagah rounded
            padding: 10px 15px !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
            font-family: 'Plus Jakarta Sans', sans-serif !important;
        }

        .swal2-title {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
        }

        body.swal2-shown { padding-right: 0 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  pageContainer: { maxWidth: "1000px", margin: "auto", minHeight: "100vh" },
  loader: { padding: '100px', textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: '20px' },
  backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "700", marginBottom: "30px" },
  card: { background: "#fff", borderRadius: "32px", boxShadow: "0 20px 50px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" },
  title: { margin: "0 0 35px 0", fontWeight: "900", color: "#0f172a" },
  form: { display: "flex", flexDirection: "column", gap: "25px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "11px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase" },
  input: { padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", fontWeight: '600', color: '#1e293b' },
  textarea: { padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", fontWeight: '600', color: '#1e293b', minHeight: "150px", fontFamily: "inherit" },
  select: { padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", fontWeight: "800", cursor: "pointer" },
  grid: { display: "grid", gap: "20px" },
  saveBtn: { background: "#2563eb", color: "#fff", border: "none", padding: "18px", borderRadius: "18px", fontWeight: "900", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }
};

export default EditQuestion;