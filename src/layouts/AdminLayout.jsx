import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

export function AdminLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Screen size check karne ke liye (Sidebar margin handle karne ko)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.layoutContainer}>
      {/* Sidebar fixed rahega ya mobile menu ban jayega */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main style={{
        ...styles.mainContent,
        marginLeft: isMobile ? "0" : "260px", // 🔥 Mobile par margin khatam
        padding: isMobile ? "80px 15px 20px 15px" : "40px", // 🔥 Top bar ke liye space
      }}>
        <div style={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  layoutContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc", 
  },
  
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0, 
    transition: "margin-left 0.3s ease-in-out", // Smooth transition
  },

  contentWrapper: {
    maxWidth: "1200px", 
    width: "100%",
    margin: "0 auto", 
  }
};

export default AdminLayout;