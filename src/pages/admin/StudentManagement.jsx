import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import Swal from "sweetalert2";
import {
  FaSearch, FaUndo, FaSync, FaFilter, FaUserGraduate, FaPhoneAlt, FaFlag
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
      // FIX: Added leading slashes to paths
      const [res, roundsRes] = await Promise.all([
        API.get("/admin/results/all"),
        API.get("/admin/questions/rounds")
      ]);
      setStudents(res.data || []);
      setActiveRounds(roundsRes.data || []);
    } catch (err) {
      console.error("Fetch failed", err);
      // Unauthorized check
      if (err.response?.status === 403) {
        console.error("DEBUG: Admin access denied. Check your token or role.");
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
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({ icon, title: msg });
  };

  const handleResetAccess = (id, name) => {
    Swal.fire({
      ...premiumAlert,
      title: 'Reset Attempt?',
      text: `Are you sure you want to clear the data for ${name.toUpperCase()}? This allows a fresh re-attempt.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset Now',
      cancelButtonText: 'Keep Record',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // FIX: Added leading slash[cite: 4]
          await API.delete(`/admin/delete-result/${id}`);
          showToast('Access Reset Successful');
          fetchData();
        } catch (err) {
          showToast('Operation Failed', 'error');
        }
      }
    });
  };

  const filteredStudents = students.filter((s) => {
    const name = s.studentName ? s.studentName.toLowerCase() : "";
    const mobile = s.studentMobile ? s.studentMobile : "";
    const round = s.quizRound ? s.quizRound : "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = name.includes(search) || mobile.includes(search);
    const matchesRound = roundFilter === "all" ? true : round === roundFilter;

    return matchesSearch && matchesRound;
  });

  if (loading) return <LoadingLoader message="Syncing Candidate Database..." type="scan" />;

  return (
    <div style={styles.container}>
      <div style={styles.bgCircleLeft}></div>
      <div style={styles.bgCircleRight}></div>

      <div style={{ ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div style={{ zIndex: 10 }}>
          <h1 style={styles.mainTitle}>Candidate <span style={{ color: '#2563eb' }}>Monitor</span></h1>
          <p style={styles.subtitleText}>Tracking <b>{filteredStudents.length}</b> active participants</p>
        </div>
        <button onClick={fetchData} className="sync-btn-hover" style={styles.syncBtn}>
          <FaSync /> {isMobile ? "Refresh" : "Sync Records"}
        </button>
      </div>

      <div style={{ ...styles.filterRow, flexDirection: isMobile ? 'column' : 'row' }}>
        <div className="search-box-focus" style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            style={styles.input}
            placeholder="Filter by name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ ...styles.dropdownBox, width: isMobile ? '100%' : 'auto' }}>
          <FaFilter color="#2563eb" size={12} />
          <select style={styles.select} value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
            <option value="all">All Active Rounds</option>
            {activeRounds.map((roundName, index) => (
              <option key={index} value={roundName}>{roundName.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card-table" style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Assigned Round</th>
                <th style={styles.th}>Performance</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="table-row-hover" style={styles.row}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                        {s.studentName?.toUpperCase()}
                      </div>
                    </td>
                    <td style={styles.td}><span style={{ color: '#64748b', fontWeight: '600' }}>{s.studentMobile}</span></td>
                    <td style={styles.td}><span style={styles.roundBadge}>{s.quizRound}</span></td>
                    <td style={styles.td}>
                      <div style={styles.scoreContainer}>
                        <span style={styles.scoreText}>{s.score}</span>
                        <span style={styles.totalText}>/ {s.totalQuestions || 0}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleResetAccess(s.id, s.studentName)} className="reset-btn-hover" style={styles.resetBtn}>
                        <FaUndo size={11} /> Reset
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={styles.emptyTd}>No candidate records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .glass-card-table { background: #ffffffcc; backdrop-filter: blur(10px); }
        .table-row-hover:hover { background: #f8fafc; transition: 0.2s; }
        .sync-btn-hover:hover { background: #f1f5f9 !important; transform: scale(1.02); }
        .reset-btn-hover:hover { background: #ef4444 !important; color: #fff !important; transform: scale(1.05); transition: 0.3s; }
        .search-box-focus:focus-within { border-color: #2563eb !important; box-shadow: 0 0 0 4px rgba(37,99,235,0.05); }
        .swal-premium-popup { border-radius: 24px !important; padding: 2.5rem !important; }
        .swal-premium-confirm { background: #0f172a !important; color: #fff !important; border-radius: 12px !important; padding: 14px 28px !important; cursor: pointer; }
        .swal-premium-cancel { background: #f1f5f9 !important; color: #64748b !important; border-radius: 12px !important; padding: 14px 28px !important; cursor: pointer; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding: '40px', background: '#f8fafc', minHeight: '100vh', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  bgCircleLeft: { position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', zIndex: 0 },
  bgCircleRight: { position: 'absolute', bottom: '10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', zIndex: 0 },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "35px", position: 'relative', zIndex: 10 },
  mainTitle: { fontSize: '38px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1.5px' },
  subtitleText: { color: "#64748b", fontSize: "14px", marginTop: "5px" },
  syncBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "12px 24px", borderRadius: "14px", cursor: "pointer", fontWeight: "700", fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' },
  filterRow: { display: "flex", gap: "15px", marginBottom: "30px", position: 'relative', zIndex: 10 },
  searchBox: { flex: 2, background: "#fff", padding: "12px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" },
  dropdownBox: { flex: 1, background: "#fff", padding: "0 15px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" },
  input: { border: "none", outline: "none", width: "100%", fontSize: "14px", color: '#1e293b', fontWeight: '500', background: 'transparent' },
  select: { border: "none", outline: "none", width: "100%", height: "50px", fontSize: "13px", fontWeight: '700', background: "transparent", cursor: 'pointer', color: '#1e293b' },
  tableCard: { background: "#fff", borderRadius: "32px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", position: 'relative', zIndex: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", padding: "18px 25px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "800", letterSpacing: "1px", borderBottom: '1px solid #f1f5f9' },
  td: { padding: "20px 25px", borderBottom: "1px solid #f8fafc", fontSize: "14px", color: '#334155', verticalAlign: 'middle' },
  scoreContainer: { display: 'flex', alignItems: 'baseline' },
  scoreText: { color: '#2563eb', fontWeight: '900', fontSize: '18px' },
  totalText: { fontSize: '12px', color: '#94a3b8', marginLeft: '4px', fontWeight: '600' },
  roundBadge: { background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", border: "1px solid #dbeafe", whiteSpace: 'nowrap', textTransform: 'uppercase' },
  resetBtn: { background: "#f8fafc", color: "#94a3b8", border: "none", padding: "10px 16px", borderRadius: "12px", cursor: "pointer", fontWeight: "800", display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', transition: '0.3s' },
  emptyTd: { padding: '100px 20px', textAlign: 'center', color: '#cbd5e1', fontWeight: '600' }
};

export default StudentManagement;