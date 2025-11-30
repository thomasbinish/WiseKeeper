import { useState, useEffect, useRef, useCallback } from 'react';

interface AIResult {
    id: string;
    result: {
        labels: string[];
        scores: number[];
        sequence: string;
    };
}

interface AIProgress {
    status: string;
    name: string;
    file: string;
    progress: number;
    loaded: number;
    total: number;
}

export function useAiClassifier() {
    const worker = useRef<Worker | null>(null);
    const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [progress, setProgress] = useState<AIProgress | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const activeReject = useRef<((reason?: any) => void) | null>(null);

    const initWorker = useCallback(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker/ai.worker.ts', import.meta.url));

            worker.current.addEventListener('message', (event) => {
                const { type, data } = event.data;

                if (type === 'progress') {
                    setModelStatus('loading');
                    setProgress(data);
                    if (data.status === 'ready') {
                        setModelStatus('ready');
                    }
                } else if (type === 'result') {
                    // Handled by promise
                    setModelStatus('ready');
                }
            });
        }
    }, []);

    useEffect(() => {
        initWorker();

        return () => {
            worker.current?.terminate();
            worker.current = null;
        };
    }, [initWorker]);

    const cancel = useCallback(() => {
        if (activeReject.current) {
            activeReject.current(new Error('Cancelled by user'));
            activeReject.current = null;
        }
        if (worker.current) {
            worker.current.terminate();
            worker.current = null;
        }
        setIsProcessing(false);
        setModelStatus('idle');
        setProgress(null);
    }, []);

    const classify = useCallback((text: string, labels: string[], id: string, model?: string): Promise<AIResult> => {
        return new Promise((resolve, reject) => {
            if (!worker.current) {
                initWorker();
            }

            if (!worker.current) { // Should not happen if initWorker works
                reject(new Error('Failed to initialize worker'));
                return;
            }

            activeReject.current = reject;
            setIsProcessing(true);

            let timeoutId: NodeJS.Timeout;
            const TIMEOUT_MS = 120000; // 120 seconds base timeout

            const resetTimeout = () => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    worker.current?.removeEventListener('message', handleMessage);
                    setIsProcessing(false);
                    activeReject.current = null;
                    reject(new Error('Classification timed out'));
                }, TIMEOUT_MS);
            };

            resetTimeout();

            const handleMessage = (event: MessageEvent) => {
                const { type, data } = event.data;

                if (type === 'progress') {
                    resetTimeout(); // Reset timeout on progress
                } else if (type === 'result' && data.id === id) {
                    if (timeoutId) clearTimeout(timeoutId);
                    worker.current?.removeEventListener('message', handleMessage);
                    setIsProcessing(false);
                    activeReject.current = null;
                    resolve(data);
                } else if (type === 'error' && data.id === id) {
                    if (timeoutId) clearTimeout(timeoutId);
                    worker.current?.removeEventListener('message', handleMessage);
                    setIsProcessing(false);
                    activeReject.current = null;
                    reject(new Error(data.error));
                }
            };

            worker.current.addEventListener('message', handleMessage);

            worker.current.postMessage({
                type: 'classify',
                data: { text, labels, id, model }
            });
        });
    }, [initWorker]);

    // Wrapper with retry
    const classifyWithRetry = useCallback(async (text: string, labels: string[], model?: string, retries = 1): Promise<AIResult> => {
        const id = Math.random().toString(36).substring(7); // Generate a unique ID for this classification attempt
        try {
            return await classify(text, labels, id, model);
        } catch (error) {
            if (String(error).includes('Cancelled')) {
                throw error; // Don't retry if cancelled
            }
            if (retries > 0 && String(error).includes('timed out')) {
                console.log('Retrying classification...');
                return classifyWithRetry(text, labels, model, retries - 1);
            }
            throw error;
        }
    }, [classify]);

    return {
        classify: classifyWithRetry,
        cancel,
        modelStatus,
        progress,
        isProcessing
    };
}
