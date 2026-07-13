import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in the browser
env.allowLocalModels = false;

// We use a class to ensure only one instance of the transcriber is loaded.
class PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny'; // We use tiny for faster downloads in the browser
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { pcm, language, maxSecs } = event.data;

    try {
        // Send a message back to indicate loading has started
        self.postMessage({ status: 'loading' });

        const transcriber = await PipelineFactory.getInstance(data => {
            // Forward download progress back to the main thread
            self.postMessage({ status: 'progress', data });
        });

        self.postMessage({ status: 'analyzing' });

        const inferenceOptions = {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: 'word',
        };

        const langMap = {
            "ta": "tamil",
            "hi": "hindi",
            "te": "telugu",
            "ml": "malayalam",
            "en": "english"
        };

        if (language === "en") {
            // Translate to English
            inferenceOptions.task = "translate";
            inferenceOptions.language = "english";
        } else if (language !== "auto") {
            // Specific language
            inferenceOptions.task = "transcribe";
            inferenceOptions.language = langMap[language] || language;
        }

        const result = await transcriber(pcm, inferenceOptions);

        self.postMessage({ status: 'complete', result, maxSecs });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
