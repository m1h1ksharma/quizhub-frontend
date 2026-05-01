import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaTrashAlt, FaEdit, FaSearch, FaFilter, FaPlus, FaExclamationTriangle
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
      const [qRes, rRes] = await Promise.all([
        API.get("/admin/questions"),
        API.get("/admin/questions/rounds"),
      ]);
      setQuestions(qRes.data || []);
      setRounds(rRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
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

  // 1. Individual Delete
  const handleDelete = async (id) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Delete Question?',
      text: "This asset will be permanently removed.",
      showCancelButton: true,
      confirmButtonText: 'Delete Now',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/questions/${id}`);
          setQuestions(questions.filter((q) => q.id !== id));
          showToast('Question Deleted');
        } catch {
          showToast('Delete failed', 'error');
        }
      }
    });
  };

  // 2. Clear Round (Specific Category)
  const handleClearRound = async () => {
    if (selectedFilter === "All") return;
    Swal.fire({
      ...premiumAlert,
      title: `Purge ${selectedFilter}?`,
      text: "Every question in this category will be wiped!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Purge Category',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await API.delete(`/admin/questions/clear-by-round?roundName=${selectedFilter}`);
          showToast(`${selectedFilter} Cleared`);
          fetchData();
        } catch {
          showToast('Purge failed', 'error');
          setLoading(false);
        }
      }
    });
  };

  // 3. DELETE ALL (Full Reset)
  const handlePurgeAll = async () => {
    Swal.fire({
      ...premiumAlert,
      title: 'WIPE ENTIRE BANK?',
      text: "This will delete ALL questions from ALL rounds. This action cannot be undone!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Wipe Everything',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await API.delete("/admin/questions/delete-all");
          showToast('Question Bank Reset Successful');
          fetchData();
        } catch {
          showToast('Reset failed', 'error');
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
             Assets: <span style={styles.countPill}>{filteredQuestions.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={handlePurgeAll} style={styles.purgeBtn}>
            <FaExclamationTriangle /> Purge All
          </button>
          <button onClick={() => navigate("/admin/upload")} style={styles.addBtn}>
            <FaPlus /> New Entry
          </button>
        </div>
      </div>

      <div style={{ ...styles.controlsWrap, gridTemplateColumns: isMobile ? "1fr" : "2.8fr 1.2fr auto" }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            type="text"
            placeholder="Search questions..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.filterBox}>
          <FaFilter color="#2563eb" size={14} />
          <select style={styles.filterSelect} value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="All">All Rounds</option>
            {rounds.map((r, i) => (<option key={i} value={r}>{r.toUpperCase()}</option>))}
          </select>
        </div>
        {selectedFilter !== "All" && (
          <button onClick={handleClearRound} style={styles.clearBtn}>
            <FaTrashAlt size={12} /> Clear Round
          </button>
        )}
      </div>

      <div className="glass-card-main" style={styles.tableCard}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Content</th>
                <th style={styles.th}>Round</th>
                <th style={styles.th}>Key</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="table-row">
                    <td style={{ ...styles.td, minWidth: isMobile ? "200px" : "400px" }}>{q.content}</td>
                    <td style={styles.td}><span style={styles.roundBadge}>{q.category}</span></td>
                    <td style={styles.td}><span style={styles.answerBadge}>{q.correctAns}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionWrap}>
                        <button onClick={() => navigate(`/admin/edit-question/${q.id}`)} className="edit-btn" style={styles.editBtn}><FaEdit /></button>
                        <button onClick={() => handleDelete(q.id)} className="delete-btn" style={styles.deleteBtn}><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={styles.emptyTd}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row:hover { background: #f8fafc; }
        .swal-premium-popup { border-radius: 28px !important; padding: 2.5rem !important; background: #fff !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 25px 50px 12px rgba(0,0,0,0.1) !important; }
        .swal-premium-title { color: #0f172a !important; font-size: 22px !important; font-weight: 900 !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 12px !important; padding: 12px 24px !important; font-weight: 700 !important; border: none !important; cursor: pointer; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; border-radius: 12px !important; padding: 12px 24px !important; font-weight: 700 !important; border: none !important; cursor: pointer; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "35px", padding: "24px", borderRadius: "32px", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", border: "1px solid #f1f5f9" },
  title: { margin: 0, fontWeight: "900", color: "#0f172a", fontSize: '36px' },
  subtitle: { color: "#64748b", fontWeight: "700", fontSize: "14px", marginTop: "5px" },
  countPill: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "99px" },
  addBtn: { border: "none", background: "#2563eb", color: "#fff", padding: "12px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flex: 1 },
  purgeBtn: { border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", padding: "12px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flex: 1 },
  controlsWrap: { display: "grid", gap: "15px", marginBottom: "30px" },
  searchBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px" },
  searchInput: { border: "none", outline: "none", width: "100%", fontWeight: "600" },
  filterBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 15px", display: "flex", alignItems: "center" },
  filterSelect: { height: "50px", border: "none", outline: "none", fontWeight: "700", width: "100%" },
  clearBtn: { border: "none", background: "#fef2f2", color: "#ef4444", borderRadius: "18px", padding: "0 20px", fontWeight: "800", cursor: "pointer" },
  tableCard: { background: "#fff", border: "1px solid #f1f5f9", borderRadius: "30px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", padding: "18px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8" },
  td: { padding: "18px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px" },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "5px 12px", borderRadius: "8px", fontWeight: "800", fontSize: "11px" },
  answerBadge: { background: "#f0fdf4", color: "#16a34a", padding: "5px 12px", borderRadius: "8px", fontWeight: "900" },
  actionWrap: { display: "flex", gap: "8px" },
  editBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer" },
  deleteBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer" },
  emptyTd: { padding: "100px", textAlign: "center", color: "#cbd5e1", fontWeight: "600" }
};

export default ManageQuestions;