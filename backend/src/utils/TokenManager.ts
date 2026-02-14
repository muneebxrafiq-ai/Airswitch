
/**
 * TokenManager handles the lifecycle of an access token.
 * It provides auto-refresh capabilities, mutex locking for refresh requests,
 * and proactive expiry checks.
 */
export class TokenManager {
    private accessToken: string | null = null;
    private expiresAt: number = 0; // Epoch time in milliseconds
    private refreshPromise: Promise<string> | null = null;

    /**
     * @param fetchTokenFn Function that retrieves a new token and its lifespan (in seconds)
     * @param bufferPercentage Percentage of lifespan to effectively shorten token validity.
     *                         Default 0.2 means refresh when 80% of life is used (20% remaining).
     */
    constructor(
        private fetchTokenFn: () => Promise<{ token: string; expiresIn: number }>,
        private bufferPercentage: number = 0.2
    ) { }

    /**
     * Returns a valid access token.
     * If the current token is expired or near expiry, it triggers a refresh.
     */
    public async getToken(): Promise<string> {
        if (this.isTokenExpiredOrNearExpiry()) {
            return this.refreshToken();
        }
        return this.accessToken!;
    }

    /**
     * Forces a token refresh.
     * Uses a mutex (promise) to prevent multiple concurrent refresh calls.
     */
    public async refreshToken(): Promise<string> {
        // Mutex: If a refresh is already in progress, return the existing promise.
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                // console.log('[TokenManager] Refreshing token...'); // Reduce noise logs
                const { token, expiresIn } = await this.fetchTokenFn();
                this.accessToken = token;

                // Calculate expiry time with buffer
                // Expiry = Now + (Lifespan * (1 - buffer))
                // e.g., 3600s * 0.8 = 2880s usage window (refresh at 80%)
                const now = Date.now();
                const effectiveLifespanMs = (expiresIn * 1000) * (1 - this.bufferPercentage);
                this.expiresAt = now + effectiveLifespanMs;

                // console.log(`[TokenManager] Token refreshed. Expires in: ${expiresIn}s (Next refresh in: ${effectiveLifespanMs / 1000}s)`);

                return token;
            } catch (error) {
                console.error('[TokenManager] Failed to refresh token:', error);
                throw error;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    private isTokenExpiredOrNearExpiry(): boolean {
        if (!this.accessToken) return true;
        // Check if current time is past the "safe" expiry time
        return Date.now() >= this.expiresAt;
    }

    // For debugging/testing
    public getExpiryStatus() {
        return {
            hasToken: !!this.accessToken,
            expiresAt: new Date(this.expiresAt).toISOString(),
            isExpired: this.isTokenExpiredOrNearExpiry()
        };
    }
}
