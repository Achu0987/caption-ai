import React from "react";
import { Play, Film } from "lucide-react";
import { SAMPLE_VIDEOS } from "../data/sampleData";

export default function SampleLoader({ selectedId, onSelect }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Film size={18} color="#4f46e5" />
        <h3 style={styles.title}>Or Choose a Sample Video</h3>
      </div>
      <p style={styles.subtitle}>
        Select one of these pre-transcribed videos to see the auto caption styles work in real-time.
      </p>

      <div style={styles.grid}>
        {SAMPLE_VIDEOS.map((video) => {
          const isSelected = selectedId === video.id;
          return (
            <div
              key={video.id}
              onClick={() => onSelect(video)}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
              }}
            >
              <div style={styles.thumbWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={styles.thumbnail}
                />
                <div style={styles.playOverlay}>
                  <Play size={20} color="#fff" style={styles.playIcon} />
                </div>
                <span style={styles.durationBadge}>
                  {video.duration.toFixed(1)}s
                </span>
              </div>
              <div style={styles.info}>
                <h4 style={styles.videoTitle}>{video.title}</h4>
                <p style={styles.videoDesc}>{video.description}</p>
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
    border: "1px solid rgba(226, 232, 240, 0.8)",
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
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    backgroundColor: "#f8fafc",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    ":hover": {
      transform: "translateY(-4px)",
      borderColor: "#cbd5e1",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
    },
  },
  cardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f3ff",
    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.1)",
    transform: "translateY(-2px)",
  },
  thumbWrapper: {
    position: "relative",
    height: "110px",
    width: "100%",
    backgroundColor: "#0f172a",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.85,
    transition: "opacity 0.2s",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    transition: "all 0.2s",
  },
  playIcon: {
    backgroundColor: "rgba(79, 70, 229, 0.9)",
    borderRadius: "50%",
    padding: "8px",
    boxSize: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },
  durationBadge: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    color: "#fff",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: "4px",
    backdropFilter: "blur(4px)",
  },
  info: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  videoTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
  },
  videoDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
    lineHeight: "1.3",
  },
};
