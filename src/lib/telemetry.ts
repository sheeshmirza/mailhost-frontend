"use client";

export interface TelemetryEvent {
  type: "error" | "api_retry" | "boundary_catch" | "offline_event";
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private readonly maxEvents = 100;

  log(type: TelemetryEvent["type"], message: string, context?: Record<string, unknown>) {
    const event: TelemetryEvent = {
      type,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    if (process.env.NODE_ENV !== "production") {
      // In dev, log structured telemetry for debugging
      console.warn(`[Telemetry:${type}] ${message}`, context || "");
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log("error", message, {
      ...(context || {}),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  getRecentEvents(): TelemetryEvent[] {
    return [...this.events];
  }
}

export const telemetry = new TelemetryService();
