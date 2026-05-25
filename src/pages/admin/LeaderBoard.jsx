import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import {
  FaSearch, FaFileExcel, FaSync, FaTrashAlt, FaExclamationTriangle,
  FaLayerGroup, FaTrophy, FaUserAlt, FaSchool, FaCrown, FaEdit, FaTimesCircle
} from "react-icons/fa";
import LoadingLoader from "../../components/LoadingLoader";

function Leaderboard() {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRound, setSelectedRound] = useState("ALL");
  const [selectedSchool, setSelectedSchool] = useState("ALL");
  const [schoolLimit, setSchoolLimit] = useState(2); 
  const [isTopTwoActive, setIsTopTwoActive] = useState(false); 

  // EDIT STATE TRACKERS FOR MODAL INTERACTION
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState({
    id: "", studentName: "", studentMobile: "", score: 0, quizRound: "", schoolName: "", area: ""
  });

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
      setIsTopTwoActive(false);
      setSelectedRound("ALL");
      setSelectedSchool("ALL");
      setSearchTerm("");

      const [resAll, roundsRes] = await Promise.all([
        API.get("/admin/results/all", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/admin/questions/rounds", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const rawResults = Array.isArray(resAll.data) ? resAll.data : [];
      setResults(rawResults);
      setFilteredResults(rawResults);
      setAvailableRounds(Array.isArray(roundsRes.data) ? roundsRes.data : []);

      const uniqueSchools = [...new Set(rawResults.map(item => item.schoolName).filter(Boolean))];
      setSchoolsList(uniqueSchools);
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isTopTwoActive) return; 
    
    let dataToFilter = [...results];

    if (selectedRound !== "ALL") {
      dataToFilter = dataToFilter.filter((res) => res.quizRound === selectedRound);
    }

    if (selectedSchool !== "ALL") {
      dataToFilter = dataToFilter.filter((res) => res.schoolName === selectedSchool);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      dataToFilter = dataToFilter.filter((res) => 
        (res.studentName || "").toLowerCase().includes(term) ||
        (res.studentMobile || "").includes(term) ||
        (res.area || "").toLowerCase().includes(term)
      );
    }

    setFilteredResults(dataToFilter);
  }, [searchTerm, selectedRound, selectedSchool, results, isTopTwoActive]);

  const handleTopTwoToggle = async () => {
    try {
      setLoading(true);
      if (!isTopTwoActive) {
        const res = await API.get(`/admin/results/filter/top-two-per-school?limit=${schoolLimit}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setFilteredResults(Array.isArray(res.data) ? res.data : []);
        setIsTopTwoActive(true);
        setSelectedRound("ALL");
        setSelectedSchool("ALL");
        setSearchTerm("");
      } else {
        setIsTopTwoActive(false);
        setFilteredResults(results);
      }
    } catch (err) {
      console.error("Dynamic Extract failure:", err);
      showToast("Failed to compile custom school matrix rankings", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.put(`/admin/update-result/${editingRecord.id}`, editingRecord, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast(res.data.message || "Profile and database records synced successfully!");
      setShowEditModal(false);
      fetchData(); 
    } catch (err) {
      console.error("Profile sync failure:", err);
      showToast("Failed to safely update student profile matrices", "error");
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
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await API.delete("/admin/results/delete-all", { headers: { Authorization: `Bearer ${token}` } });
          setResults([]);
          setFilteredResults([]);
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

  const exportToExcel = () => {
    if (filteredResults.length === 0) return showToast('No data to export', "warning");
    const excelData = filteredResults.map((res, index) => ({
      Rank: index + 1,
      Name: (res.studentName || "").toUpperCase(),
      Mobile: res.studentMobile,
      School: res.schoolName || "N/A",
      Area: res.area || "N/A",
      Score: `${res.score} / ${res.totalQuestions}`,
      Round: res.quizRound,
      Time: new Date(res.timestamp).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
    XLSX.writeFile(workbook, `Leaderboard_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Successful');
  };

  return (
    <div style={{ ...styles.container, padding: isMobile ? "16px" : "40px" }}>
      <div style={styles.meshOne}></div>
      <div style={styles.meshTwo}></div>
      
      {/* FLOATING ADMIN EDIT PROFILE MODAL */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="bounceIn">
            <div style={styles.modalHeader}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <h2 style={{margin:0, fontWeight:900, fontSize:'22px', color:'#0f172a', letterSpacing: '-0.5px'}}>Correct Record</h2>
                <p style={{margin:0, fontSize: '13px', color: '#64748b', fontWeight: 600}}>Modify performance attributes safely</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={styles.closeModalXBtn}><FaTimesCircle size={24}/></button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={styles.formGrid}>
              <div style={styles.inputFieldGroup}>
                <label style={styles.fieldLabel}>Student Name</label>
                <input type="text" style={styles.modalInput} value={editingRecord.studentName} onChange={(e) => setEditingRecord({...editingRecord, studentName: e.target.value})} required />
              </div>

              <div style={styles.inputFieldGroup}>
                <label style={styles.fieldLabel}>Mobile Number (Registry Reference)</label>
                <input type="text" style={styles.modalInput} value={editingRecord.studentMobile} onChange={(e) => setEditingRecord({...editingRecord, studentMobile: e.target.value})} required />
              </div>

              <div style={styles.inputFieldGroup}>
                <label style={styles.fieldLabel}>Obtained Score (Marks)</label>
                <input type="number" style={styles.modalInput} value={editingRecord.score} onChange={(e) => setEditingRecord({...editingRecord, score: parseInt(e.target.value) || 0})} required />
              </div>

              <div style={styles.inputFieldGroup}>
                <label style={styles.fieldLabel}>School / Institution Name</label>
                <input type="text" style={styles.modalInput} value={editingRecord.schoolName || ""} onChange={(e) => setEditingRecord({...editingRecord, schoolName: e.target.value})} />
              </div>

              <div style={styles.inputFieldGroup}>
                <label style={styles.fieldLabel}>Region / Area Location</label>
                <input type="text" style={styles.modalInput} value={editingRecord.area || ""} onChange={(e) => setEditingRecord({...editingRecord, area: e.target.value})} />
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.modalCancelBtn}>Discard</button>
                <button type="submit" style={styles.modalSaveBtn}>Save & Cascade Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={{ ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div style={{ zIndex: 2 }}>
          <h1 style={{ ...styles.title, fontSize: isMobile ? "28px" : "38px" }}>
            Hall of <span style={{ color: "#2563eb" }}>Fame</span>
          </h1>
          <p style={styles.subtitle}>
            Global Standings: <span style={styles.countPill}>{filteredResults.length}</span> Candidates
          </p>
        </div>
        <div style={{ ...styles.actionGroup, width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
          
          {!isTopTwoActive && (
            <div style={styles.limitInputWrapper}>
              <span style={styles.limitTextLabel}>TOP:</span>
              <input 
                type="number" 
                min="1" 
                max="50" 
                value={schoolLimit} 
                onChange={(e) => setSchoolLimit(parseInt(e.target.value) || 1)}
                style={styles.limitInputField}
              />
            </div>
          )}

          <button 
            onClick={handleTopTwoToggle}
            className="btn-interact-pri"
            style={{
              ...styles.masterQueryBtn,
              background: isTopTwoActive ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #10b981, #059669)"
            }}
          >
            <FaCrown /> {isTopTwoActive ? "Show All Records" : `Extract Top ${schoolLimit} / School`}
          </button>
          
          <button onClick={fetchData} className="btn-interact-sec" style={styles.syncBtn} title="Sync/Reset Data"><FaSync /></button>
          <button onClick={handleDeleteAll} className="btn-interact-sec" style={styles.deleteAllBtn}><FaExclamationTriangle /> Reset</button>
          <button onClick={exportToExcel} className="btn-interact-pri" style={styles.exportBtn}><FaFileExcel /> Export Excel</button>
        </div>
      </div>

      {/* THREE-COLUMN MULTI-FILTER BAR CONTROLS */}
      <div style={{ ...styles.filterWrap, gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr" }}>
        <div style={styles.searchBox}>
          <FaSearch color="#cbd5e1" />
          <input
            style={styles.input}
            placeholder="Search by name, phone, or area/region..."
            value={searchTerm}
            disabled={isTopTwoActive}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.selectBox}>
          <FaLayerGroup color="#2563eb" size={12} />
          <select style={styles.select} value={selectedRound} disabled={isTopTwoActive} onChange={(e) => setSelectedRound(e.target.value)}>
            <option value="ALL">All Categories</option>
            {availableRounds.map((r, i) => (
              <option key={i} value={r}>{r.replace("_", " ").toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div style={styles.selectBox}>
          <FaSchool color="#2563eb" size={12} />
          <select style={styles.select} value={selectedSchool} disabled={isTopTwoActive} onChange={(e) => setSelectedSchool(e.target.value)}>
            <option value="ALL">All Schools</option>
            {schoolsList.map((school, i) => (
              <option key={i} value={school}>{school.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {isTopTwoActive && (
        <div style={styles.alertNoticePanel}>
          ⚠️ Analytical Mode Active: Showing exclusively top {schoolLimit} highest performance scoring records isolated per individual school groupings.
        </div>
      )}

      {/* MAIN RECORDS GRID ANALYSIS TABLE */}
      <div className="main-glass-panel" style={styles.tableCard}>
        <div style={styles.tableTop}><div style={styles.tableTitle}>Rank Performance Analysis Matrix</div></div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px" }}>Rank</th>
                <th style={{ ...styles.th, width: "220px" }}><FaUserAlt style={{ marginRight: '8px' }} /> Candidate Profile</th>
                <th style={{ ...styles.th, width: "200px" }}>School Name</th>
                <th style={{ ...styles.th, width: "160px" }}>Region/Area</th>
                <th style={{ ...styles.th, width: "180px" }}>Category</th>
                <th style={{ ...styles.th, width: "110px" }}>Score</th>
                <th style={{ ...styles.th, width: "110px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((res, index) => (
                  <tr key={res.id || index} className="table-row">
                    <td style={styles.td}>
                      <div style={{
                        ...styles.rankBadge,
                        background: index === 0 && !isTopTwoActive ? "#fef3c7" : index === 1 && !isTopTwoActive ? "#f1f5f9" : index === 2 && !isTopTwoActive ? "#fff7ed" : "#f8fafc",
                        color: index === 0 && !isTopTwoActive ? "#b45309" : "#64748b"
                      }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: "700" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{res.studentName?.toUpperCase()}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{res.studentMobile}</span>
                      </div>
                    </td>
                    {/* Fixed overlapping cells by locking standard horizontal paddings and wrapping rules */}
                    <td style={styles.td}>
                      <div style={styles.schoolCellWrapper}>
                        <span style={styles.schoolPill}>{res.schoolName || "N/A"}</span>
                      </div>
                    </td>
                    <td style={styles.td}><span style={styles.areaText}>{res.area || "N/A"}</span></td>
                    <td style={styles.td}>
                      <div style={styles.categoryCellWrapper}>
                        <span style={styles.roundBadge}>{res.quizRound ? res.quizRound.replace("_", " ") : "N/A"}</span>
                      </div>
                    </td>
                    <td style={styles.scoreTd}>{res.score} <span style={{fontSize:'12px', color:'#94a3b8', fontWeight: '500'}}>/ {res.totalQuestions || 5}</span></td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <button onClick={() => openEditModal(res)} className="edit-row-btn" style={styles.editBtn} title="Correct Profile parameters"><FaEdit /></button>
                        <button onClick={() => handleDelete(res.id, res.studentName)} className="delete-row-btn" style={styles.deleteBtn} title="Wipe Record"><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={styles.emptyTd}>No compilation assets found matching data validation criteria.</td></tr>
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
        .edit-row-btn:hover { background: #eff6ff !important; color: #2563eb !important; transform: scale(1.1); }
        .delete-row-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; transform: scale(1.1); }
        .swal-premium-popup { border-radius: 28px !important; padding: 2.5rem !important; background: #fff !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 25px 50px 12px rgba(0,0,0,0.1) !important; }
        .swal-premium-title { color: #0f172a !important; font-size: 22px !important; font-weight: 900 !important; letter-spacing: -1px !important; margin-bottom: 12px !important; }
        .swal-premium-html { color: #64748b !important; font-size: 15px !important; line-height: 1.6 !important; }
        .swal-premium-confirm { background: #2563eb !important; color: #fff !important; border-radius: 12px !important; padding: 14px 28px !important; font-weight: 700 !important; border: none !important; cursor: pointer; margin-left: 10px !important; }
        .swal-premium-cancel { background: #f1f5f9!important; color: #64748b !important; border-radius: 12px !important; padding: 14px 28px !important; font-weight: 700 !important; border: none !important; cursor: pointer; }
        .swal-toast-popup { border-radius: 18px !important; padding: 12px 20px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(10px) !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
        .bounceIn { animation: bounceIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes bounceIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
  actionGroup: { display: "flex", gap: "12px", alignItems: 'center' },
  limitInputWrapper: { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0 12px', height: '45px', boxShadow: "0 4px 12px rgba(0,0,0,0.01)" },
  limitTextLabel: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginRight: '6px', letterSpacing: '0.5px' },
  limitInputField: { width: '40px', border: 'none', outline: 'none', fontWeight: '900', color: '#2563eb', fontSize: '15px', background: 'transparent' },
  masterQueryBtn: { border: "none", color: "#fff", padding: "12px 22px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", transition: "0.3s ease", fontSize: "13px" },
  syncBtn: { border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", width: '45px', height: '45px', borderRadius: "14px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' },
  deleteAllBtn: { border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", height: '45px', padding: "0 22px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "10px", alignItems: "center", transition: '0.3s' },
  exportBtn: { border: "none", background: "#059669", color: "#fff", height: '45px', padding: "0 25px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", display: "flex", gap: "10px", alignItems: "center", transition: '0.3s' },
  filterWrap: { display: "grid", gap: "15px", marginBottom: "20px", position: 'relative', zIndex: 10 },
  searchBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px 22px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" },
  input: { border: "none", outline: "none", width: "100%", fontSize: "15px", fontWeight: "600", color: '#1e293b', background: 'transparent' },
  selectBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "0 18px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" },
  select: { width: "100%", height: "55px", border: "none", outline: "none", background: "transparent", fontWeight: "700", cursor: "pointer", fontSize: "14px", color: '#1e293b' },
  alertNoticePanel: { margin: "-10px 0 25px", background: "#fff7ed", border: "1px solid #ffedd5", padding: "12px 20px", borderRadius: "14px", fontSize: "13px", color: "#c2410c", fontWeight: "700", position: "relative", zIndex: 10 },
  tableCard: { background: "#ffffffcc", backdropFilter: 'blur(10px)', border: "1px solid #f1f5f9", borderRadius: "32px", overflow: "hidden", boxShadow: "0 15px 35px rgba(0,0,0,0.03)", position: 'relative', zIndex: 10 },
  table: { width: "100%", borderCollapse: "collapse", layout: "fixed" },
  tableTop: { padding: "20px 28px", borderBottom: "1px solid #f1f5f9", background: "rgba(255,255,255,0.5)" },
  tableTitle: { fontWeight: "800", color: "#1e293b", fontSize: "16px" },
  th: { background: "#f8fafc", padding: "18px 20px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "800", letterSpacing: "1px", borderBottom: '1px solid #f1f5f9' },
  td: { padding: "20px 20px", borderBottom: "1px solid #f8fafc", fontSize: "14px", color: "#334155", verticalAlign: "middle" },
  
  // 🎯 SPACING CELL WRAPPERS: Prevents items from overflowing or crashing into each other
  schoolCellWrapper: { display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  categoryCellWrapper: { display: "block", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  schoolPill: { background: "#eff6ff", color: "#2563eb", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" },
  areaText: { color: "#64748b", fontWeight: "700" },
  rankBadge: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "13px" },
  roundBadge: { background: "#f0fdf4", color: "#16a34a", padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", textTransform: 'uppercase', display: "inline-block" },
  scoreTd: { padding: "20px 20px", borderBottom: "1px solid #f8fafc", fontWeight: "900", color: "#2563eb", fontSize: "20px" },
  editBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: '40px', height: '40px', borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  deleteBtn: { border: "none", background: "#f8fafc", color: "#94a3b8", width: '40px', height: '40px', borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  emptyTd: { textAlign: "center", padding: "100px", color: "#cbd5e1", fontWeight: "600", fontSize: "16px" },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.40)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { background: '#ffffff', width: '90%', maxWidth: '540px', borderRadius: '32px', padding: '35px', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.15)', border: '1px solid #f1f5f9', position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' },
  closeModalXBtn: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s', padding: 0 },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' },
  inputFieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', width: '100%' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' },
  modalInput: { width: '100%', height: '50px', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b', outline: 'none', background: '#f8fafc', transition: 'all 0.2s ease' },
  modalActionsRow: { display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end', width: '100%' },
  modalCancelBtn: { padding: '14px 24px', borderRadius: '14px', background: '#f1f5f9', color: '#64748b', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', transition: '0.2s' },
  modalSaveBtn: { padding: '14px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', fontSize: '14px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', transition: '0.2s' }
};

export default Leaderboard;