import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Smartphone, Monitor, Square } from "lucide-react";

// Keyword emoji mapping for MrBeast/Hormozi styles
const EMOJI_MAP = {
  amazing: "🔥",
  app: "📱",
  application: "💻",
  ai: "🤖",
  change: "⚡",
  edit: "✂️",
  videos: "📹",
  video: "🎬",
  fast: "⚡",
  powered: "🔋",
  browser: "🌐",
  welcome: "👋",
  workout: "💪",
  strength: "🏋️‍♀️",
  endurance: "🏃‍♀️",
  dumbbells: "💪",
  scale: "📈",
  business: "💼",
  strategy: "💡",
  tools: "🛠️",
  automate: "⚙️",
  marketing: "📣",
  growth: "🚀",
  today: "📅"
};

export default function VideoPlayer({
  videoUrl,
  transcript,
  preset,
  customStyles,
  currentTime,
  setCurrentTime,
  playing,
  setPlaying,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const sourceRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("9-16"); // '9-16' | '1-1' | '16-9'
  const [audioError, setAudioError] = useState(false);

  // Sync playing state
  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      if (!videoRef.current._playPromisePending) {
        videoRef.current._playPromisePending = true;
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.then(() => {
            videoRef.current._playPromisePending = false;
          }).catch(() => {
            videoRef.current._playPromisePending = false;
            setPlaying(false);
          });
        } else {
          videoRef.current._playPromisePending = false;
        }
      }
    } else {
      // Safe pause
      if (!videoRef.current._playPromisePending) {
        videoRef.current.pause();
      }
    }
  }, [playing, setPlaying]);

  // Sync video URL change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setPlaying(false);
      setCurrentTime(0);
    }
    setAudioError(false);
    
    // Clean up audio graph on source change
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current = null;
    }
  }, [videoUrl]);

  // Initialize Web Audio API for Audio Visualizer
  const setupAudioAnalyzer = () => {
    if (!videoRef.current || audioContextRef.current || audioError) return;

    try {
      let ctx, source;
      if (videoRef.current._audioCtx) {
          ctx = videoRef.current._audioCtx;
          source = videoRef.current._audioSource;
      } else {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          ctx = new AudioContext();
          source = ctx.createMediaElementSource(videoRef.current);
          videoRef.current._audioCtx = ctx;
          videoRef.current._audioSource = source;
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      source.disconnect(); // Clear any existing routes
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.warn("AudioContext setup failed (CORS or browser restrictions). Using simulated waveform.", err);
      setAudioError(true);
    }
  };

  // Audio visualizer render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && !audioError) {
        // Read real audio frequencies
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Generate simulated waves if audio analyzer failed/CORS or video is paused
        for (let i = 0; i < bufferLength; i++) {
          if (playing) {
            // Generate oscillating wave patterns
            const time = Date.now() * 0.004;
            const factor = Math.sin(i * 0.3 + time) * Math.cos(i * 0.05 - time);
            dataArray[i] = Math.abs(factor) * 150 + Math.random() * 20;
          } else {
            // Flat idle line
            dataArray[i] = 10 + Math.sin(i * 0.5) * 5;
          }
        }
      }

      // Draw beautiful gradients waveform
      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.95;
        
        // Ensure some minimum height for aesthetics
        if (barHeight < 4) barHeight = 4;

        // Visualizer bar gradient (Indigo to Cyan)
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, "rgba(79, 70, 229, 0.2)");
        gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.6)");
        gradient.addColorStop(1, "rgba(79, 70, 229, 0.9)");

        ctx.fillStyle = gradient;
        
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [playing, audioError]);

  const handlePlayPause = () => {
    // Resume audio context if suspended
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    setupAudioAnalyzer();
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Auto-detect the exact aspect ratio of the uploaded video
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      if (h > w) {
        setAspectRatio("9-16"); // Portrait
      } else if (w > h) {
        setAspectRatio("16-9"); // Landscape
      } else {
        setAspectRatio("1-1"); // Square
      }
    }
  };

  const handleSliderChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!playing) {
        setPlaying(true);
      }
    }
  };

  // Helper to format video timestamps
  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  // Get active word and group them into phrases depending on styles
  const getActiveCaption = () => {
    if (!transcript || transcript.length === 0) return null;

    // Find active word index
    const activeIdx = transcript.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );

    if (activeIdx === -1) return null;

    const activeWord = transcript[activeIdx];

    // Determine phrase boundaries based on styling preset
    // MrBeast / Hormozi: show only 2-3 words. Minimalist: show 6-8 words. Others: 4-5 words.
    const maxWords =
      preset.id === "mrbeast" || preset.id === "hormozi"
        ? 3
        : preset.id === "minimalist"
        ? 8
        : 5;

    let startIdx = activeIdx;
    while (startIdx > 0) {
      const prevWord = transcript[startIdx - 1].word;
      if (
        prevWord.endsWith(".") ||
        prevWord.endsWith("?") ||
        prevWord.endsWith("!") ||
        prevWord.endsWith(";")
      ) {
        break;
      }
      if (activeIdx - startIdx >= Math.floor(maxWords / 2)) {
        break;
      }
      startIdx--;
    }

    let endIdx = activeIdx;
    while (endIdx < transcript.length - 1) {
      const currWord = transcript[endIdx].word;
      if (
        currWord.endsWith(".") ||
        currWord.endsWith("?") ||
        currWord.endsWith("!") ||
        currWord.endsWith(";")
      ) {
        break;
      }
      if (endIdx - activeIdx >= Math.ceil(maxWords / 2) - 1) {
        break;
      }
      endIdx++;
    }

    const wordGroup = transcript.slice(startIdx, endIdx + 1);

    // Keyword emoji extraction (only for MrBeast/Hormozi styles)
    let activeEmoji = null;
    if (preset.emojisEnabled) {
      const cleanWord = activeWord.word
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      activeEmoji = EMOJI_MAP[cleanWord] || null;
    }

    return {
      group: wordGroup,
      activeId: activeWord.id,
      emoji: activeEmoji,
    };
  };

  const activeCap = getActiveCaption();

  // Combine default preset layout adjustments with user-customized adjustments
  const finalFontSize = customStyles.fontSize || preset.fontSize;
  const finalYPos = customStyles.yPos !== undefined ? customStyles.yPos : preset.yPos;
  const finalUppercase = customStyles.uppercase !== undefined ? customStyles.uppercase : true;

  const playerContainerStyle = {
    ...styles.playerContainer,
    ...(aspectRatio === "9-16" ? styles.aspect916 : {}),
    ...(aspectRatio === "1-1" ? styles.aspect11 : {}),
    ...(aspectRatio === "16-9" ? styles.aspect169 : {}),
  };

  return (
    <div style={styles.container}>
      {/* Aspect Ratio Selector */}
      <div style={styles.aspectSelector}>
        <button
          onClick={() => setAspectRatio("9-16")}
          style={{
            ...styles.aspectBtn,
            ...(aspectRatio === "9-16" ? styles.aspectBtnActive : {}),
          }}
        >
          <Smartphone size={14} />
          <span>9:16 Reel</span>
        </button>
        <button
          onClick={() => setAspectRatio("1-1")}
          style={{
            ...styles.aspectBtn,
            ...(aspectRatio === "1-1" ? styles.aspectBtnActive : {}),
          }}
        >
          <Square size={14} />
          <span>1:1 Square</span>
        </button>
        <button
          onClick={() => setAspectRatio("16-9")}
          style={{
            ...styles.aspectBtn,
            ...(aspectRatio === "16-9" ? styles.aspectBtnActive : {}),
          }}
        >
          <Monitor size={14} />
          <span>16:9 Landscape</span>
        </button>
      </div>

      {/* Main Video Monitor */}
      <div style={playerContainerStyle}>
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={handlePlayPause}
          style={styles.video}
          playsInline
          loop
        />

        {/* Captions Overlay Container */}
        {activeCap && (
          <div
            style={{
              ...styles.captionOverlay,
              top: `${finalYPos}%`,
            }}
            className={preset.className}
          >
            {/* Pop-up Emoji */}
            {activeCap.emoji && (
              <div style={styles.emojiWrapper}>
                <span style={styles.emojiText}>{activeCap.emoji}</span>
              </div>
            )}

            {/* Subtitle text */}
            <div
              style={{
                fontSize: `${finalFontSize}rem`,
                textTransform: finalUppercase ? "uppercase" : "none",
              }}
            >
              {activeCap.group.map((w) => {
                const isActive = w.id === activeCap.activeId;
                const isPassed = w.end < currentTime;

                // Color mappings for active/styled words
                let wordClass = "word";
                if (isActive) wordClass += " active";
                if (isPassed) wordClass += " passed";

                // Handle MrBeast styled words
                if (preset.id === "mrbeast") {
                  if (isActive) {
                    // Choose color based on word-specific custom styles
                    if (w.style === "yellow") wordClass += " word-yellow";
                    else if (w.style === "red") wordClass += " word-red";
                    else wordClass += " word-green"; // default active green
                  } else {
                    if (w.style === "yellow") wordClass += " word-yellow";
                    else if (w.style === "green") wordClass += " word-green";
                    else if (w.style === "red") wordClass += " word-red";
                  }
                }

                // Handle Real Estate Pop styled words
                if (preset.id === "realestate") {
                  if (w.style === "magenta") wordClass += " word-magenta";
                  else if (w.style === "cyan") wordClass += " word-cyan";
                  else if (w.style === "orange") wordClass += " word-orange";
                }

                return (
                  <React.Fragment key={w.id}>
                    <span className={wordClass}>
                      {w.word}
                    </span>
                    {" "}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div style={styles.controlsCard}>
        <div style={styles.timelineRow}>
          <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSliderChange}
            style={styles.slider}
          />
          <span style={styles.timeLabel}>{formatTime(duration)}</span>
        </div>

        <div style={styles.buttonRow}>
          <div style={styles.btnGroupLeft}>
            <button onClick={handlePlayPause} style={styles.controlBtnPrimary} className="btn-primary">
              {playing ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
            </button>
            <button onClick={restartVideo} style={styles.controlBtn} className="btn-icon-hover">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Audio Waveform Canvas */}
          <div style={styles.visualizerContainer}>
            <canvas ref={canvasRef} width={220} height={32} style={styles.canvas} />
          </div>

          <div style={styles.btnGroupRight}>
            <button onClick={toggleMute} style={styles.controlBtn} className="btn-icon-hover">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              style={styles.volumeSlider}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "500px",
    gap: "16px",
  },
  aspectSelector: {
    display: "flex",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    padding: "4px",
    borderRadius: "12px",
    width: "100%",
    justifyContent: "space-between",
    boxShadow: "var(--shadow-sm)",
  },
  aspectBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
    transition: "all 0.2s",
  },
  aspectBtnActive: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
  },
  playerContainer: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "var(--shadow-xl)",
    border: "4px solid #ffffff",
    outline: "1px solid #e2e8f0",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  aspect916: {
    aspectRatio: "9/16",
    height: "550px",
  },
  aspect11: {
    aspectRatio: "1/1",
    height: "400px",
  },
  aspect169: {
    aspectRatio: "16/9",
    width: "100%",
    height: "281px",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "pointer",
  },
  captionOverlay: {
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    textAlign: "center",
  },
  emojiWrapper: {
    marginBottom: "8px",
    animation: "emojiPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
  },
  emojiText: {
    fontSize: "3rem",
    display: "block",
  },
  controlsCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  timelineRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  timeLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "monospace",
    color: "#64748b",
    minWidth: "45px",
  },
  slider: {
    flex: 1,
    height: "6px",
    borderRadius: "3px",
    appearance: "none",
    backgroundColor: "#e2e8f0",
    outline: "none",
    cursor: "pointer",
  },
  buttonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  btnGroupLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnGroupRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  controlBtnPrimary: {
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(79, 70, 229, 0.3)",
    transition: "transform 0.15s",
  },
  controlBtn: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  visualizerContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    overflow: "hidden",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  volumeSlider: {
    width: "60px",
    height: "4px",
    appearance: "none",
    backgroundColor: "#e2e8f0",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer",
  },
};
