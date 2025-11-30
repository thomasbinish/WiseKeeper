
import { pipeline, env } from '@xenova/transformers';

// Skip local model checks
env.allowLocalModels = false;

// Singleton instance of the classifier
class PipelineSingleton {
    static task = 'zero-shot-classification';
    static currentModel = 'Xenova/mobilebert-uncased-mnli';
    static instance: any = null;

    static async getInstance(progressCallback: any = null, model: string) {
        if (this.instance === null || this.currentModel !== model) {
            this.currentModel = model;
            this.instance = await pipeline(this.task as any, this.model, { progress_callback: progressCallback });
        }
        return this.instance;
    }
    
    static get model() {
        return this.currentModel;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    if (type === 'classify') {
        const { text, labels, id, model } = data;

        try {
            const classifier = await PipelineSingleton.getInstance((progress: any) => {
                // Relay download progress to main thread
                self.postMessage({
                    type: 'progress',
                    data: progress
                });
            }, model || 'Xenova/mobilebert-uncased-mnli');

            const output = await classifier(text, labels);

            self.postMessage({
                type: 'result',
                data: {
                    id,
                    result: output
                }
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: {
                    id,
                    error: String(error)
                }
            });
        }
    }
});
