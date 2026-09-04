/**
 * @file Module for resilient operation execution with exponential backoff retry.
 */

/**
 * Default sleeper using setTimeout.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function defaultSleeper(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a Firebase or network error is retryable.
 * @param {any} error
 * @returns {boolean}
 */
export function isFirebaseErrorRetryable(error) {
    if (!error) return false;

    const code = typeof error.code === 'string' ? error.code.toLowerCase() : '';
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';

    // Non-retryable error codes
    const nonRetryableCodes = [
        'permission-denied',
        'unauthenticated',
        'invalid-argument',
        'already-exists',
        'not-found',
        'failed-precondition',
        'out-of-range',
        'unimplemented',
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password'
    ];

    if (nonRetryableCodes.some(c => code.includes(c))) {
        return false;
    }

    // Retryable error codes or messages
    const retryableIndicators = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'aborted',
        'network-request-failed',
        'failed to fetch',
        'network error',
        'timeout'
    ];

    if (retryableIndicators.some(i => code.includes(i) || message.includes(i))) {
        return true;
    }

    // Default: retry on unexpected errors unless explicitly non-retryable
    return true;
}

/**
 * @template T
 * @typedef {Object} RetryOptions
 * @property {number} [maxRetries=3] Maximum number of retry attempts.
 * @property {number} [initialDelayMs=300] Initial delay in milliseconds.
 * @property {number} [maxDelayMs=3000] Maximum delay cap in milliseconds.
 * @property {number} [backoffFactor=2] Multiplier applied to delay after each failure.
 * @property {boolean} [jitter=true] Whether to apply random jitter to delay.
 * @property {(ms: number) => Promise<void>} [sleeper=defaultSleeper] Delay mechanism (injectable for unit tests).
 * @property {(error: any) => boolean} [isRetryable=isFirebaseErrorRetryable] Filter function determining if error is retryable.
 * @property {(attempt: number, error: any, delayMs: number) => void} [onRetry] Callback triggered before each retry attempt.
 * @property {AbortSignal} [signal] Optional AbortSignal to cancel retries.
 */

/**
 * Executes an async function with exponential backoff retries.
 * 
 * @template T
 * @param {() => Promise<T>} fn Async function to execute.
 * @param {RetryOptions<T>} [options={}] Retry configuration options.
 * @returns {Promise<T>}
 */
export async function executeWithRetry(fn, options = {}) {
    const {
        maxRetries = 3,
        initialDelayMs = 300,
        maxDelayMs = 3000,
        backoffFactor = 2,
        jitter = true,
        sleeper = defaultSleeper,
        isRetryable = isFirebaseErrorRetryable,
        onRetry,
        signal
    } = options;

    let currentDelay = initialDelayMs;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        if (signal?.aborted) {
            const abortError = new Error('Operação cancelada pelo usuário.');
            abortError.name = 'AbortError';
            throw abortError;
        }

        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = attempt > maxRetries;
            const canRetry = !isLastAttempt && isRetryable(error);

            if (!canRetry) {
                throw error;
            }

            let delayForThisAttempt = Math.min(currentDelay, maxDelayMs);
            if (jitter) {
                // Apply jitter between 80% and 120% of delay
                const jitterMultiplier = 0.8 + Math.random() * 0.4;
                delayForThisAttempt = Math.round(delayForThisAttempt * jitterMultiplier);
            }

            if (onRetry) {
                try {
                    onRetry(attempt, error, delayForThisAttempt);
                } catch {
                    // Ignore errors in onRetry callback
                }
            }

            await sleeper(delayForThisAttempt);
            currentDelay *= backoffFactor;
        }
    }

    throw new Error('Falha inesperada no fluxo de retry.');
}
