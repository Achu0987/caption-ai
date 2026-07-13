import React from "react";
import { Sliders, Check } from "lucide-react";
import { CAPTION_PRESETS } from "../data/sampleData";

export default function StyleSelector({ selectedPreset, onSelect }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Sliders size={18} color="#4f46e5" />
        <h3 style={styles.title}>Select Caption Style</h3>
      </div>
      <p style={styles.subtitle}>
        Choose a typography template for your captions. Each style features unique animations and layouts.
      </p>

      <div style={styles.grid}>
        {CAPTION_PRESETS.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelect(preset)}
              className="card-hover-mini"
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
              }}
            >
              {isSelected && (
                <div style={styles.checkBadge}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </div>
              )}
              <div style={styles.cardHeader}>
                <h4 style={styles.cardTitle}>{preset.name}</h4>
              </div>
              <div style={styles.previewContainer}>
                {/* Live simulation of caption rendering */}
                <div style={styles.previewBox}>
                  {preset.id === "mrbeast" && (
                    <div className="caption-style-mrbeast">
                      <span className="word">THIS</span>{" "}
                      <span className="word active word-green">IS</span>{" "}
                      <span className="word word-yellow">BEAST</span>
                    </div>
                  )}
                  {preset.id === "hormozi" && (
                    <div className="caption-style-hormozi">
                      <span className="word">SCALE</span>{" "}
                      <span className="word active">YOUR</span>{" "}
                      <span className="word">BIZ</span>
                    </div>
                  )}
                  {preset.id === "minimalist" && (
                    <div className="caption-style-minimalist" style={{ transform: "scale(0.85)" }}>
                      <span className="word">Clean</span>{" "}
                      <span className="word active">modern</span>{" "}
                      <span className="word">pill</span>
                    </div>
                  )}
                  {preset.id === "cyberpunk" && (
                    <div className="caption-style-cyberpunk">
                      <span className="word">NEON</span>{" "}
                      <span className="word active">GLOW</span>{" "}
                      <span className="word">GRID</span>
                    </div>
                  )}
                  {preset.id === "karaoke" && (
                    <div className="caption-style-karaoke">
                      <span className="word passed">Grad</span>{" "}
                      <span className="word active">fill</span>{" "}
                      <span className="word">text</span>
                    </div>
                  )}
                  {preset.id === "banger" && (
                    <div className="caption-style-banger" style={{ transform: "scale(0.55)" }}>
                      <span className="word passed">ANOTHER</span>{" "}
                      <span className="word active">BANGER</span>
                    </div>
                  )}
                  {preset.id === "realestate" && (
                    <div className="caption-style-realestate" style={{ transform: "scale(0.7)" }}>
                      <span className="word word-magenta">BUYING</span>{" "}
                      <span className="word">OR</span>{" "}
                      <span className="word word-orange">SELLING</span>
                    </div>
                  )}
                  {preset.id === "netflix" && (
                    <div className="caption-style-netflix" style={{ transform: "scale(0.8)" }}>
                      <span className="word">Cinematic</span>{" "}
                      <span className="word">dialogue</span>
                    </div>
                  )}
                  {preset.id === "tiktok" && (
                    <div className="caption-style-tiktok" style={{ transform: "scale(0.8)" }}>
                      <span className="word">Native</span>{" "}
                      <span className="word active">social</span>{" "}
                      <span className="word">media</span>
                    </div>
                  )}
                  {preset.id === "typewriter" && (
                    <div className="caption-style-typewriter" style={{ transform: "scale(0.8)" }}>
                      <span className="word passed">Typing</span>{" "}
                      <span className="word active">out</span>{" "}
                      <span className="word">code</span>
                    </div>
                  )}
                  {preset.id === "imessage" && (
                    <div className="caption-style-imessage" style={{ transform: "scale(0.8)" }}>
                      <span className="word passed">POV</span>{" "}
                      <span className="word active">text</span>{" "}
                      <span className="word">message</span>
                    </div>
                  )}
                  {preset.id === "news" && (
                    <div className="caption-style-news" style={{ transform: "scale(0.65)", width: "100%" }}>
                      <span className="word passed">LIVE</span>{" "}
                      <span className="word active">BROADCAST</span>
                    </div>
                  )}
                  {preset.id === "game" && (
                    <div className="caption-style-game" style={{ transform: "scale(0.75)" }}>
                      <span className="word passed">PRESS</span>{" "}
                      <span className="word active">START</span>
                    </div>
                  )}
                  {preset.id === "podcast" && (
                    <div className="caption-style-podcast" style={{ transform: "scale(0.75)" }}>
                      <span className="word passed">Deep</span>{" "}
                      <span className="word active">dive</span>{" "}
                      <span className="word">interview</span>
                    </div>
                  )}
                  {preset.id === "comic" && (
                    <div className="caption-style-comic" style={{ transform: "scale(0.55)" }}>
                      <span className="word passed">KABOOM</span>{" "}
                      <span className="word active">POW</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.cardFooter}>
                <p style={styles.cardDesc}>{preset.description}</p>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Font:</span>
                  <span style={styles.metaVal}>{preset.font.split(",")[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffffff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)",
    marginBottom: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginBottom: "16px",
    lineHeight: "1.4",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    borderRadius: "12px",
    overflow: "hidden",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e2e8f0",
    cursor: "pointer",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f3ff",
    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.05)",
  },
  checkBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#4f46e5",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.3)",
    zIndex: 2,
  },
  cardHeader: {
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  previewContainer: {
    height: "80px",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  previewBox: {
    transform: "scale(0.75)",
    width: "100%",
    textAlign: "center",
  },
  cardFooter: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "8px",
  },
  cardDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
    lineHeight: "1.3",
    flexGrow: 1,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "6px",
  },
  metaLabel: {
    color: "#94a3b8",
    fontWeight: 500,
  },
  metaVal: {
    color: "#475569",
    fontWeight: 600,
  },
};
