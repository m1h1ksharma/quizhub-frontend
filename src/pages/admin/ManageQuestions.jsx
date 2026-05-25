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

  // Dynamic Filtering Logic
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
      showToast("Could not sync with cloud server", "error");
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
      confirmButton: 'swal-premium-confirm',
      cancelButton: 'swal-premium-cancel'
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
      customClass: { popup: 'swal-toast-popup' }
    });
  };

  // 1. Individual Asset Deletion
  const handleDelete = async (id) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Delete Question?',
      text: "This record will be permanently purged from the database.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Asset',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/questions/${id}`);
          setQuestions(prev => prev.filter((q) => q.id !== id));
          showToast('Question Removed Successfully');
        } catch (err) {
          showToast('Authorization or Network Error', 'error');
        }
      }
    });
  };

  // 2. Clear Specific Round (✅ 100% DYNAMIC & PATH VARIABLE FIX)
  const handleClearRound = async () => {
    if (selectedFilter === "All") return;
    
    Swal.fire({
      ...premiumAlert,
      title: `Purge ${selectedFilter}?`,
      text: `All questions in the active round "${selectedFilter}" will be permanently lost!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Clear Round',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          
          // ✅ FIXED: String template path matching `@PathVariable String roundName` with URL encoding
          const res = await API.delete(`/admin/questions/round/${encodeURIComponent(selectedFilter)}`);
          
          showToast(res.data.message || `${selectedFilter} round data cleared`);
          fetchData(); // Sync grid lists after purge
        } catch (err) {
          console.error("Clear dynamic round error:", err.response?.data);
          showToast(err.response?.data?.message || 'Failed to clear round', 'error');
          setLoading(false);
        }
      }
    });
  };

  // 3. Complete System Reset
  const handlePurgeAll = async () => {
    Swal.fire({
      ...premiumAlert,
      title: 'Wipe Entire Bank?',
      text: "DANGER: This will delete ALL questions across ALL rounds!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Wipe Everything',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await API.delete("/admin/questions/delete-all");
          showToast('Global database reset successful');
          fetchData();
        } catch {
          showToast('Reset operation failed', 'error');
          setLoading(false);
        }
      }
    });
  };

  if (loading) return <LoadingLoader message="Accessing Question Bank..." type="scan" />;

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>

      {/* Header Section */}
      <div style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "15px" : "0" }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={styles.title}>Asset <span style={{ color: "#2563eb" }}>Management</span></h1>
          <div style={styles.subtitle}>
             Total Questions: <span style={styles.countPill}>{filteredQuestions.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={handlePurgeAll} style={styles.purgeBtn}><FaExclamationTriangle /> Purge All</button>
          <button onClick={() => navigate("/admin/upload")} style={styles.addBtn}><FaPlus /> Add New</button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ ...styles.controlsWrap, gridTemplateColumns: isMobile ? "1fr" : "2.8fr 1.2fr auto" }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            type="text"
            placeholder="Filter by question content..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.filterBox}>
          <FaFilter color="#2563eb" size={14} />
          <select style={styles.filterSelect} value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="All">All Active Rounds</option>
            {rounds.map((r, i) => (<option key={i} value={r}>{r.toUpperCase()}</option>))}
          </select>
        </div>
        {selectedFilter !== "All" && (
          <button onClick={handleClearRound} style={styles.clearBtn}><FaTrashAlt size={12} /> Purge Round</button>
        )}
      </div>

      {/* Data Table */}
      <div className="glass-card-main" style={styles.tableCard}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Question Asset</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Key</th>
                <th style={styles.th}>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="table-row">
                    <td style={{ ...styles.td, minWidth: isMobile ? "250px" : "400px" }}>{q.content}</td>
                    <td style={styles.td}><span style={styles.roundBadge}>{q.category}</span></td>
                    <td style={styles.td}><span style={styles.answerBadge}>{q.correctAns}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionWrap}>
                        <button onClick={() => navigate(`/admin/edit-question/${q.id}`)} style={styles.editBtn}><FaEdit /></button>
                        <button onClick={() => handleDelete(q.id)} style={styles.deleteBtn}><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={styles.emptyTd}>No assets found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row { transition: 0.2s; }
        .table-row:hover { background: #f8fafc; }
        .glass-card-main { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border: 1px solid #f1f5f9; box-shadow: 0 15px 35px rgba(0,0,0,0.02); }
        .swal-premium-popup { border-radius: 28px !important; padding: 2rem !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .swal-premium-title { font-weight: 900 !important; color: #0f172a !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 12px !important; padding: 12px 24px !important; font-weight: 700 !important; margin: 5px; border: none !important; cursor: pointer; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; border-radius: 12px !important; padding: 12px 24px !important; font-weight: 700 !important; margin: 5px; border: none !important; cursor: pointer; }
        .swal-toast-popup { border-radius: 16px !important; backdrop-filter: blur(10px) !important; border: 1px solid #e2e8f0 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "35px", padding: "24px", borderRadius: "32px", background: "#fff", border: "1px solid #f1f5f9", alignItems: 'center' },
  title: { margin: 0, fontWeight: "900", color: "#0f172a", fontSize: '32px', letterSpacing: '-1px' },
  subtitle: { color: "#64748b", fontWeight: "700", fontSize: "13px", marginTop: "4px" },
  countPill: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "99px", fontSize: '12px' },
  addBtn: { border: "none", background: "#2563eb", color: "#fff", padding: "12px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" },
  purgeBtn: { border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", padding: "12px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" },
  controlsWrap: { display: "grid", gap: "15px", marginBottom: "30px" },
  searchBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px" },
  searchInput: { border: "none", outline: "none", width: "100%", fontWeight: "600", fontSize: '14px' },
  filterBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "0 15px", display: "flex", alignItems: "center" },
  filterSelect: { height: "50px", border: "none", outline: "none", fontWeight: "800", width: "100%", background: 'transparent', cursor: 'pointer' },
  clearBtn: { border: "none", background: "#fef2f2", color: "#ef4444", borderRadius: "18px", padding: "0 20px", fontWeight: "800", cursor: "pointer", fontSize: '12px' },
  tableCard: { borderRadius: "30px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", padding: "20px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: '800' },
  td: { padding: "20px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px", color: '#1e293b', fontWeight: '500' },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "8px", fontWeight: "800", fontSize: "11px" },
  answerBadge: { background: "#f0fdf4", color: "#16a34a", padding: "6px 12px", borderRadius: "8px", fontWeight: "900", fontSize: '12px' },
  actionWrap: { display: "flex", gap: "10px" },
  editBtn: { border: "none", background: "#f1f5f9", color: "#64748b", width: "40px", height: "40px", borderRadius: "12px", cursor: "pointer", transition: '0.2s' },
  deleteBtn: { border: "none", background: "#f1f5f9", color: "#64748b", width: "40px", height: "40px", borderRadius: "12px", cursor: "pointer", transition: '0.2s' },
  emptyTd: { padding: "80px", textAlign: "center", color: "#cbd5e1", fontWeight: "700", fontSize: '18px' }
};

export default ManageQuestions;