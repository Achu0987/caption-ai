import React, { useState, useRef } from "react";
import {
  List,
  Sliders,
  Type,
  Trash2,
  Plus,
  Download,
  Video,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";

export default function CaptionEditor({
  transcript,
  setTranscript,
  customStyles,
  setCustomStyles,
  currentTime,
  videoDuration,
  onExportStart,
}) {
  const [activeTab, setActiveTab] = useState("subtitles"); // 'subtitles' | 'adjust' | 'script'
  const [inputText, setInputText] = useState("");
  const activeWordRef = useRef(null);

  // Handle individual word update
  const handleWordChange = (id, newText) => {
    setTranscript(
      transcript.map((w) => (w.id === id ? { ...w, word: newText } : w))
    );
  };

  // Handle word start/end adjustments
  const adjustTime = (id, field, amount) => {
    setTranscript(
      transcript.map((w) => {
        if (w.id === id) {
          const val = parseFloat((w[field] + amount).toFixed(2));
          // Ensure start < end and values are positive
          if (field === "start" && val >= w.end) return w;
          if (field === "end" && val <= w.start) return w;
          if (val < 0) return w;
          return { ...w, [field]: val };
        }
        return w;
      })
    );
  };

  // Set individual word style color for MrBeast theme
  const toggleWordColor = (id, color) => {
    setTranscript(
      transcript.map((w) => {
        if (w.id === id) {
          return { ...w, style: w.style === color ? null : color };
        }
        return w;
      })
    );
  };

  // Delete word from transcript
  const deleteWord = (id) => {
    setTranscript(transcript.filter((w) => w.id !== id));
  };

  // Add word at the end or after active word
  const addWord = () => {
    let lastTime = 0.5;
    let newId = 1;
    
    if (transcript.length > 0) {
      lastTime = transcript[transcript.length - 1].end;
      newId = Math.max(...transcript.map(w => w.id)) + 1;
    }

    const newWord = {
      id: newId,
      word: "NewWord",
      start: parseFloat(lastTime.toFixed(2)),
      end: parseFloat((lastTime + 0.4).toFixed(2)),
      style: null
    };

    setTranscript([...transcript, newWord]);
  };

  // Load a raw script, splitting and spreading it across the video duration
  const injectFullScript = () => {
    if (!inputText.trim()) return;
    const rawWords = inputText.trim().split(/\s+/);
    const duration = videoDuration || 10;
    const timeSpread = duration / rawWords.length;
    
    const newTranscript = rawWords.map((word, idx) => {
      const start = idx * timeSpread;
      const end = (idx + 1) * timeSpread - 0.05;
      return {
        id: idx + 1,
        word: word,
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        style: null
      };
    });

    setTranscript(newTranscript);
    setInputText("");
    setActiveTab("subtitles");
  };

  return (
    <div style={styles.container}>
      {/* Editor Tabs */}
      <div style={styles.tabsHeader}>
        <button
          onClick={() => setActiveTab("subtitles")}
          className="btn-light-hover"
          style={{
            ...styles.tabBtn,
            ...(activeTab === "subtitles" ? styles.tabBtnActive : {}),
          }}
        >
          <List size={14} />
          <span>Subtitles</span>
        </button>
        <button
          onClick={() => setActiveTab("adjust")}
          className="btn-light-hover"
          style={{
            ...styles.tabBtn,
            ...(activeTab === "adjust" ? styles.tabBtnActive : {}),
          }}
        >
          <Sliders size={14} />
          <span>Style Adjust</span>
        </button>
        <button
          onClick={() => setActiveTab("script")}
          className="btn-light-hover"
          style={{
            ...styles.tabBtn,
            ...(activeTab === "script" ? styles.tabBtnActive : {}),
          }}
        >
          <Type size={14} />
          <span>Script Injector</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div style={styles.tabContent}>
        {/* TAB 1: SUBTITLES LIST */}
        {activeTab === "subtitles" && (
          <div style={styles.subListContainer}>
            <div style={styles.subListHeader}>
              <span style={styles.listCount}>
                {transcript.length} Words Timed
              </span>
              <button onClick={addWord} style={styles.addButton} className="btn-primary">
                <Plus size={14} />
                <span>Add Word</span>
              </button>
            </div>

            <div style={styles.listScroll}>
              {transcript.map((w) => {
                const isActive = currentTime >= w.start && currentTime <= w.end;
                return (
                  <div
                    key={w.id}
                    className="word-row-box"
                    style={{
                      ...styles.wordRow,
                      ...(isActive ? styles.wordRowActive : {}),
                    }}
                  >
                    <div style={styles.rowHighlightIndicator} />
                    <div style={styles.wordInputGroup}>
                      <input
                        type="text"
                        value={w.word}
                        onChange={(e) => handleWordChange(w.id, e.target.value)}
                        className="word-input-box"
                        style={{
                          ...styles.wordInput,
                          ...(isActive ? styles.wordInputActive : {}),
                        }}
                      />
                    </div>

                    {/* Time editors */}
                    <div style={styles.timeControlGroup}>
                      <div style={styles.timeCol}>
                        <span style={styles.timeTag}>IN</span>
                        <div style={styles.spinner}>
                          <button
                            onClick={() => adjustTime(w.id, "start", -0.1)}
                            style={styles.spinBtn}
                            className="btn-icon-hover"
                          >
                            -
                          </button>
                          <span style={styles.spinVal}>{w.start.toFixed(1)}s</span>
                          <button
                            onClick={() => adjustTime(w.id, "start", 0.1)}
                            style={styles.spinBtn}
                            className="btn-icon-hover"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div style={styles.timeCol}>
                        <span style={styles.timeTag}>OUT</span>
                        <div style={styles.spinner}>
                          <button
                            onClick={() => adjustTime(w.id, "end", -0.1)}
                            style={styles.spinBtn}
                            className="btn-icon-hover"
                          >
                            -
                          </button>
                          <span style={styles.spinVal}>{w.end.toFixed(1)}s</span>
                          <button
                            onClick={() => adjustTime(w.id, "end", 0.1)}
                            style={styles.spinBtn}
                            className="btn-icon-hover"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Styling presets color triggers (For MrBeast / Hormozi styles) */}
                    <div style={styles.styleTriggerRow}>
                      <button
                        onClick={() => toggleWordColor(w.id, "green")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#22c55e",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "green" ? "#000000" : "transparent"
                        }}
                        title="Green highlight"
                      />
                      <button
                        onClick={() => toggleWordColor(w.id, "yellow")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#eab308",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "yellow" ? "#000000" : "transparent"
                        }}
                        title="Yellow highlight"
                      />
                      <button
                        onClick={() => toggleWordColor(w.id, "red")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#ef4444",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "red" ? "#000000" : "transparent"
                        }}
                        title="Red highlight"
                      />
                      <button
                        onClick={() => toggleWordColor(w.id, "magenta")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#d946ef",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "magenta" ? "#000000" : "transparent"
                        }}
                        title="Magenta highlight"
                      />
                      <button
                        onClick={() => toggleWordColor(w.id, "cyan")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#06b6d4",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "cyan" ? "#000000" : "transparent"
                        }}
                        title="Cyan highlight"
                      />
                      <button
                        onClick={() => toggleWordColor(w.id, "orange")}
                        style={{
                          ...styles.colorCircle,
                          backgroundColor: "#f97316",
                          borderStyle: "solid",
                          borderWidth: "2px",
                          borderColor: w.style === "orange" ? "#000000" : "transparent"
                        }}
                        title="Orange highlight"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteWord(w.id)}
                      style={styles.deleteBtn}
                      className="btn-danger-hover"
                      title="Delete word"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STYLE SETTINGS */}
        {activeTab === "adjust" && (
          <div style={styles.settingsForm}>
            <div style={styles.formGroup}>
              <div style={styles.sliderLabelRow}>
                <span style={styles.formLabel}>Font Size</span>
                <span style={styles.formVal}>
                  {customStyles.fontSize || 1.8}rem
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={3.5}
                step={0.1}
                value={customStyles.fontSize || 1.8}
                onChange={(e) =>
                  setCustomStyles({
                    ...customStyles,
                    fontSize: parseFloat(e.target.value),
                  })
                }
                style={styles.formRange}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.sliderLabelRow}>
                <span style={styles.formLabel}>Vertical Position (Y-Axis)</span>
                <span style={styles.formVal}>
                  {customStyles.yPos !== undefined ? customStyles.yPos : 50}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={1}
                value={customStyles.yPos !== undefined ? customStyles.yPos : 50}
                onChange={(e) =>
                  setCustomStyles({
                    ...customStyles,
                    yPos: parseInt(e.target.value),
                  })
                }
                style={styles.formRange}
              />
            </div>

            <div style={styles.formGroupRow}>
              <span style={styles.formLabel}>Capitalize All Text</span>
              <button
                onClick={() =>
                  setCustomStyles({
                    ...customStyles,
                    uppercase:
                      customStyles.uppercase !== undefined
                        ? !customStyles.uppercase
                        : false,
                  })
                }
                style={{
                  ...styles.toggleBtn,
                  ...((customStyles.uppercase !== undefined
                    ? customStyles.uppercase
                    : true)
                    ? styles.toggleBtnActive
                    : {}),
                }}
              >
                {(customStyles.uppercase !== undefined
                ? customStyles.uppercase
                : true)
                  ? "ON (ALL CAPS)"
                  : "OFF (Standard)"}
              </button>
            </div>
            
            <div style={styles.infoBox}>
              <Sparkles size={14} color="#4f46e5" />
              <p style={styles.infoBoxText}>
                These settings override the active preset styles, allowing you to custom-tailor the caption look for your client.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SCRIPT INJECTOR */}
        {activeTab === "script" && (
          <div style={styles.scriptInjector}>
            <p style={styles.injectorDesc}>
              Have a pre-written script or subtitle text? Paste it below and we will automatically distribute the words evenly across the video duration.
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your full transcript here... Example: Welcome to this next generation video editor. AI-powered caption generation right in your browser."
              className="word-input-box"
              style={styles.textArea}
            />
            <button
              onClick={injectFullScript}
              disabled={!inputText.trim()}
              style={{
                ...styles.injectButton,
                ...(!inputText.trim() ? styles.injectButtonDisabled : {}),
              }}
              className="btn-primary"
            >
              <RefreshCw size={14} />
              <span>Distribute Timings & Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Export Action Card */}
      <div style={styles.exportCard}>
        <div style={styles.exportInfo}>
          <h4 style={styles.exportTitle}>Ready to deliver?</h4>
          <p style={styles.exportDesc}>
            Bake the active caption styles directly into the MP4 stream.
          </p>
        </div>
        <button onClick={onExportStart} style={styles.exportButton} className="btn-success">
          <Download size={16} />
          <span>Export & Download</span>
        </button>
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
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    height: "580px",
    width: "100%",
  },
  tabsHeader: {
    display: "flex",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "14px 10px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
    borderBottomStyle: "solid",
    borderBottomWidth: "2px",
    borderBottomColor: "transparent",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    color: "#4f46e5",
    borderBottomColor: "#4f46e5",
    backgroundColor: "#ffffff",
  },
  tabContent: {
    flex: 1,
    padding: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  subListContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  subListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  listCount: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b",
  },
  addButton: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    border: "none",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  listScroll: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingRight: "4px",
  },
  wordRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
    gap: "10px",
    transition: "all 0.2s",
    position: "relative",
  },
  wordRowActive: {
    borderColor: "#c7d2fe",
    backgroundColor: "#f5f3ff",
    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.05)",
  },
  rowHighlightIndicator: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: "3px",
    backgroundColor: "transparent",
    borderTopRightRadius: "3px",
    borderBottomRightRadius: "3px",
  },
  wordInputGroup: {
    flex: 2,
    minWidth: "80px",
  },
  wordInput: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#cbd5e1",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    outline: "none",
    color: "#334155",
    backgroundColor: "#ffffff",
    transition: "border-color 0.2s",
  },
  wordInputActive: {
    borderColor: "#4f46e5",
    backgroundColor: "#ffffff",
  },
  timeControlGroup: {
    display: "flex",
    gap: "12px",
    flex: 3,
  },
  timeCol: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  timeTag: {
    fontSize: "0.6rem",
    fontWeight: 700,
    color: "#94a3b8",
  },
  spinner: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#cbd5e1",
    borderRadius: "6px",
    overflow: "hidden",
  },
  spinBtn: {
    border: "none",
    background: "none",
    padding: "2px 6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    color: "#64748b",
    backgroundColor: "#f8fafc",
  },
  spinVal: {
    flex: 1,
    textAlign: "center",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    fontWeight: 600,
    color: "#334155",
    padding: "0 2px",
  },
  styleTriggerRow: {
    display: "flex",
    gap: "4px",
  },
  colorCircle: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    cursor: "pointer",
    padding: 0,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  settingsForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "8px 0",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sliderLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#334155",
  },
  formVal: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#4f46e5",
    fontFamily: "monospace",
  },
  formRange: {
    height: "6px",
    borderRadius: "3px",
    appearance: "none",
    backgroundColor: "#e2e8f0",
    outline: "none",
    cursor: "pointer",
  },
  formGroupRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderTopColor: "#f1f5f9",
    paddingTop: "16px",
  },
  toggleBtn: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#cbd5e1",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    backgroundColor: "#ffffff",
    color: "#64748b",
    transition: "all 0.2s",
  },
  toggleBtnActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#4f46e5",
    color: "#4f46e5",
  },
  infoBox: {
    display: "flex",
    gap: "8px",
    backgroundColor: "#f5f3ff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e0e7ff",
    borderRadius: "10px",
    padding: "12px",
    marginTop: "16px",
  },
  infoBoxText: {
    fontSize: "0.75rem",
    color: "#4f46e5",
    lineHeight: "1.4",
  },
  scriptInjector: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    height: "100%",
  },
  injectorDesc: {
    fontSize: "0.8rem",
    color: "#64748b",
    lineHeight: "1.4",
  },
  textArea: {
    flex: 1,
    minHeight: "160px",
    borderRadius: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#cbd5e1",
    padding: "12px",
    fontSize: "0.85rem",
    color: "#334155",
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  injectButton: {
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "0.85rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
    transition: "background-color 0.2s",
  },
  injectButtonDisabled: {
    backgroundColor: "#cbd5e1",
    color: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  exportCard: {
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderTopColor: "#e2e8f0",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "2px",
  },
  exportDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
    lineHeight: "1.2",
  },
  exportButton: {
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "0.85rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
    transition: "all 0.2s",
  },
};
