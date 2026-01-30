/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for a given attempt with exponential backoff + jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelayMs * Math.pow(options.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, options.maxDelayMs);
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        const delayMs = calculateDelay(attempt, opts);

        if (opts.onRetry) {
          opts.onRetry(attempt + 1, lastError, delayMs);
        }

        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  onOpen?: () => void;
  onClose?: () => void;
}

const DEFAULT_CIRCUIT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
};

/**
 * Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  };

  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_CIRCUIT_OPTIONS, ...options };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error("Circuit breaker is open - service unavailable");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (!this.state.isOpen) {
      return false;
    }

    // Check if reset timeout has passed
    const now = Date.now();
    if (now - this.state.lastFailure >= this.options.resetTimeoutMs) {
      this.reset();
      return false;
    }

    return true;
  }

  private onSuccess(): void {
    if (this.state.failures > 0) {
      this.reset();
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.options.failureThreshold) {
      this.state.isOpen = true;
      this.options.onOpen?.();
    }
  }

  private reset(): void {
    const wasOpen = this.state.isOpen;
    this.state = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    if (wasOpen) {
      this.options.onClose?.();
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}
