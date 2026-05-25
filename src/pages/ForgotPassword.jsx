import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../api/axios";
import {
  FaEnvelope,
  FaMobileAlt,
  FaUser,
  FaLock,
  FaArrowLeft,
  FaShieldAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [resetType, setResetType] = useState("EMAIL");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    mobile: "",
    name: "",
    tokenOrOtp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Detect token from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("token");
    const emailFromUrl = queryParams.get("email");

    if (tokenFromUrl) {
      setFormData((prev) => ({
        ...prev,
        tokenOrOtp: tokenFromUrl,
        email: emailFromUrl || prev.email,
      }));

      setStep(2);
      setResetType("EMAIL");
    }
  }, [location]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Request Recovery
  const handleRequest = async (e) => {
    e.preventDefault();

    setLoading(true);

    const payload =
      resetType === "EMAIL"
        ? {
            type: "EMAIL",
            identifier: formData.email,
          }
        : {
            type: "MOBILE",
            identifier: formData.mobile,
            name: formData.name,
          };

    try {
      const res = await API.post(
        "/auth/forgot-password/request",
        payload
      );

      Swal.fire({
        title: "Sent!",
        text: res.data.message,
        icon: "success",
        confirmButtonColor: "#2563eb",
      });

      setStep(2);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Request failed!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleReset = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return Swal.fire(
        "Error",
        "Passwords match nahi ho rahe!",
        "error"
      );
    }

    setLoading(true);

    try {
      const payload = {
        tokenOrOtp: formData.tokenOrOtp,
        newPassword: formData.newPassword,
        name: resetType === "MOBILE" ? formData.name : null,
        identifier:
          resetType === "EMAIL"
            ? formData.email
            : formData.mobile,
      };

      await API.post("/auth/reset-password", payload);

      Swal.fire(
        "Success!",
        "Password updated! Login now.",
        "success"
      );

      navigate("/login");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Reset failed!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-viewport">
      {/* BACKGROUND */}
      <div className="gradient-bg"></div>

      {/* BLOBS */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* GRID */}
      <div className="grid-overlay"></div>

      {/* QUIZ FLOATING ITEMS */}
      <div className="quiz-bg">
        <span className="quiz-item q1">A+</span>
        <span className="quiz-item q2">?</span>
        <span className="quiz-item q3">π</span>
        <span className="quiz-item q4">√</span>
        <span className="quiz-item q5">%</span>
        <span className="quiz-item q6">1 + 1</span>
        <span className="quiz-item q7">⚡</span>
        <span className="quiz-item q8">✓</span>
        <span className="quiz-item q9">✦</span>
        <span className="quiz-item q10">∞</span>
      </div>

      {/* FLOATING BUBBLES */}
      <ul className="bubbles-container">
        {[...Array(8)].map((_, i) => (
          <li key={i} className={`bubble b${i + 1}`}></li>
        ))}
      </ul>

      {/* CARD */}
      <div className="login-card" style={styles.card}>
        {/* HEADER */}
        <div style={styles.headerBox}>
          <div className="logo-icon">
            <FaShieldAlt />
          </div>

          <h2 style={styles.title}>
            {step === 1
              ? "Recover Account"
              : "Create New Password"}
          </h2>

          <p style={styles.subtitle}>
            {step === 1
              ? "Choose your recovery method"
              : "Enter your new secure password"}
          </p>
        </div>

        {/* STEP 1 */}
        {step === 1 ? (
          <form onSubmit={handleRequest} style={styles.formBase}>
            <div style={styles.toggleRow}>
              <button
                type="button"
                className={
                  resetType === "EMAIL"
                    ? "active-tab"
                    : "tab"
                }
                onClick={() => setResetType("EMAIL")}
              >
                <FaEnvelope />
                Email
              </button>

              <button
                type="button"
                className={
                  resetType === "MOBILE"
                    ? "active-tab"
                    : "tab"
                }
                onClick={() => setResetType("MOBILE")}
              >
                <FaMobileAlt />
                Mobile
              </button>
            </div>

            {resetType === "EMAIL" ? (
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.icon} />

                <input
                  type="email"
                  name="email"
                  placeholder="Registered Email"
                  required
                  onChange={handleChange}
                  value={formData.email}
                  style={styles.input}
                />
              </div>
            ) : (
              <div style={styles.stepWrapper}>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.icon} />

                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    required
                    onChange={handleChange}
                    value={formData.name}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <FaPhoneAlt style={styles.icon} />

                  <input
                    type="text"
                    name="mobile"
                    placeholder="Mobile Number"
                    required
                    maxLength="10"
                    onChange={handleChange}
                    value={formData.mobile}
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-glow"
              style={styles.btn}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : "Send Recovery Code"}
            </button>
          </form>
        ) : (
          /* STEP 2 */
          <form onSubmit={handleReset} style={styles.formBase}>
            <div style={styles.stepWrapper}>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />

                <input
                  type="text"
                  name="tokenOrOtp"
                  placeholder="Token / OTP"
                  required
                  onChange={handleChange}
                  value={formData.tokenOrOtp}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />

                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  required
                  onChange={handleChange}
                  value={formData.newPassword}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  required
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  style={styles.input}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "22px",
              }}
            >
              <button
                type="button"
                onClick={() => setStep(1)}
                style={styles.backBtn}
              >
                <FaArrowLeft />
              </button>

              <button
                type="submit"
                className="btn-glow"
                style={styles.btn}
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* FOOTER */}
        <div style={styles.footer}>
          <Link to="/login" style={styles.link}>
            <FaArrowLeft />
            Back to Login
          </Link>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0;
          }

          10%{
            opacity: .5;
          }

          100% {
            transform: translateY(-1200px) scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blobMove {
          0% {
            transform: translate(0,0) scale(1);
          }

          33% {
            transform: translate(30px,-40px) scale(1.1);
          }

          66% {
            transform: translate(-20px,30px) scale(.95);
          }

          100% {
            transform: translate(0,0) scale(1);
          }
        }

        @keyframes floatQuiz {
          0% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-30px) rotate(8deg);
          }

          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        .main-viewport {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
        }

        /* MAIN BACKGROUND */
        .gradient-bg {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(circle at top left, rgba(59,130,246,.12), transparent 28%),
            radial-gradient(circle at bottom right, rgba(168,85,247,.12), transparent 30%),
            linear-gradient(
              135deg,
              #f8fafc,
              #eef2ff,
              #f8fafc,
              #eff6ff
            );

          background-size: 400% 400%;
          animation: gradientMove 16s ease infinite;
          z-index: 0;
        }

        /* BLOBS */
        .blob {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          opacity: .55;
          animation: blobMove 14s ease-in-out infinite;
        }

        .blob-1 {
          width: 300px;
          height: 300px;
          background: rgba(59,130,246,.25);
          top: -100px;
          left: -50px;
        }

        .blob-2 {
          width: 280px;
          height: 280px;
          background: rgba(168,85,247,.18);
          bottom: -80px;
          right: -50px;
          animation-delay: 2s;
        }

        .blob-3 {
          width: 220px;
          height: 220px;
          background: rgba(14,165,233,.18);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }

        /* GRID */
        .grid-overlay {
          position: absolute;
          inset: 0;

          background-image:
            linear-gradient(rgba(15,23,42,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,.03) 1px, transparent 1px);

          background-size: 50px 50px;
          z-index: 1;

          mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
        }

        /* QUIZ ITEMS */
        .quiz-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }

        .quiz-item {
          position: absolute;
          color: rgba(37,99,235,.12);
          font-weight: 800;
          user-select: none;
          animation: floatQuiz 18s linear infinite;
        }

        .q1 {
          top: 10%;
          left: 8%;
          font-size: 70px;
        }

        .q2 {
          top: 18%;
          right: 10%;
          font-size: 90px;
          animation-duration: 14s;
        }

        .q3 {
          top: 65%;
          left: 12%;
          font-size: 100px;
          animation-duration: 16s;
        }

        .q4 {
          top: 75%;
          right: 15%;
          font-size: 80px;
          animation-duration: 20s;
        }

        .q5 {
          top: 40%;
          left: 50%;
          font-size: 120px;
          animation-duration: 18s;
        }

        .q6 {
          top: 25%;
          left: 40%;
          font-size: 40px;
        }

        .q7 {
          top: 58%;
          right: 35%;
          font-size: 65px;
        }

        .q8 {
          top: 82%;
          left: 45%;
          font-size: 50px;
        }

        .q9 {
          top: 8%;
          left: 60%;
          font-size: 60px;
        }

        .q10 {
          top: 50%;
          right: 5%;
          font-size: 100px;
        }

        /* FLOATING BUBBLES */
        .bubbles-container {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        .bubble {
          position: absolute;
          list-style: none;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 50%;
          bottom: -150px;
          animation: floatUp linear infinite;
        }

        .b1 { left: 8%; width: 80px; height: 80px; animation-duration: 18s; }
        .b2 { left: 18%; width: 20px; height: 20px; animation-duration: 12s; }
        .b3 { left: 30%; width: 60px; height: 60px; animation-duration: 22s; }
        .b4 { left: 45%; width: 100px; height: 100px; animation-duration: 28s; }
        .b5 { left: 62%; width: 30px; height: 30px; animation-duration: 14s; }
        .b6 { left: 75%; width: 70px; height: 70px; animation-duration: 25s; }
        .b7 { left: 88%; width: 50px; height: 50px; animation-duration: 19s; }
        .b8 { left: 96%; width: 25px; height: 25px; animation-duration: 11s; }

        /* CARD */
        .login-card {
          position: relative;
          z-index: 10;
          animation: fadeIn .45s ease;
        }

        .logo-icon {
          width: 74px;
          height: 74px;
          border-radius: 26px;

          background:
            linear-gradient(135deg,#2563eb,#7c3aed);

          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          color: white;
          font-size: 30px;

          box-shadow:
            0 15px 35px rgba(37,99,235,.25),
            0 10px 40px rgba(124,58,237,.22);
        }

        .active-tab,
        .tab {
          flex: 1;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: .25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tab {
          background: transparent;
          color: #64748b;
        }

        .tab:hover {
          background: rgba(255,255,255,.5);
        }

        .active-tab {
          background: white;
          color: #2563eb;

          box-shadow:
            0 8px 20px rgba(15,23,42,.08);
        }

        input {
          transition: .25s ease !important;
        }

        input:focus {
          border-color: #3b82f6 !important;
          background: white !important;

          box-shadow:
            0 0 0 5px rgba(59,130,246,.12);
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
        }

        .btn-glow::before {
          content: "";
          position: absolute;
          inset: 0;

          background: linear-gradient(
            120deg,
            transparent,
            rgba(255,255,255,.18),
            transparent
          );

          transform: translateX(-100%);
        }

        .btn-glow:hover::before {
          transform: translateX(100%);
          transition: 1s;
        }

        .btn-glow:hover {
          transform: translateY(-2px);

          box-shadow:
            0 18px 35px rgba(59,130,246,.18);
        }

        .btn-glow:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {

          .login-card {
            width: 100% !important;
          }

          .logo-icon{
            width: 62px;
            height: 62px;
            font-size: 24px;
          }

          .active-tab,
          .tab{
            font-size: 13px;
            padding: 12px;
          }

          .quiz-item{
            opacity:.5;
          }

          .q5,
          .q10{
            display:none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "42px",
    background: "rgba(255,255,255,.72)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "32px",
    border: "1px solid rgba(255,255,255,.7)",

    boxShadow: `
      0 25px 60px rgba(15,23,42,.08),
      inset 0 1px 1px rgba(255,255,255,.8)
    `,
  },

  headerBox: {
    marginBottom: "30px",
    textAlign: "center",
  },

  title: {
    fontWeight: "900",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-1px",
    fontSize: "32px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "8px",
    fontWeight: "600",
    lineHeight: "22px",
  },

  toggleRow: {
    display: "flex",
    background: "rgba(241,245,249,.8)",
    padding: "6px",
    borderRadius: "18px",
    marginBottom: "24px",
    backdropFilter: "blur(12px)",
  },

  formBase: {
    display: "flex",
    flexDirection: "column",
  },

  stepWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  inputWrapper: {
    position: "relative",
  },

  icon: {
    position: "absolute",
    left: "18px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "15px",
  },

  input: {
    width: "100%",
    padding: "17px 18px 17px 54px",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    background: "rgba(248,250,252,.9)",
  },

  btn: {
    flex: 1,

    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",

    color: "#fff",
    border: "none",
    padding: "18px",
    borderRadius: "18px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all .3s ease",
    letterSpacing: ".3px",
    marginTop: "24px",

    boxShadow:
      "0 10px 30px rgba(59,130,246,.2)",
  },

  backBtn: {
    width: "62px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "rgba(255,255,255,.7)",
    backdropFilter: "blur(10px)",
    color: "#334155",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: ".25s ease",
  },

  footer: {
    marginTop: "30px",
    textAlign: "center",
    borderTop: "1px solid rgba(226,232,240,.7)",
    paddingTop: "24px",
  },

  link: {
    color: "#2563eb",
    fontWeight: "800",
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
  },
};

export default ForgotPassword;