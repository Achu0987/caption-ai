import React from "react";
import { Sparkles, Video, HelpCircle, Play } from "lucide-react";

const GithubIcon = ({ size = 16, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <span style={styles.logoText}>CapFlow</span>
            <span style={styles.logoSubtext}>.AI</span>
          </div>
          <span style={styles.badge}>v1.0 Pro</span>
        </div>

        <nav style={styles.nav}>
          <a href="#features" style={styles.navLink}>
            <Video size={16} style={styles.navIcon} />
            Editor
          </a>
          <a href="#templates" style={styles.navLink}>
            <Play size={16} style={styles.navIcon} />
            Presets
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            style={styles.navLink}
          >
            <GithubIcon size={16} style={styles.navIcon} />
            GitHub
          </a>
        </nav>

        <div style={styles.ctaGroup}>
          <button style={styles.helpButton}>
            <HelpCircle size={18} />
          </button>
          <button style={styles.premiumButton}>
            Upgrade to Enterprise
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "1400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
  },
  logoText: {
    fontSize: "1.1rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#0f172a",
  },
  logoSubtext: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#4f46e5",
  },
  badge: {
    fontSize: "0.7rem",
    fontWeight: 600,
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    padding: "2px 8px",
    borderRadius: "20px",
    marginLeft: "4px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#475569",
    textDecoration: "none",
    transition: "color 0.2s ease",
    cursor: "pointer",
  },
  navIcon: {
    marginRight: "6px",
  },
  ctaGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  helpButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "50%",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  premiumButton: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
  },
};
