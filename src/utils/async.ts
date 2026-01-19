/**
 * Async Utilities
 * 
 * Common async patterns used across the codebase.
 */

/**
 * Generic "wait with timeout" utility.
 * 
 * Creates a promise that resolves when the callback is invoked, or rejects/returns
 * a timeout value after the specified duration.
 * 
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param timeoutValue - Value to return on timeout
 * @param registerCallback - Function to register the success callback; receives
 *                          a cleanup function to call when the callback is invoked.
 *                          Must return an unregister function to remove the callback on timeout.
 * @returns Promise that resolves with the success value or timeout value
 * 
 * @example
 * // Wait for an event with timeout
 * const result = await waitWithTimeout(
 *     5000,
 *     null, // timeout value
 *     (onSuccess) => {
 *         const handler = (value) => onSuccess(value);
 *         emitter.on('event', handler);
 *         return () => emitter.off('event', handler); // cleanup
 *     }
 * );
 */
export function waitWithTimeout<T, TTimeout = T>(
    timeoutMs: number,
    timeoutValue: TTimeout,
    registerCallback: (onSuccess: (value: T) => void) => () => void
): Promise<T | TTimeout> {
    return new Promise((resolve) => {
        let settled = false;

        const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            unregister();
            resolve(timeoutValue);
        }, timeoutMs);

        const onSuccess = (value: T) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(value);
        };

        const unregister = registerCallback(onSuccess);
    });
}

/**
 * Sleep for a specified number of milliseconds.
 * 
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
