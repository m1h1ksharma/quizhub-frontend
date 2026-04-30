import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import * as XLSX from "xlsx";
import Swal from "sweetalert2"; // 🔥 Professional Alerts
import {
  FaSearch, FaFileExcel, FaSync, FaTrashAlt, FaExclamationTriangle, FaLayerGroup, FaTrophy, FaUserAlt
} from "react-icons/fa";
import LoadingLoader from "../../components/LoadingLoader";

function Leaderboard() {
  const [results, setResults] = useState([]);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRound, setSelectedRound] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAll, roundsRes] = await Promise.all([
        API.get("/admin/results/all", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/admin/questions/rounds", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setResults(Array.isArray(resAll.data) ? resAll.data : []);
      setAvailableRounds(Array.isArray(roundsRes.data) ? roundsRes.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🔥 Professional Custom Alert Configuration
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
      scrollbarPadding: false,
      customClass: { popup: 'swal-toast-popup' }
    });
    Toast.fire({ icon, title: msg });
  };

  const handleDeleteAll = async () => {
    Swal.fire({
      ...premiumAlert,
      title: 'Wipe All Results?',
      text: "DANGER: This will permanently delete every student record in the database!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete("/admin/results/delete-all", { headers: { Authorization: `Bearer ${token}` } });
          setResults([]);
          showToast('Database Cleared');
        } catch (err) {
          showToast('Wipe failed!', 'error');
        }
      }
    });
  };

  const handleDelete = async (id, name) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Delete Record?',
      text: `Remove ${name.toUpperCase()}'s performance record?`,
      showCancelButton: true,
      confirmButtonText: 'Delete Now',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/delete-result/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setResults(results.filter((r) => r.id !== id));
          showToast('Record removed');
        } catch (err) {
          showToast('Delete failed', 'error');
        }
      }
    });
  };

  const filteredResults = results.filter((res) => {
    const matchesSearch = (res.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (res.studentMobile || "").includes(searchTerm);
    const matchesRound = selectedRound === "ALL" || res.quizRound === selectedRound;
    return matchesSearch && matchesRound;
  });

  const exportToExcel = () => {
    if (filteredResults.length === 0) return showToast('No data to export', 'warning');
    const excelData = filteredResults.map((res, index) => ({
      Rank: index + 1,
      Name: (res.studentName || "").toUpperCase(),
      Mobile: res.studentMobile,
      Score: res.score,
      Round: res.quizRound,
      Time: new Date(res.timestamp).toLocaleString(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
    XLSX.writeFile(workbook, `Leaderboard_${selectedRound}.xlsx`);
    showToast('Export Successful');
  };

  if (loading) return <LoadingLoader message="Accessing hall of fame..." type="scan" />;

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>

      {/* HEADER */}
      <div style={{ ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={{ ...styles.title, fontSize: isMobile ? "28px" : "38px" }}>
             Hall of <span style={{ color: "#2563eb" }}>Fame</span>
          </h1>
          <p style={styles.subtitle}>
             Global Standings: <span style={styles.countPill}>{filteredResults.length}</span> Candidates
          </p>
        </div>

        <div style={{ ...styles.actionGroup, width: isMobile ? "100%" : "auto" }}>
          <button onClick={fetchData} className="btn-interact-sec" style={styles.syncBtn}><FaSync /></button>
          <button onClick={handleDeleteAll} className="btn-interact-sec" style={styles.deleteAllBtn}><FaExclamationTriangle /> Reset</button>
          <button onClick={exportToExcel} className="btn-interact-pri" style={styles.exportBtn}><FaFileExcel /> Export CSV</button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ ...styles.filterWrap, gridTemplateColumns: isMobile ? "1fr" : "2.5fr 1fr" }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            style={styles.input}
            placeholder="Search candidate by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.selectBox}>
          <FaLayerGroup color="#2563eb" size={12} />
          <select style={styles.select} value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)}>
            <option value="ALL">All Categories</option>
            {availableRounds.map((r, i) => (<option key={i} value={r}>{r.replace("_", " ").toUpperCase()}</option>))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="main-glass-panel" style={styles.tableCard}>
        <div style={styles.tableTop}><div style={styles.tableTitle}>Rank Analytics</div></div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}><FaUserAlt style={{marginRight: '8px'}}/> Candidate Name</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((res, index) => (
                  <tr key={res.id} className="table-row">
                    <td style={styles.td}>
                      <div style={{ ...styles.rankBadge, background: index === 0 ? "#fef3c7" : index === 1 ? "#f1f5f9" : index === 2 ? "#fff7ed" : "#f8fafc", color: index === 0 ? "#b45309" : "#64748b" }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={styles.td}><strong>{res.studentName?.toUpperCase()}</strong></td>
                    <td style={styles.td}>{res.studentMobile}</td>
                    <td style={styles.td}><span style={styles.roundBadge}>{res.quizRound}</span></td>
                    <td style={styles.scoreTd}>{res.score}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleDelete(res.id, res.studentName)} className="delete-row-btn" style={styles.deleteBtn}><FaTrashAlt /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={styles.emptyTd}>No records found for this round.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row { transition: all 0.2s ease; }
        .table-row:hover { background: #f8fafc; }
        .btn-interact-pri:hover { background: #047857 !important; transform: scale(1.02); box-shadow: 0 10px 20px -5px rgba(5,150,105,0.3); }
        .btn-interact-sec:hover { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
        .delete-row-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; transform: scale(1.1); }
        
        .swal-premium-popup { border-radius: 28px !important; padding: 2.5rem !important; background: #fff !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1) !important; }
        .swal-premium-title { color: #0f172a !important; font-size: 22px !important; font-weight: 900 !important; letter-spacing: -1px !important; margin-bottom: 12px !important; }
        .swal-premium-html { color: #64748b !important; font-size: 15px !important; line-height: 1.6 !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 12px !important; padding: 14px 28px !important; font-weight: 700 !important; border: none !important; cursor: pointer; margin-left: 10px !important; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; border-radius: 12px !important; padding: 14px 28px !important; font-weight: 700 !important; border: none !important; cursor: pointer; }
        
        .swal-toast-popup { border-radius: 18px !important; padding: 12px 20px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(10px) !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
        body.swal2-shown { padding-right: 0 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meshOne: { position: "absolute", top: "-100px", right: "-100px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.08), transparent 70%)" },
  meshTwo: { position: "absolute", bottom: "-100px", left: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.06), transparent 70%)" },
  header: { display: "flex", justifyContent: "space-between", gap: "18px", marginBottom: "35px", padding: "24px", borderRadius: "32px", background: "rgba(255,255,255,.80)", border: "1px solid rgba(255,255,255,.70)", backdropFilter: "blur(20px)", boxShadow: "0 18px 40px rgba(15,23,42,.05)", position: "relative", zIndex: 10 },
  title: { margin: 0, fontWeight: "900", color: "#0f172a", letterSpacing: "-1.5px" },
  subtitle: { margin: "10px 0 0 0", color: "#64748b", fontWeight: "700", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '8px' },
  countPill: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "99px", fontWeight: "800" },
  actionGroup: { display: "flex", gap: "12px" },
  syncBtn: { border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", width: '45px', height: '45px', borderRadius: "14px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' },
  deleteAllBtn: { border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", padding: "0 22px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "10px", alignItems: "center", transition: '0.3s' },
  exportBtn: { border: "none", background: "#059669", color: "#fff", padding: "0 25px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "10px", alignItems: "center", transition: '0.3s' },
  filterWrap: { display: "grid", gap: "15px", marginBottom: "30px", position: 'relative', zIndex: 10 },
  searchBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px 22px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" },
  input: { border: "none", outline: "none", width: "100%", fontSize: "15px", fontWeight: "600", color: '#1e293b', background: 'transparent' },
  selectBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "0 18px", display: "flex", alignItems: "center", gap: "10px" },
  select: { width: "100%", height: "55px", border: "none", outline: "none", background: "transparent", fontWeight: "700", cursor: "pointer", fontSize: "14px", color: '#1e293b' },
  tableCard: { background: "#ffffffcc", backdropFilter: 'blur(10px)', border: "1px solid #f1f5f9", borderRadius: "32px", overflow: "hidden", boxShadow: "0 15px 35px rgba(0,0,0,0.03)", position: 'relative', zIndex: 10 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "760px" },
  tableTop: { padding: "20px 28px", borderBottom: "1px solid #f1f5f9", background: "rgba(255,255,255,0.5)" },
  tableTitle: { fontWeight: "800", color: "#1e293b", fontSize: "16px" },
  th: { background: "#f8fafc", padding: "18px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "800", letterSpacing: "1px", borderBottom: '1px solid #f1f5f9' },
  td: { padding: "20px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px", color: "#334155", verticalAlign: "middle", fontWeight: '500' },
  rankBadge: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "13px" },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: 'uppercase' },
  scoreTd: { padding: "20px 25px", borderBottom: "1px solid #f8fafc", fontWeight: "900", color: "#2563eb", fontSize: "20px" },
  deleteBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: '40px', height: '40px', borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  emptyTd: { textAlign: "center", padding: "100px", color: "#cbd5e1", fontWeight: "600", fontSize: "16px" },
};

export default Leaderboard;