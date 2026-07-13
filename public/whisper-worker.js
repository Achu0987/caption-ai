importScripts('/transformers.min.js');

const { pipeline, env } = self.transformers;
env.allowLocalModels = false;
let transcriber = null;

self.onmessage = async (e) => {
  const { audioData } = e.data;
  try {
    if (!transcriber) {
      self.postMessage({ type: 'status', step: 2, progress: 60, message: 'Downloading model...' });
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        progress_callback: (data) => {
          if (data.status === 'progress') {
            const pct = Math.round(60 + (data.progress / 100) * 20);
            self.postMessage({
              type: 'status',
              step: 2,
              progress: pct,
              message: 'Loading model files: ' + Math.round(data.progress) + '%'
            });
          }
        }
      });
    }

    self.postMessage({ type: 'status', step: 2, progress: 85, message: 'Transcribing speech...' });

    const output = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: 'word',
    });

    self.postMessage({ type: 'success', result: output });
  } catch (err) {
    self.postMessage({ type: 'error', error: err.message });
  }
};
