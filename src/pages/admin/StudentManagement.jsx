import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaSearch, FaUndo, FaSync, FaFilter, FaExclamationTriangle
} from "react-icons/fa";
import LoadingLoader from "../../components/LoadingLoader";

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [activeRounds, setActiveRounds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roundFilter, setRoundFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, roundsRes] = await Promise.all([
        API.get("/admin/results/all"),
        API.get("/admin/questions/rounds")
      ]);
      setStudents(res.data || []);
      setActiveRounds(roundsRes.data || []);
    } catch (err) {
      console.error("Fetch failed", err);
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
    const Toast = Swal.mixin({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: { popup: 'swal-toast-popup' }
    });
    Toast.fire({ icon, title: msg });
  };

  // 1. Wipe All Results (Full Reset)
  const handleWipeAll = async () => {
    Swal.fire({
      ...premiumAlert,
      title: 'Wipe All Records?',
      text: "This will permanently delete EVERY student result. This cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Wipe Database',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await API.delete("/admin/results/delete-all");
          showToast('All records cleared successfully');
          fetchData();
        } catch (err) {
          showToast('Operation failed', 'error');
          setLoading(false);
        }
      }
    });
  };

  const handleResetAccess = (id, name) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Reset Attempt?',
      text: `Clear data for ${name.toUpperCase()}?`,
      showCancelButton: true,
      confirmButtonText: 'Reset Now',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/delete-result/${id}`);
          showToast('Access Reset Successful');
          fetchData();
        } catch (err) {
          showToast('Failed to reset', 'error');
        }
      }
    });
  };

  const filteredStudents = students.filter((s) => {
    const name = s.studentName ? s.studentName.toLowerCase() : "";
    const mobile = s.studentMobile ? s.studentMobile : "";
    const round = s.quizRound ? s.quizRound : "";
    const search = searchTerm.toLowerCase();
    
    return (name.includes(search) || mobile.includes(search)) &&
           (roundFilter === "all" ? true : round === roundFilter);
  });

  if (loading) return <LoadingLoader message="Syncing Database..." type="scan" />;

  return (
    <div style={styles.container}>
      {/* Header with Wipe All Button */}
      <div style={{ ...styles.header, flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
        <div>
          <h1 style={styles.mainTitle}>Candidate <span style={{ color: '#2563eb' }}>Monitor</span></h1>
          <p style={styles.subtitleText}>Monitoring <b>{filteredStudents.length}</b> participants</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={handleWipeAll} style={styles.wipeBtn}>
            <FaExclamationTriangle /> Wipe All
          </button>
          <button onClick={fetchData} style={styles.syncBtn}>
            <FaSync /> {isMobile ? "Sync" : "Sync Records"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...styles.filterRow, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            style={styles.input}
            placeholder="Search name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.dropdownBox}>
          <FaFilter color="#2563eb" size={12} />
          <select style={styles.select} value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
            <option value="all">All Rounds</option>
            {activeRounds.map((r, i) => (<option key={i} value={r}>{r.toUpperCase()}</option>))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Round</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td style={styles.td}><strong>{s.studentName?.toUpperCase()}</strong></td>
                    <td style={styles.td}>{s.studentMobile}</td>
                    <td style={styles.td}><span style={styles.roundBadge}>{s.quizRound}</span></td>
                    <td style={styles.td}><b style={{ color: '#2563eb' }}>{s.score}</b> / {s.totalQuestions || 0}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleResetAccess(s.id, s.studentName)} style={styles.resetBtn}>
                        <FaUndo /> Reset
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={styles.emptyTd}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .table-row:hover { background: #f8fafc; }
        .swal-premium-popup { border-radius: 24px !important; padding: 2rem !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 12px !important; padding: 12px 24px !important; border: none !important; cursor: pointer; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; border-radius: 12px !important; padding: 12px 24px !important; border: none !important; margin-right: 10px !important; cursor: pointer; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "35px" },
  mainTitle: { fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 },
  subtitleText: { color: "#64748b", fontSize: "14px" },
  syncBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "12px 20px", borderRadius: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  wipeBtn: { background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", padding: "12px 20px", borderRadius: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  filterRow: { display: "flex", gap: "15px", marginBottom: "30px" },
  searchBox: { flex: 2, background: "#fff", padding: "12px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" },
  dropdownBox: { flex: 1, background: "#fff", padding: "0 15px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center" },
  input: { border: "none", outline: "none", width: "100%", fontWeight: "600" },
  select: { border: "none", outline: "none", width: "100%", height: "50px", fontWeight: "700" },
  tableCard: { background: "#fff", borderRadius: "24px", border: "1px solid #f1f5f9", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", padding: "18px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "800" },
  td: { padding: "18px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px" },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "8px", fontWeight: "800", fontSize: "11px" },
  resetBtn: { background: "#f8fafc", border: "none", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", color: "#94a3b8", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" },
  emptyTd: { padding: "100px", textAlign: "center", color: "#cbd5e1", fontWeight: "600" }
};

export default StudentManagement;