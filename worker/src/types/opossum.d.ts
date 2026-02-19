declare module "opossum" {
  export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
  }

  export default class CircuitBreaker<TArgs extends any[] = any[], TResult = any> {
    constructor(action: (...args: TArgs) => Promise<TResult>, options?: CircuitBreakerOptions);
    fire(...args: TArgs): Promise<TResult>;
    on(event: "open" | "halfOpen" | "close" | "reject" | "timeout" | "failure" | "success", listener: (...args: any[]) => void): this;
  }
}

