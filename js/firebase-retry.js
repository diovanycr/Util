/**
 * firebase-retry.js — Wrapper com retry automático para chamadas do Firebase
 */

const RETRY_DELAYS = [1000, 2000, 4000];

export async function withRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLast = i === retries - 1;
            const isRetryable = 
                error.code === 'unavailable' ||
                error.code === 'deadline-exceeded' ||
                error.code === 'resource-exhausted' ||
                error.message?.includes('network') ||
                error.message?.includes('timeout');

            if (isLast || !isRetryable) {
                throw error;
            }

            const delay = RETRY_DELAYS[i] || 4000;
            console.warn(`Retry ${i + 1}/${retries} after ${delay}ms:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export function withRetrySync(fn, retries = 3) {
    return async (...args) => withRetry(() => fn(...args), retries);
}