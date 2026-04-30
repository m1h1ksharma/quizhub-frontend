import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaTrashAlt, FaEdit, FaSearch, FaFilter, FaPlus, FaDatabase
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoadingLoader from "../../components/LoadingLoader";

function ManageQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let result = questions;
    if (selectedFilter !== "All") {
      result = result.filter((q) => q.category === selectedFilter);
    }
    if (searchTerm.trim() !== "") {
      result = result.filter((q) =>
        q.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredQuestions(result);
  }, [searchTerm, selectedFilter, questions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Added leading slashes for correct axios concatenation
      const [qRes, rRes] = await Promise.all([
        API.get("/admin/questions"),
        API.get("/admin/questions/rounds"),
      ]);
      setQuestions(qRes.data || []);
      setRounds(rRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 403) {
        console.error("DEBUG: Forbidden - Check if you are logged in as Admin.");
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
      popup: 'swal-premium-popup',
      title: 'swal-premium-title',
      htmlContainer: 'swal-premium-html',
      confirmButton: 'swal-premium-confirm',
      cancelButton: 'swal-premium-cancel'
    }
  };

  const showToast = (msg, icon = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      customClass: { popup: 'swal-toast-popup' }
    });
    Toast.fire({ icon, title: msg });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Delete Question?',
      text: "This asset will be permanently removed from the system.",
      showCancelButton: true,
      confirmButtonText: 'Delete Now!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Correct path with backticks for ID
          await API.delete(`/admin/questions/${id}`);
          setQuestions(questions.filter((q) => q.id !== id));
          showToast('Question Deleted Successfully');
        } catch (err) {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleClearRoundQuestions = async () => {
    if (selectedFilter === "All") return;
    Swal.fire({
      ...premiumAlert,
      title: `Purge ${selectedFilter}?`,
      text: "Warning: This will wipe all questions in this category.",
      showCancelButton: true,
      confirmButtonText: 'Purge All',
      cancelButtonText: 'Abort',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          // Correct query parameter format
          await API.delete(`/admin/questions/clear-by-round?roundName=${selectedFilter}`);
          showToast(`Round ${selectedFilter} cleared`);
          fetchData();
        } catch (err) {
          showToast('Purge failed', 'error');
          setLoading(false);
        }
      }
    });
  };

  if (loading) return <LoadingLoader message="Syncing Question Bank..." type="scan" />;

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>

      <div style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={styles.title}>Question <span style={{ color: "#2563eb" }}>Bank</span></h1>
          <div style={styles.subtitle}>
            Monitoring <span style={styles.countPill}>{filteredQuestions.length}</span> Active Assets
          </div>
        </div>
        <button onClick={() => navigate("/admin/upload")} style={{ ...styles.addBtn, width: isMobile ? "100%" : "auto" }}>
          <FaPlus /> New Question
        </button>
      </div>

      <div style={{ ...styles.controlsWrap, gridTemplateColumns: isMobile ? "1fr" : "2.8fr 1.2fr auto" }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            type="text"
            placeholder="Search questions by content..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.filterBox}>
          <FaFilter color="#2563eb" size={11} />
          <select style={styles.filterSelect} value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {rounds.map((r, i) => (<option key={i} value={r}>{r.toUpperCase()}</option>))}
          </select>
        </div>
        {selectedFilter !== "All" && (
          <button onClick={handleClearRoundQuestions} style={styles.clearBtn}>
            <FaTrashAlt size={12} /> Clear Round
          </button>
        )}
      </div>

      <div className="glass-card-main" style={styles.tableCard}>
        <div style={styles.tableTop}>
          <div style={styles.tableTitle}>Managed Content Assets</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Question Content</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Key</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="table-row">
                    <td style={{ ...styles.td, minWidth: isMobile ? "240px" : "420px" }}>{q.content}</td>
                    <td style={styles.td}><span style={styles.roundBadge}>{q.category}</span></td>
                    <td style={styles.td}><span style={styles.answerBadge}>{q.correctAns}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionWrap}>
                        <button onClick={() => navigate(`/admin/edit-question/${q.id}`)} className="action-btn-hover edit-btn" style={styles.editBtn}><FaEdit /></button>
                        <button onClick={() => handleDelete(q.id)} className="action-btn-hover delete-btn" style={styles.deleteBtn}><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={styles.emptyTd}>No records found for the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row { transition: all 0.2s ease; }
        .table-row:hover { background: #f8fafc; }
        .action-btn-hover:hover { transform: scale(1.1); transition: 0.2s; }
        .edit-btn:hover { background: #eff6ff !important; color: #2563eb !important; }
        .delete-btn:hover { background: #fef2f2 !important; color: #ef4444 !important; }
        .swal-premium-popup { border-radius: 28px !important; padding: 2.5rem !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 14px !important; cursor: pointer; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; cursor: pointer; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.06), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)" },
  header: { display: "flex", justifyContent: "space-between", gap: "18px", marginBottom: "35px", padding: "24px", borderRadius: "32px", background: "rgba(255,255,255,.80)", border: "1px solid rgba(255,255,255,.70)", backdropFilter: "blur(20px)", boxShadow: "0 18px 40px rgba(15,23,42,.05)", position: "relative", zIndex: 2 },
  title: { margin: 0, fontWeight: "900", color: "#0f172a", letterSpacing: "-1.5px", fontSize: '38px' },
  subtitle: { margin: "10px 0 0 0", color: "#64748b", fontWeight: "700", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '8px' },
  countPill: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "99px", fontWeight: "800" },
  addBtn: { border: "none", background: "#2563eb", color: "#fff", padding: "14px 24px", borderRadius: "16px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  controlsWrap: { display: "grid", gap: "15px", marginBottom: "30px", position: 'relative', zIndex: 10 },
  searchBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px 22px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" },
  searchInput: { border: "none", outline: "none", width: "100%", fontSize: "15px", fontWeight: "600", color: '#1e293b' },
  filterBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "0 18px", display: "flex", alignItems: "center", gap: "10px" },
  filterSelect: { width: "100%", height: "55px", border: "none", outline: "none", background: "transparent", fontWeight: "700", cursor: "pointer", fontSize: "14px", color: '#1e293b' },
  clearBtn: { border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", padding: "0 24px", borderRadius: "18px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  tableCard: { background: "#ffffffcc", backdropFilter: 'blur(10px)', border: "1px solid #f1f5f9", borderRadius: "32px", overflow: "hidden", boxShadow: "0 15px 35px rgba(0,0,0,0.03)", position: 'relative', zIndex: 10 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "760px" },
  tableTop: { padding: "20px 28px", borderBottom: "1px solid #f1f5f9", background: "rgba(255,255,255,0.5)" },
  tableTitle: { fontWeight: "800", color: "#1e293b", fontSize: "16px" },
  th: { background: "#f8fafc", padding: "18px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "800", letterSpacing: "1px", borderBottom: '1px solid #f1f5f9' },
  td: { padding: "20px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px", color: "#334155", verticalAlign: "middle", fontWeight: '500' },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: 'uppercase' },
  answerBadge: { background: "#f0fdf4", color: "#16a34a", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "900" },
  actionWrap: { display: "flex", gap: "10px" },
  editBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: '40px', height: '40px', borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: '40px', height: '40px', borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyTd: { textAlign: "center", padding: "100px", color: "#cbd5e1", fontWeight: "600", fontSize: "16px" }
};

export default ManageQuestions;