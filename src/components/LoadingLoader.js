import React from 'react';

const LoadingLoader = ({ message = "LOADING...", type = "spinner" }) => {
  return (
    <div className="loader-container">
      {/* 1. Standard Spinner (For Login/Upload) */}
      {type === "spinner" && <div className="glow-spinner"></div>}

      {/* 2. Radar/Scan Effect (For Leaderboard/Database) */}
      {type === "scan" && <div className="radar-scan"></div>}

      {/* 3. Pulse Blocks (For Quiz/Dashboard) */}
      {type === "pulse" && (
        <div className="pulse-wrapper">
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
        </div>
      )}

      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingLoader;