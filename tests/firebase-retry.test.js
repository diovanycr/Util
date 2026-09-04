import { executeWithRetry, isFirebaseErrorRetryable } from '../js/core/retry.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ ${message}`);
    }
}

async function runAsyncTest(name, fn) {
    console.log(`\nTest: ${name}`);
    try {
        await fn();
    } catch (e) {
        failed++;
        console.error(`  ✗ Threw unexpected error: ${e.message}`);
    }
}

console.log('Running Firebase retry policy tests...\n');

// 1. Classification Tests
assert(isFirebaseErrorRetryable({ code: 'unavailable' }) === true, 'unavailable should be retryable');
assert(isFirebaseErrorRetryable({ code: 'resource-exhausted' }) === true, 'resource-exhausted should be retryable');
assert(isFirebaseErrorRetryable({ message: 'network-request-failed' }) === true, 'network-request-failed should be retryable');
assert(isFirebaseErrorRetryable({ code: 'permission-denied' }) === false, 'permission-denied should NOT be retryable');
assert(isFirebaseErrorRetryable({ code: 'unauthenticated' }) === false, 'unauthenticated should NOT be retryable');
assert(isFirebaseErrorRetryable({ code: 'invalid-argument' }) === false, 'invalid-argument should NOT be retryable');

// Async Behavior Tests
await runAsyncTest('Succeeds on first attempt without retries or delay', async () => {
    let callCount = 0;
    const sleptDelays = [];
    const sleeper = async (ms) => { sleptDelays.push(ms); };

    const result = await executeWithRetry(
        async () => {
            callCount++;
            return 'OK';
        },
        { maxRetries: 3, sleeper }
    );

    assert(result === 'OK', 'Should return result of function');
    assert(callCount === 1, 'Should call target function exactly once');
    assert(sleptDelays.length === 0, 'Should not trigger any delays on immediate success');
});

await runAsyncTest('Recovers from transient errors after 2 attempts', async () => {
    let callCount = 0;
    const sleptDelays = [];
    const onRetryCalls = [];
    const sleeper = async (ms) => { sleptDelays.push(ms); };

    const result = await executeWithRetry(
        async () => {
            callCount++;
            if (callCount < 3) {
                const err = new Error('Temporarily unavailable');
                /** @type {any} */ (err).code = 'unavailable';
                throw err;
            }
            return 'RECOVERED';
        },
        {
            maxRetries: 3,
            initialDelayMs: 100,
            jitter: false,
            sleeper,
            onRetry: (attempt, err, delay) => {
                onRetryCalls.push({ attempt, delay });
            }
        }
    );

    assert(result === 'RECOVERED', 'Should return result after recovery');
    assert(callCount === 3, 'Should attempt 3 times');
    assert(sleptDelays.length === 2, 'Should sleep 2 times before success');
    assert(sleptDelays[0] === 100, 'First delay should match initialDelayMs');
    assert(sleptDelays[1] === 200, 'Second delay should apply backoffFactor of 2');
    assert(onRetryCalls.length === 2, 'onRetry callback should be called twice');
});

await runAsyncTest('Fails immediately on non-retryable error without retrying', async () => {
    let callCount = 0;
    const sleptDelays = [];
    const sleeper = async (ms) => { sleptDelays.push(ms); };

    let caughtError = null;
    try {
        await executeWithRetry(
            async () => {
                callCount++;
                const err = new Error('Permission Denied');
                /** @type {any} */ (err).code = 'permission-denied';
                throw err;
            },
            { maxRetries: 3, sleeper }
        );
    } catch (e) {
        caughtError = e;
    }

    assert(caughtError !== null, 'Should throw non-retryable error');
    assert(callCount === 1, 'Should not retry non-retryable errors');
    assert(sleptDelays.length === 0, 'Should not sleep for non-retryable errors');
});

await runAsyncTest('Throws original error when maxRetries is exceeded', async () => {
    let callCount = 0;
    const sleptDelays = [];
    const sleeper = async (ms) => { sleptDelays.push(ms); };

    let caughtError = null;
    try {
        await executeWithRetry(
            async () => {
                callCount++;
                const err = new Error('Resource Exhausted');
                /** @type {any} */ (err).code = 'resource-exhausted';
                throw err;
            },
            { maxRetries: 2, jitter: false, sleeper }
        );
    } catch (e) {
        caughtError = e;
    }

    assert(caughtError !== null && caughtError.message === 'Resource Exhausted', 'Should throw last error');
    assert(callCount === 3, 'Should attempt maxRetries + 1 times (1 initial + 2 retries)');
    assert(sleptDelays.length === 2, 'Should sleep maxRetries times');
});

await runAsyncTest('Cancels operation when AbortSignal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    let callCount = 0;
    let caughtError = null;

    try {
        await executeWithRetry(
            async () => {
                callCount++;
                return 'DATA';
            },
            { signal: controller.signal }
        );
    } catch (e) {
        caughtError = e;
    }

    assert(caughtError !== null && caughtError.name === 'AbortError', 'Should throw AbortError when signal is pre-aborted');
    assert(callCount === 0, 'Should not execute function if pre-aborted');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
