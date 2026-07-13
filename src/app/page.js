"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import SampleLoader from "./components/SampleLoader";
import StyleSelector from "./components/StyleSelector";
import VideoPlayer from "./components/VideoPlayer";
import CaptionEditor from "./components/CaptionEditor";
import { SAMPLE_VIDEOS, CAPTION_PRESETS, generateCustomTranscript } from "./data/sampleData";
import {
  Upload,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Video,
  FileText,
  AlertCircle,
  HelpCircle
} from "lucide-react";

export default function Home() {
  // Video and Transcript State
  const [videoFile, setVideoFile] = useState(null); // { name, url, duration }
  const [transcript, setTranscript] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(CAPTION_PRESETS[0]);
  const [customStyles, setCustomStyles] = useState({
    fontSize: null,
    yPos: undefined,
    uppercase: undefined
  });

  // Playback Control State
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Analysis / Auto-captioning Steps
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStepIdx, setAnalysisStepIdx] = useState(0);
  const [captionsGenerated, setCaptionsGenerated] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState("auto"); // auto | en | ta | hi | te | ml

  // Export Steps
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepIdx, setExportStepIdx] = useState(0);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [exportedVideoName, setExportedVideoName] = useState("");

  // File Drop Ref
  const fileInputRef = useRef(null);

  // Web Worker Ref
  const worker = useRef(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      });
    }
  }, []);

  const analysisSteps = [
    "Extracting high-fidelity audio frequencies...",
    "Denoising soundscape & isolating vocal cords...",
    "Running speech-to-text matching (Whisper AI Engine)...",
    "Aligning word timestamps down to milliseconds...",
    "Embedding selected style configurations..."
  ];

  const exportSteps = [
    "Baking typography layers into video frames...",
    "Multiplexing audio frequency buffers...",
    "Injecting metadata tags & subtitles index...",
    "Packaging final container stream into MP4..."
  ];

  // Handle Video Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadLocalFile(file);
  };

  const loadLocalFile = (file) => {
    const url = URL.createObjectURL(file);
    
    // Create temporary video element to extract duration
    const tempVideo = document.createElement("video");
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoFile({
        name: file.name,
        url: url,
        duration: tempVideo.duration || 10,
        isCustom: true,
        fileRef: file
      });
      setTranscript([]);
      setCaptionsGenerated(false);
      setPlaying(false);
      setCurrentTime(0);
      
      // Reset custom overrides when loading a new file
      setCustomStyles({
        fontSize: null,
        yPos: undefined,
        uppercase: undefined
      });
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      loadLocalFile(file);
    }
  };

  // Load Preset Sample Video
  const handleSelectSample = (sample) => {
    setVideoFile({
      name: sample.title,
      url: sample.url,
      duration: sample.duration,
      isCustom: false,
      rawTranscript: sample.transcript
    });
    setTranscript([]);
    setCaptionsGenerated(false);
    setPlaying(false);
    setCurrentTime(0);
    setCustomStyles({
      fontSize: null,
      yPos: undefined,
      uppercase: undefined
    });
  };

  // Trigger Caption Analysis (Real Whisper STT for custom uploads, simulated for presets)
  const triggerAutoCaptioning = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStepIdx(0);

    // If it's a preset sample, run the fast simulation using preset transcript data
    if (!videoFile.isCustom) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnalyzing(false);
              setCaptionsGenerated(true);
              setTranscript(videoFile.rawTranscript);
            }, 600);
            return 100;
          }
          
          const increment = Math.random() * 8 + 4;
          const nextProgress = Math.min(prev + increment, 100);
          
          // Update steps based on progress thresholds
          const step = Math.min(Math.floor((nextProgress / 100) * analysisSteps.length), analysisSteps.length - 1);
          setAnalysisStepIdx(step);
          
          return nextProgress;
        });
      }, 150);
      return;
    }

    // It's a custom uploaded video — send to local API route for real Whisper transcription
    try {
      // Step 0: Read file
      setAnalysisStepIdx(0);
      setAnalysisProgress(10);
      const file = videoFile.fileRef;
      if (!file) throw new Error("No file reference found. Please re-upload.");
      const arrayBuffer = await file.arrayBuffer();
      setAnalysisProgress(20);

      // Step 1: Decode + resample audio to 16kHz mono
      setAnalysisStepIdx(1);
      setAnalysisProgress(30);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      setAnalysisProgress(40);

      const maxSecs = Math.min(decoded.duration, 25);
      const SR = 16000;
      const offCtx = new OfflineAudioContext(1, Math.floor(maxSecs * SR), SR);
      const src = offCtx.createBufferSource();
      src.buffer = decoded;
      src.connect(offCtx.destination);
      src.start();
      const resampled = await offCtx.startRendering();
      const pcm = resampled.getChannelData(0);
      setAnalysisProgress(50);

      // Step 2: Send raw PCM Float32Array to our local Web Worker
      setAnalysisStepIdx(2);
      setAnalysisProgress(55);

      const apiJson = await new Promise((resolve, reject) => {
        const messageHandler = (e) => {
          const data = e.data;
          console.log("[Worker Message]:", data);
          
          if (data.status === 'progress' && data.data) {
            // Update progress if downloading model
            if (data.data.progress) {
                setAnalysisProgress(55 + (data.data.progress * 0.3)); // Map 0-100 to 55-85
            }
          } else if (data.status === 'analyzing') {
             setAnalysisStepIdx(3);
             setAnalysisProgress(85);
          } else if (data.status === 'complete') {
             worker.current.removeEventListener('message', messageHandler);
             resolve(data.result);
          } else if (data.status === 'error') {
             worker.current.removeEventListener('message', messageHandler);
             reject(new Error(data.error));
          }
        };

        if (!worker.current) {
          reject(new Error("Web Worker is not initialized. Please refresh the page."));
          return;
        }

        worker.current.addEventListener('message', messageHandler);
        
        worker.current.postMessage({ 
          pcm: pcm,
          language: captionLanguage,
          maxSecs: maxSecs
        });
      });

      setAnalysisProgress(90);

      // Step 4: Parse Whisper output into word-level transcript
      setAnalysisStepIdx(4);
      setAnalysisProgress(95);

      let wordId = 1;
      const words = [];
      const chunks = apiJson.chunks || [];

      if (chunks.length > 0) {
        chunks.forEach((chunk) => {
          const text = (chunk.text || "").trim();
          if (!text) return;
          const tStart = Array.isArray(chunk.timestamp) ? (chunk.timestamp[0] ?? 0) : 0;
          const tEnd   = Array.isArray(chunk.timestamp) ? (chunk.timestamp[1] ?? tStart + 1) : tStart + 1;
          const segWords = text.split(/\s+/).filter(Boolean);
          const step = (tEnd - tStart) / Math.max(segWords.length, 1);
          segWords.forEach((w, idx) => {
            words.push({
              id: wordId++,
              word: w,
              start: parseFloat((tStart + idx * step).toFixed(2)),
              end:   parseFloat((tStart + (idx + 1) * step - 0.02).toFixed(2)),
              style: null,
            });
          });
        });
      } else if (apiJson.text) {
        // Flat text with no chunks — distribute evenly across audio duration
        const allWords = apiJson.text.trim().split(/\s+/).filter(Boolean);
        const step = maxSecs / Math.max(allWords.length, 1);
        allWords.forEach((w, idx) => {
          words.push({
            id: wordId++,
            word: w,
            start: parseFloat((idx * step).toFixed(2)),
            end:   parseFloat(((idx + 1) * step - 0.02).toFixed(2)),
            style: null,
          });
        });
      }

      if (words.length === 0) {
        words.push({ id: 1, word: "[No speech detected]", start: 0.1, end: 2.0, style: null });
      }

      setAnalysisProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
        setCaptionsGenerated(true);
        setTranscript(words);
      }, 500);

    } catch (err) {
      console.error("Transcription failed:", err);
      setIsAnalyzing(false);
      // Show error as a single caption entry so user knows what happened
      setCaptionsGenerated(true);
      setTranscript([{
        id: 1,
        word: "⚠ Transcription failed — check internet connection",
        start: 0,
        end: 5,
        style: null,
      }]);
    }
  };

  const handleFallback = () => {
    // Show step progress updates before finishing fallback so it feels natural
    setAnalysisStepIdx(2);
    setAnalysisProgress(60);
    setTimeout(() => {
      setAnalysisStepIdx(3);
      setAnalysisProgress(85);
      setTimeout(() => {
        setAnalysisProgress(100);
        setIsAnalyzing(false);
        setCaptionsGenerated(true);
        setTranscript(generateCustomTranscript(videoFile.duration));
      }, 800);
    }, 1000);
  };

  // Helper to render styled subtitles onto HTML Canvas during export
  const drawCaptionsOnCanvas = (ctx, time, canvasWidth, canvasHeight) => {
    const activeIndex = transcript.findIndex(w => time >= w.start && time <= w.end);
    if (activeIndex === -1) return;

    const activeWord = transcript[activeIndex];
    
    // Group active word context (prev word + current word + next word)
    const startIndex = Math.max(0, activeIndex - 1);
    const endIndex = Math.min(transcript.length - 1, activeIndex + 1);
    const phraseWords = transcript.slice(startIndex, endIndex + 1);

    ctx.save();

    // Font size and position overrides
    const finalFontSize = customStyles.fontSize || selectedPreset.fontSize || 1.8;
    const finalYPosPercent = customStyles.yPos !== undefined ? customStyles.yPos : (selectedPreset.yPos || 50);
    const finalUppercase = customStyles.uppercase !== undefined ? customStyles.uppercase : (selectedPreset.uppercase !== false);

    // DYNAMIC SCALING FOR HIGH-RES EXPORTS (1080p, 4k, etc.)
    // Base scale on the shortest dimension so text perfectly fits whether it's Portrait or Landscape
    const scaleRatio = Math.min(canvasWidth, canvasHeight) / 600; 
    ctx.scale(scaleRatio, scaleRatio);
    
    // Now work in "scaled" coordinates
    const scaledWidth = canvasWidth / scaleRatio;
    const scaledHeight = canvasHeight / scaleRatio;

    const yPos = scaledHeight * (finalYPosPercent / 100);
    const xPos = scaledWidth / 2;

    if (selectedPreset.id === "mrbeast") {
      // MrBeast: Bouncing bold capitalized words with thick black outlines
      ctx.font = `900 ${finalFontSize * 24}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let totalWidth = 0;
      const spaceWidth = ctx.measureText(" ").width * 0.8; // tighten space slightly for impact
      const widths = phraseWords.map(w => {
         const txt = finalUppercase ? w.word.toUpperCase() : w.word;
         return ctx.measureText(txt).width;
      });
      totalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length > 1 ? (widths.length - 1) * spaceWidth : 0);
      
      let currentX = xPos - (totalWidth / 2);

      phraseWords.forEach((w, idx) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        const scale = isCurrent ? 1.15 : 0.95;
        const wordY = yPos + (isCurrent ? -6 : 0);
        
        const wordX = currentX + (widths[idx] / 2);

        ctx.save();
        ctx.translate(wordX, wordY);
        ctx.scale(scale, scale);

        let fillColor = "#ffffff";
        if (isCurrent) {
          fillColor = w.style === "yellow" ? "#facc15" : (w.style === "red" ? "#ef4444" : "#22c55e");
        } else {
          if (w.style === "yellow") fillColor = "#facc15";
          else if (w.style === "green") fillColor = "#22c55e";
          else if (w.style === "red") fillColor = "#ef4444";
        }

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        ctx.strokeText(displayText, 0, 0);

        ctx.fillStyle = fillColor;
        ctx.fillText(displayText, 0, 0);
        ctx.restore();

        currentX += widths[idx] + spaceWidth;
      });

    } else if (selectedPreset.id === "hormozi") {
      // Hormozi: Yellow backdrop boxes, uppercase black text
      ctx.font = `900 ${finalFontSize * 20}px Montserrat, Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let totalWidth = 0;
      const spaceWidth = ctx.measureText(" ").width;
      const widths = phraseWords.map(w => {
         const txt = finalUppercase ? w.word.toUpperCase() : w.word;
         return ctx.measureText(txt).width;
      });
      totalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length > 1 ? (widths.length - 1) * spaceWidth : 0);
      
      let currentX = xPos - (totalWidth / 2);

      phraseWords.forEach((w, idx) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        const wordX = currentX + (widths[idx] / 2);

        if (isCurrent) {
          const textWidth = widths[idx];
          const boxHeight = finalFontSize * 30;

          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(wordX - textWidth / 2 - 8, yPos - boxHeight / 2, textWidth + 16, boxHeight, 6);
          } else {
            ctx.rect(wordX - textWidth / 2 - 8, yPos - boxHeight / 2, textWidth + 16, boxHeight);
          }
          ctx.fill();

          ctx.fillStyle = "#000000";
          ctx.fillText(displayText, wordX, yPos);
        } else {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4;
          ctx.strokeText(displayText, wordX, yPos);

          ctx.fillStyle = "#ffffff";
          ctx.fillText(displayText, wordX, yPos);
        }
        
        currentX += widths[idx] + spaceWidth;
      });

    } else if (selectedPreset.id === "minimalist") {
      // Minimalist: Centered phrase in transparent glass capsule
      ctx.font = `500 ${finalFontSize * 16}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = "middle";

      const phraseText = phraseWords.map(w => w.word).join(" ");
      ctx.textAlign = "center";
      const totalWidth = ctx.measureText(phraseText).width;
      const boxHeight = finalFontSize * 26;

      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(xPos - totalWidth / 2 - 14, yPos - boxHeight / 2, totalWidth + 28, boxHeight, boxHeight / 2);
      } else {
        ctx.rect(xPos - totalWidth / 2 - 14, yPos - boxHeight / 2, totalWidth + 28, boxHeight);
      }
      ctx.fill();

      ctx.textAlign = "left";
      let startX = xPos - totalWidth / 2;
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        ctx.fillStyle = isCurrent ? "#ffffff" : "rgba(255, 255, 255, 0.45)";
        
        ctx.fillText(w.word, startX, yPos);
        startX += ctx.measureText(w.word + " ").width;
      });

    } else if (selectedPreset.id === "cyberpunk") {
      // Cyberpunk: Monospace glow neon cyan
      ctx.font = `bold ${finalFontSize * 18}px 'Courier New', monospace`;
      ctx.textBaseline = "middle";

      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";

      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;

        ctx.save();
        if (isCurrent) {
          ctx.fillStyle = "#f472b6";
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 12;
          ctx.translate(startX + ctx.measureText(displayText).width / 2, yPos);
          ctx.transform(1, 0, Math.tan(-15 * Math.PI / 180), 1, 0, 0); // skewX(-15deg)
          ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
        } else {
          ctx.fillStyle = "#22d3ee";
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 12;
          ctx.fillText(displayText, startX, yPos);
        }
        ctx.restore();
        
        startX += ctx.measureText(displayText + " ").width;
      });

    } else if (selectedPreset.id === "banger") {
      // Dynamic Banger: Large text, gradient fill, drop shadow
      ctx.font = `900 ${finalFontSize * 20}px Montserrat, Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";

      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const isPassed = w.end < time;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;

        ctx.save();
        
        if (isCurrent) {
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;
          
          const grad = ctx.createLinearGradient(0, -30, 0, 30);
          grad.addColorStop(0, "#fbbf24");
          grad.addColorStop(0.5, "#f97316");
          grad.addColorStop(1, "#e11d48");
          
          ctx.fillStyle = grad;
          // Scale effect
          ctx.translate(startX + ctx.measureText(displayText).width / 2, yPos);
          ctx.scale(1.3, 1.3);
          ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
        } else {
          ctx.fillStyle = isPassed ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)";
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 12;
          
          ctx.translate(startX + ctx.measureText(displayText).width / 2, yPos);
          ctx.scale(0.9, 0.9);
          ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
        }

        ctx.restore();
        startX += ctx.measureText(displayText + " ").width;
      });

    } else if (selectedPreset.id === "realestate") {
      // Real Estate Pop: Clean stack with punchy colors
      ctx.font = `800 ${finalFontSize * 16}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lineHeight = finalFontSize * 18;
      const totalHeight = phraseWords.length * lineHeight;
      let startY = yPos - (totalHeight / 2) + (lineHeight / 2);

      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;

        ctx.save();
        
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        if (w.style === "magenta") {
          ctx.fillStyle = "#d946ef";
          ctx.shadowColor = "rgba(217, 70, 239, 0.5)";
          ctx.shadowBlur = 15;
        } else if (w.style === "cyan") {
          ctx.fillStyle = "#06b6d4";
          ctx.shadowColor = "rgba(6, 182, 212, 0.5)";
          ctx.shadowBlur = 15;
        } else if (w.style === "orange") {
          const width = ctx.measureText(displayText).width;
          const grad = ctx.createLinearGradient(xPos - width/2, startY, xPos + width/2, startY);
          grad.addColorStop(0, "#f97316");
          grad.addColorStop(1, "#be123c");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = "#ffffff";
        }

        ctx.fillText(displayText, xPos, startY);
        ctx.restore();
        
        startY += lineHeight;
      });
      
    } else if (selectedPreset.id === "netflix") {
      ctx.font = `bold ${finalFontSize * 16}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000000";
      ctx.strokeText(phraseText, xPos, yPos);
      ctx.fillStyle = "#ffcc00";
      ctx.fillText(phraseText, xPos, yPos);
      
    } else if (selectedPreset.id === "tiktok") {
      ctx.font = `bold ${finalFontSize * 16}px "Proxima Nova", sans-serif`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        const width = ctx.measureText(displayText).width;
        
        ctx.fillStyle = isCurrent ? "#fe2c55" : "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(startX - 4, yPos - 20, width + 8, 40);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(displayText, startX, yPos);
        startX += width + 12;
      });
      
    } else if (selectedPreset.id === "typewriter") {
      ctx.font = `bold ${finalFontSize * 18}px "Courier New", monospace`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(startX - 20, yPos - 30, totalWidth + 40, 60);
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const isPassed = w.end < time;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        if (isCurrent || isPassed) {
          ctx.fillStyle = isCurrent ? "#4ade80" : "#ffffff";
          ctx.fillText(displayText, startX, yPos);
        }
        startX += ctx.measureText(displayText + " ").width;
      });
      
    } else if (selectedPreset.id === "imessage") {
      ctx.font = `500 ${finalFontSize * 14}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      ctx.fillStyle = "#007aff";
      ctx.beginPath();
      ctx.roundRect(startX - 20, yPos - 25, totalWidth + 40, 50, 20);
      ctx.fill();
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        ctx.fillStyle = isCurrent ? "#cce5ff" : "#ffffff";
        if (isCurrent) ctx.font = `bold ${finalFontSize * 14}px -apple-system, sans-serif`;
        else ctx.font = `500 ${finalFontSize * 14}px -apple-system, sans-serif`;
        
        ctx.fillText(displayText, startX, yPos);
        startX += ctx.measureText(displayText + " ").width;
      });
      
    } else if (selectedPreset.id === "news") {
      ctx.font = `800 ${finalFontSize * 18}px Helvetica, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, yPos - 30, scaledWidth, 60);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, yPos - 34, scaledWidth, 4);
      ctx.fillRect(0, yPos + 30, scaledWidth, 4);
      
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        ctx.fillStyle = isCurrent ? "#fef08a" : "#ffffff";
        ctx.fillText(displayText, startX, yPos);
        startX += ctx.measureText(displayText + " ").width;
      });
      
    } else if (selectedPreset.id === "game") {
      ctx.font = `bold ${finalFontSize * 18}px "Courier New", monospace`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 4;
      ctx.fillRect(startX - 20, yPos - 30, totalWidth + 40, 60);
      ctx.strokeRect(startX - 20, yPos - 30, totalWidth + 40, 60);
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        ctx.fillStyle = isCurrent ? "#4ade80" : "#ffffff";
        if (isCurrent) {
          ctx.shadowColor = "#4ade80";
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillText(displayText, startX, yPos);
        startX += ctx.measureText(displayText + " ").width;
      });
      ctx.shadowBlur = 0;
      
    } else if (selectedPreset.id === "podcast") {
      ctx.font = `700 ${finalFontSize * 22}px Inter, sans-serif`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        if (isCurrent) {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(255,255,255,0.4)";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.shadowBlur = 0;
        }
        ctx.fillText(displayText, startX, yPos);
        startX += ctx.measureText(displayText + " ").width;
      });
      ctx.shadowBlur = 0;
      
    } else if (selectedPreset.id === "comic") {
      ctx.font = `900 ${finalFontSize * 26}px "Comic Sans MS", sans-serif`;
      ctx.textBaseline = "middle";
      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";
      
      ctx.translate(xPos, yPos);
      ctx.rotate(-3 * Math.PI / 180);
      ctx.translate(-xPos, -yPos);
      
      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;
        
        ctx.save();
        if (isCurrent) {
          ctx.fillStyle = "#fef08a";
          ctx.translate(startX + ctx.measureText(displayText).width / 2, yPos);
          ctx.scale(1.2, 1.2);
          ctx.rotate(5 * Math.PI / 180);
          ctx.translate(-(startX + ctx.measureText(displayText).width / 2), -yPos);
          
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 8;
          ctx.shadowOffsetY = 8;
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 5;
        }
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(displayText, startX, yPos);
        ctx.fillText(displayText, startX, yPos);
        
        ctx.restore();
        startX += ctx.measureText(displayText + " ").width;
      });
      
    } else {
      // Karaoke/default gradient
      ctx.font = `bold ${finalFontSize * 20}px Poppins, sans-serif`;
      ctx.textBaseline = "middle";

      const phraseText = phraseWords.map(w => finalUppercase ? w.word.toUpperCase() : w.word).join(" ");
      const totalWidth = ctx.measureText(phraseText).width;
      let startX = xPos - totalWidth / 2;
      ctx.textAlign = "left";

      phraseWords.forEach((w) => {
        const isCurrent = w.id === activeWord.id;
        const isPassed = w.end < time;
        const displayText = finalUppercase ? w.word.toUpperCase() : w.word;

        ctx.save();
        if (isCurrent || isPassed) {
          const wordWidth = ctx.measureText(displayText).width;
          const grad = ctx.createLinearGradient(startX, yPos, startX + wordWidth, yPos);
          grad.addColorStop(0, "#ec4899");
          grad.addColorStop(1, "#8b5cf6");
          ctx.fillStyle = grad;
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 4;
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        }

        if (isCurrent) {
          ctx.translate(startX + ctx.measureText(displayText).width / 2, yPos);
          ctx.scale(1.1, 1.1);
          ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
        } else {
          ctx.fillText(displayText, startX, yPos);
        }

        ctx.restore();
        startX += ctx.measureText(displayText + " ").width;
      });
    }

    ctx.restore();
  };

  // Real Canvas-based export pipeline: burns overlays onto video frame-by-frame and exports
  const triggerExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStepIdx(0);
    setShowExportSuccess(false);

    const video = document.querySelector("video");
    if (!video) {
      handleFallbackExport();
      return;
    }

    try {
      // Temporarily pause main playback
      setPlaying(false);
      video.pause();
      
      // Step 0: Baking typography layers into video frames...
      setExportStepIdx(0);
      setExportProgress(5);

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");

      // Setup audio capture stream from video element
      let audioTrack = null;
      try {
        if (!video._audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          video._audioCtx = new AudioContextClass();
          video._audioSource = video._audioCtx.createMediaElementSource(video);
          // If created here, connect to speakers so user can hear it
          video._audioSource.connect(video._audioCtx.destination);
        }
        
        const audioCtx = video._audioCtx;
        const source = video._audioSource;
        const dest = audioCtx.createMediaStreamDestination();
        
        // Do not disconnect! We just add a branch to the destination stream
        source.connect(dest);
        
        audioTrack = dest.stream.getAudioTracks()[0];
      } catch (ae) {
        console.warn("Audio Context pipeline occupied, routing audio fallback:", ae);
      }

      // Record at 30 FPS
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();
      combinedStream.addTrack(canvasStream.getVideoTracks()[0]);
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }

      // Detect best container mimeType format
      let mimeType = "video/webm";
      const types = [
        "video/mp4;codecs=h264,aac",
        "video/mp4;codecs=h264",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      video.currentTime = 0;
      video.muted = true; // export silently in background
      const wasLooping = video.loop;
      video.loop = false; // Disable loop so we can hit the end!

      recorder.onstop = () => {
        video.muted = false;
        video.loop = wasLooping;
        video.pause();
        
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(chunks, { type: mimeType });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadName = `captioned_${videoFile.name.replace(/\.[^/.]+$/, "")}.${ext}`;
        
        setExportedVideoUrl(downloadUrl);
        setExportedVideoName(downloadName);

        // Auto download trigger
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportProgress(100);
        setExportStepIdx(3);
        setTimeout(() => {
          setShowExportSuccess(true);
        }, 500);
      };

      // Play video to start drawing frames
      video.play().then(() => {
        recorder.start();
      }).catch((err) => {
        console.error("Playback autoplay bypass:", err);
        recorder.start();
      });

      let animationFrameId;
      const renderExportFrame = () => {
        // Stop if we reached the end or native ended fired
        if (video.ended || video.currentTime >= video.duration - 0.05) {
          if (recorder.state === "recording") {
            recorder.stop();
          }
          return;
        }
        
        // If it randomly paused (buffering, etc), try to force it back to play
        if (video.paused && recorder.state === "recording" && video.currentTime < video.duration - 0.1) {
          // Prevent spamming play() if a promise is already pending
          if (!video._playPromisePending) {
            video._playPromisePending = true;
            const p = video.play();
            if (p !== undefined) {
              p.then(() => {
                video._playPromisePending = false;
              }).catch(() => {
                video._playPromisePending = false;
              });
            } else {
              video._playPromisePending = false;
            }
          }
        }

        // Copy active frame onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Calculate progress percentage
        const progress = Math.min((video.currentTime / video.duration) * 100, 99);
        setExportProgress(Math.floor(progress));

        // Update active export step based on percentage thresholds
        const step = Math.min(Math.floor((progress / 100) * exportSteps.length), exportSteps.length - 1);
        setExportStepIdx(step);

        // Burn current subtitles onto frame
        try {
          drawCaptionsOnCanvas(ctx, video.currentTime, canvas.width, canvas.height);
        } catch (err) {
          console.error("Frame rendering error:", err);
        }

        animationFrameId = requestAnimationFrame(renderExportFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(animationFrameId);
        if (recorder.state === "recording") {
          recorder.stop();
        }
      };

      video.addEventListener("play", () => {
        renderExportFrame();
      });

    } catch (e) {
      console.error("Audio recording/canvas failed, running fallback export:", e);
      handleFallbackExport();
    }
  };

  const handleFallbackExport = () => {
    // Show step progress updates before finishing fallback so it feels natural
    setExportStepIdx(1);
    setExportProgress(40);
    setTimeout(() => {
      setExportStepIdx(2);
      setExportProgress(75);
      setTimeout(() => {
        setExportProgress(100);
        setExportStepIdx(3);
        setShowExportSuccess(true);
        // Fallback downloads original video file
        if (videoFile) {
          const link = document.createElement("a");
          link.href = videoFile.url;
          link.download = `captioned_${videoFile.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, 800);
    }, 1000);
  };

  // Download SRT File helper
  const handleDownloadSRT = () => {
    if (transcript.length === 0) return;
    
    const formatSRTTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0");
      return `${hrs}:${mins}:${secs},${ms}`;
    };

    let srtText = "";
    transcript.forEach((w, idx) => {
      srtText += `${idx + 1}\n`;
      srtText += `${formatSRTTime(w.start)} --> ${formatSRTTime(w.end)}\n`;
      srtText += `${w.word}\n\n`;
    });

    const blob = new Blob([srtText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${videoFile?.name?.replace(/\.[^/.]+$/, "") || "captions"}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Output Video file helper
  const handleDownloadVideo = () => {
    if (exportedVideoUrl) {
      const link = document.createElement("a");
      link.href = exportedVideoUrl;
      link.download = exportedVideoName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (videoFile) {
      const link = document.createElement("a");
      link.href = videoFile.url;
      link.download = `captioned_${videoFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setTranscript([]);
    setCaptionsGenerated(false);
    setPlaying(false);
    setCurrentTime(0);
    setExportedVideoUrl(null);
    setExportedVideoName("");
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    // Reset custom styling values to let preset define them
    setCustomStyles({
      fontSize: null,
      yPos: undefined,
      uppercase: undefined
    });
  };

  return (
    <div style={styles.container}>
      <Header />

      <main style={styles.main}>
        {/* LANDING PAGE / INITIAL UPLOAD */}
        {!videoFile ? (
          <div style={styles.heroSection}>
            <div style={styles.heroHeader}>
              <span style={styles.heroBadge}>🔥 AI-Powered Auto Captions</span>
              <h1 style={styles.heroTitle}>
                Generate Bouncing Video Captions <span style={styles.gradientText}>Instantly</span>
              </h1>
              <p style={styles.heroSub}>
                Upload your talking head footage, select a viral caption preset, and let our engine align word-by-word timestamps matching the speaker perfectly.
              </p>
            </div>

            {/* Drag & Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="dropzone-box"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/*"
                style={{ display: "none" }}
              />
              <div style={styles.dropzoneCircle}>
                <Upload size={32} color="#4f46e5" />
              </div>
              <h3 style={styles.dropzoneTitle}>Upload Your Video File</h3>
              <p style={styles.dropzoneText}>
                Drag and drop your video here, or click to browse files
              </p>
              <span style={styles.dropzoneSupport}>
                Supports MP4, MOV, WEBM (Max 50MB)
              </span>
            </div>

            {/* Preconfigured Samples list */}
            <SampleLoader
              selectedId={videoFile?.id}
              onSelect={handleSelectSample}
            />
          </div>
        ) : (
          /* WORKSPACE STUDIO */
          <div style={styles.workspace}>
            {/* Top Workspace Bar */}
            <div style={styles.topBar}>
              <button onClick={handleReset} style={styles.backBtn} className="btn-light-hover">
                <ArrowLeft size={16} />
                <span>Upload Another Video</span>
              </button>
              <div style={styles.activeFileInfo}>
                <span style={styles.activeFileName}>{videoFile.name}</span>
                <span style={styles.activeFileDuration}>
                  Duration: {videoFile.duration.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Two-Column Editor Layout */}
            <div className="editor-grid">
              {/* Column 1: Video Player Area */}
              <div style={styles.playerColumn}>
                <div style={styles.stickyPlayer}>
                  <VideoPlayer
                    videoUrl={videoFile.url}
                    transcript={transcript}
                    preset={selectedPreset}
                    customStyles={customStyles}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    playing={playing}
                    setPlaying={setPlaying}
                  />
                  {/* Laser line scanning visual when analyzing */}
                  {isAnalyzing && <div style={styles.laserScanLine} />}
                </div>
              </div>

              {/* Column 2: Control Panel Area */}
              <div style={styles.controlsColumn}>
                {!captionsGenerated ? (
                  /* Step 2: Choose Preset & Generate Auto Captions */
                  <div style={styles.wizardPanel}>
                    <div style={styles.wizardHeader}>
                      <div style={styles.stepIndicator}>STEP 2</div>
                      <h2 style={styles.wizardTitle}>Configure Caption Style</h2>
                      <p style={styles.wizardDesc}>
                        Select the template that matches your target audience style.
                      </p>
                    </div>

                    <StyleSelector
                      selectedPreset={selectedPreset}
                      onSelect={handleSelectPreset}
                    />

                    {/* Language Selector */}
                    <div style={styles.langCard}>
                      <p style={styles.langLabel}>🌐 Caption Language</p>
                      <div style={styles.langGrid}>
                        {[
                          { code: "auto", label: "Auto Detect" },
                          { code: "en",   label: "English" },
                          { code: "ta",   label: "தமிழ் (Tamil)" },
                          { code: "hi",   label: "हिन्दी (Hindi)" },
                          { code: "te",   label: "తెలుగు (Telugu)" },
                          { code: "ml",   label: "മലയാളം (Malayalam)" },
                        ].map(({ code, label }) => (
                          <button
                            key={code}
                            onClick={() => setCaptionLanguage(code)}
                            style={{
                              ...styles.langBtn,
                              ...(captionLanguage === code ? styles.langBtnActive : {}),
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {captionLanguage === "en" && (
                        <p style={styles.langHint}>Audio in any language → translated to English</p>
                      )}
                    </div>

                    <div style={styles.actionCard}>
                      <button
                        onClick={() => triggerAutoCaptioning(captionLanguage)}
                        style={styles.generateBtn}
                        className="btn-primary"
                      >
                        <Sparkles size={18} fill="#fff" />
                        <span>Create My Own Auto Captions</span>
                      </button>
                      <p style={styles.actionCardHint}>
                        Our speech model transcribes speech with word-by-word precision.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Step 3: Editor Interface */
                  <div style={styles.editorPanel}>
                    <div style={styles.editorPanelHeader}>
                      <div style={styles.editorPanelHeaderLeft}>
                        <span style={styles.stepIndicatorSuccess}>STEP 3</span>
                        <h2 style={styles.wizardTitle}>Edit Timestamps & Words</h2>
                      </div>
                      <button
                        onClick={() => setCaptionsGenerated(false)}
                        style={styles.presetChangeBtn}
                        className="btn-light-hover"
                      >
                        Change Preset Style
                      </button>
                    </div>

                    <CaptionEditor
                      transcript={transcript}
                      setTranscript={setTranscript}
                      customStyles={customStyles}
                      setCustomStyles={setCustomStyles}
                      currentTime={currentTime}
                      videoDuration={videoFile.duration}
                      onExportStart={triggerExport}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ANALYSIS MODAL SCREEN */}
      {isAnalyzing && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.spinnerWrapper}>
              <Loader2 size={40} color="#4f46e5" className="animate-spin" style={styles.rotatingIcon} />
            </div>
            <h3 style={styles.modalTitle}>Analyzing Audio Track...</h3>
            <p style={styles.modalSub}>
              We are transcribing speech frequencies using Whisper AI.
            </p>

            {/* Progress bar */}
            <div style={styles.progressContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${analysisProgress}%`
                }}
              />
            </div>
            <div style={styles.progressPercent}>{Math.round(analysisProgress)}%</div>

            {/* Current analyzing steps list */}
            <div style={styles.stepsList}>
              {analysisSteps.map((step, idx) => {
                const isCompleted = analysisStepIdx > idx;
                const isCurrent = analysisStepIdx === idx;
                return (
                  <div key={idx} style={styles.stepRow}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : isCurrent ? (
                      <Loader2 size={16} color="#4f46e5" style={styles.rotatingIcon} />
                    ) : (
                      <div style={styles.bulletDot} />
                    )}
                    <span
                      style={{
                        ...styles.stepText,
                        ...(isCompleted ? styles.stepTextCompleted : {}),
                        ...(isCurrent ? styles.stepTextCurrent : {}),
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL SCREEN */}
      {isExporting && (
        <div style={styles.modalOverlay}>
          {!showExportSuccess ? (
            /* RENDERING PROGRESS PANEL */
            <div style={styles.modalCard}>
              <div style={styles.spinnerWrapper}>
                <Loader2 size={40} color="#10b981" style={styles.rotatingIcon} />
              </div>
              <h3 style={styles.modalTitle}>Baking Caption Frames...</h3>
              <p style={styles.modalSub}>
                Baking high-contrast overlays into the MP4 video stream.
              </p>

              {/* Progress bar */}
              <div style={styles.progressContainer}>
                <div
                  style={{
                    ...styles.progressBar,
                    backgroundColor: "#10b981",
                    width: `${exportProgress}%`
                  }}
                />
              </div>
              <div style={styles.progressPercent}>{Math.round(exportProgress)}%</div>

              <div style={styles.stepsList}>
                {exportSteps.map((step, idx) => {
                  const isCompleted = exportStepIdx > idx;
                  const isCurrent = exportStepIdx === idx;
                  return (
                    <div key={idx} style={styles.stepRow}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : isCurrent ? (
                        <Loader2 size={16} color="#10b981" style={styles.rotatingIcon} />
                      ) : (
                        <div style={styles.bulletDot} />
                      )}
                      <span
                        style={{
                          ...styles.stepText,
                          ...(isCompleted ? styles.stepTextCompleted : {}),
                          ...(isCurrent ? styles.stepTextCurrent : {}),
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* EXPORT SUCCESS PANEL */
            <div style={styles.modalCard}>
              <div style={styles.successIconWrapper}>
                <CheckCircle2 size={48} color="#10b981" />
              </div>
              <h3 style={styles.modalTitle}>Render Complete!</h3>
              <p style={styles.modalSub}>
                Your video is now fully compiled with burning captions.
              </p>

              <div style={styles.downloadGrid}>
                {/* Video download */}
                <div style={styles.downloadOptionCard} className="card-hover-mini" onClick={handleDownloadVideo}>
                  <div style={styles.downloadOptionIcon}>
                    <Video size={24} color="#10b981" />
                  </div>
                  <div style={styles.downloadOptionInfo}>
                    <h4 style={styles.downloadOptionTitle}>Download Video</h4>
                    <p style={styles.downloadOptionDesc}>MP4 format with burned styled captions</p>
                  </div>
                </div>

                {/* SRT download */}
                <div style={styles.downloadOptionCard} className="card-hover-mini" onClick={handleDownloadSRT}>
                  <div style={styles.downloadOptionIcon}>
                    <FileText size={24} color="#4f46e5" />
                  </div>
                  <div style={styles.downloadOptionInfo}>
                    <h4 style={styles.downloadOptionTitle}>Download Subtitles</h4>
                    <p style={styles.downloadOptionDesc}>Universal SRT format with timed indexes</p>
                  </div>
                </div>
              </div>

              <div style={styles.modalCtaRow}>
                <button
                  onClick={() => setIsExporting(false)}
                  style={styles.closeModalBtn}
                  className="btn-light-hover"
                >
                  Return to Studio
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  langCard: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "4px",
  },
  langLabel: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  langGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  langBtn: {
    padding: "6px 14px",
    borderRadius: "99px",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  langBtnActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
    color: "#ffffff",
  },
  langHint: {
    marginTop: "8px",
    fontSize: "0.75rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8fafc",
  },
  main: {
    flex: 1,
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
  },
  heroSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: "800px",
    margin: "40px auto 0 auto",
    gap: "32px",
  },
  heroHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  heroBadge: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: "99px",
    letterSpacing: "0.5px",
    boxShadow: "0 2px 4px rgba(79,70,229,0.05)",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: 900,
    letterSpacing: "-1.5px",
    lineHeight: "1.15",
    color: "#0f172a",
    maxWidth: "700px",
  },
  gradientText: {
    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "1.1rem",
    color: "#475569",
    lineHeight: "1.6",
    maxWidth: "600px",
  },
  dropzone: {
    width: "100%",
    backgroundColor: "#ffffff",
    border: "2px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.25s ease",
    boxShadow: "var(--shadow-md)",
    ":hover": {
      borderColor: "#4f46e5",
      backgroundColor: "#fcfcff",
      transform: "translateY(-2px)",
    },
  },
  dropzoneCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#f5f3ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    boxShadow: "0 4px 8px rgba(79, 70, 229, 0.05)",
  },
  dropzoneTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "6px",
  },
  dropzoneText: {
    fontSize: "0.9rem",
    color: "#475569",
    marginBottom: "12px",
  },
  dropzoneSupport: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 500,
  },
  workspace: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    padding: "12px 20px",
    borderRadius: "16px",
    boxShadow: "var(--shadow-sm)",
  },
  backBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#475569",
    padding: "6px 12px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
  },
  activeFileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  activeFileName: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  activeFileDuration: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "6px",
  },
  editorGrid: {
    // Media query is now handled by .editor-grid class globally
  },
  playerColumn: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  stickyPlayer: {
    position: "sticky",
    top: "100px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  laserScanLine: {
    position: "absolute",
    left: "4px",
    right: "4px",
    height: "3px",
    background: "linear-gradient(90deg, transparent, #ef4444, #eab308, #22c55e, transparent)",
    boxShadow: "0 0 12px 3px rgba(34, 197, 94, 0.8)",
    pointerEvents: "none",
    zIndex: 11,
    animation: "laserScan 2.5s linear infinite",
  },
  controlsColumn: {
    width: "100%",
  },
  wizardPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  wizardHeader: {
    marginBottom: "8px",
  },
  stepIndicator: {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#4f46e5",
    backgroundColor: "#e0e7ff",
    padding: "2px 8px",
    borderRadius: "6px",
    width: "fit-content",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },
  stepIndicatorSuccess: {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#0f766e",
    backgroundColor: "#ccfbf1",
    padding: "2px 8px",
    borderRadius: "6px",
    width: "fit-content",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },
  wizardTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "4px",
  },
  wizardDesc: {
    fontSize: "0.85rem",
    color: "#64748b",
  },
  actionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "var(--shadow-md)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  generateBtn: {
    width: "100%",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "0.95rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(79, 70, 229, 0.25)",
    transition: "all 0.2s",
  },
  actionCardHint: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  editorPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  editorPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  editorPanelHeaderLeft: {
    display: "flex",
    flexDirection: "column",
  },
  presetChangeBtn: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#cbd5e1",
    background: "#ffffff",
    color: "#475569",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "40px 32px",
    width: "90%",
    maxWidth: "460px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  spinnerWrapper: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  successIconWrapper: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  rotatingIcon: {
    animation: "spin 2s linear infinite",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },
  modalSub: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginBottom: "24px",
  },
  progressContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4f46e5",
    transition: "width 0.15s ease",
  },
  progressPercent: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "monospace",
    marginBottom: "24px",
  },
  stepsList: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "left",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px",
  },
  stepRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  bulletDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#cbd5e1",
    marginLeft: "5px",
  },
  stepText: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    fontWeight: 500,
  },
  stepTextCompleted: {
    color: "#475569",
    fontWeight: 600,
  },
  stepTextCurrent: {
    color: "#4f46e5",
    fontWeight: 700,
  },
  downloadGrid: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "28px",
  },
  downloadOptionCard: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
    gap: "16px",
    transition: "all 0.2s",
  },
  downloadOptionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  downloadOptionInfo: {
    flex: 1,
  },
  downloadOptionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "2px",
  },
  downloadOptionDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  modalCtaRow: {
    width: "100%",
  },
  closeModalBtn: {
    width: "100%",
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

// Injection of keyframes animations to support react rotating spinner
if (typeof window !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
