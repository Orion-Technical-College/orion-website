/**
 * Debug utilities for tracking app behavior and performance
 * Only active in development mode or when explicitly enabled
 */

import React from "react";

const DEBUG_ENABLED =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && localStorage.getItem("debugAppBehavior") === "true");

const DEBUG_COLORS = {
  render: "#4CAF50",
  state: "#2196F3",
  effect: "#FF9800",
  callback: "#9C27B0",
  performance: "#F44336",
  warning: "#FFC107",
  error: "#E91E63",
};

interface DebugLog {
  timestamp: number;
  type: string;
  component: string;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private renderCounts: Map<string, number> = new Map();
  private lastRenderTime: Map<string, number> = new Map();
  private stateChanges: Map<string, any[]> = new Map();
  private performanceMarks: Map<string, number> = new Map();

  private shouldLog(): boolean {
    return DEBUG_ENABLED;
  }

  private formatMessage(type: string, component: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    return `[${timestamp}] [${type}] [${component}] ${message}`;
  }

  private log(type: string, component: string, message: string, data?: any, color?: string) {
    if (!this.shouldLog()) return;

    const logEntry: DebugLog = {
      timestamp: Date.now(),
      type,
      component,
      message,
      data,
    };
    this.logs.push(logEntry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    const formattedMessage = this.formatMessage(type, component, message, data);
    const style = color ? `color: ${color}; font-weight: bold;` : "";

    if (data) {
      console.log(`%c${formattedMessage}`, style, data);
    } else {
      console.log(`%c${formattedMessage}`, style);
    }
  }

  logRender(component: string, props?: any, state?: any) {
    const count = (this.renderCounts.get(component) || 0) + 1;
    this.renderCounts.set(component, count);

    const now = Date.now();
    const lastTime = this.lastRenderTime.get(component);
    const timeSinceLastRender = lastTime ? now - lastTime : 0;
    this.lastRenderTime.set(component, now);

    // Warn if rendering too frequently
    if (timeSinceLastRender > 0 && timeSinceLastRender < 16) {
      this.log(
        "warning",
        component,
        `⚠️ Rapid re-render detected: ${timeSinceLastRender}ms since last render (render #${count})`,
        { timeSinceLastRender, count },
        DEBUG_COLORS.warning
      );
    }

    this.log(
      "render",
      component,
      `🔄 Render #${count}${timeSinceLastRender > 0 ? ` (${timeSinceLastRender}ms since last)` : ""}`,
      { count, timeSinceLastRender, props, state },
      DEBUG_COLORS.render
    );
  }

  logStateChange(component: string, stateName: string, oldValue: any, newValue: any) {
    const key = `${component}.${stateName}`;
    if (!this.stateChanges.has(key)) {
      this.stateChanges.set(key, []);
    }
    const changes = this.stateChanges.get(key)!;
    changes.push({ timestamp: Date.now(), oldValue, newValue });

    // Keep only last 50 changes per state
    if (changes.length > 50) {
      changes.shift();
    }

    // Warn if state is changing rapidly
    if (changes.length > 1) {
      const lastChange = changes[changes.length - 2];
      const timeSinceLastChange = Date.now() - lastChange.timestamp;
      if (timeSinceLastChange < 100) {
        this.log(
          "warning",
          component,
          `⚠️ Rapid state change: ${stateName} changed ${timeSinceLastChange}ms after previous change`,
          { stateName, timeSinceLastChange, oldValue, newValue },
          DEBUG_COLORS.warning
        );
      }
    }

    this.log(
      "state",
      component,
      `📊 State change: ${stateName}`,
      { stateName, oldValue, newValue },
      DEBUG_COLORS.state
    );
  }

  logEffect(component: string, effectName: string, dependencies: any[], hasChanged: boolean) {
    this.log(
      "effect",
      component,
      `⚡ Effect: ${effectName}${hasChanged ? " (dependencies changed)" : " (no change)"}`,
      { effectName, dependencies, hasChanged },
      DEBUG_COLORS.effect
    );
  }

  logCallback(component: string, callbackName: string, dependencies: any[], isNew: boolean) {
    if (isNew) {
      this.log(
        "callback",
        component,
        `🔧 Callback recreated: ${callbackName}`,
        { callbackName, dependencies },
        DEBUG_COLORS.callback
      );
    }
  }

  startPerformanceMark(marker: string): void {
    if (!this.shouldLog()) return;
    this.performanceMarks.set(marker, performance.now());
    performance.mark(marker);
  }

  endPerformanceMark(marker: string, operationName: string): number | null {
    if (!this.shouldLog()) return null;

    const startTime = this.performanceMarks.get(marker);
    if (!startTime) {
      console.warn(`Performance mark ${marker} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    performance.mark(`${marker}-end`);
    performance.measure(operationName, marker, `${marker}-end`);

    this.performanceMarks.delete(marker);

    // Warn if operation takes too long
    if (duration > 100) {
      this.log(
        "warning",
        "performance",
        `⚠️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`,
        { operationName, duration },
        DEBUG_COLORS.warning
      );
    }

    if (duration > 5000) {
      this.log(
        "error",
        "performance",
        `🚨 Very slow operation: ${operationName} took ${duration.toFixed(2)}ms`,
        { operationName, duration },
        DEBUG_COLORS.error
      );
    }

    this.log(
      "performance",
      "performance",
      `⏱️ ${operationName}: ${duration.toFixed(2)}ms`,
      { operationName, duration },
      DEBUG_COLORS.performance
    );

    return duration;
  }

  logLongOperation(operationName: string, duration: number) {
    if (duration > 1000) {
      this.log(
        "warning",
        "performance",
        `⚠️ Long operation: ${operationName} took ${duration}ms`,
        { operationName, duration },
        DEBUG_COLORS.warning
      );
    }
  }

  logAsyncOperation(component: string, operationName: string, status: "start" | "end" | "error", data?: any) {
    const emoji = status === "start" ? "▶️" : status === "end" ? "✅" : "❌";
    this.log(
      "async",
      component,
      `${emoji} Async: ${operationName} ${status}`,
      { operationName, status, ...data },
      status === "error" ? DEBUG_COLORS.error : DEBUG_COLORS.performance
    );
  }

  logMemoryWarning(component: string, message: string, data?: any) {
    this.log("warning", component, `⚠️ Memory: ${message}`, data, DEBUG_COLORS.warning);
  }

  getStats() {
    return {
      totalLogs: this.logs.length,
      renderCounts: Object.fromEntries(this.renderCounts),
      stateChanges: Object.fromEntries(
        Array.from(this.stateChanges.entries()).map(([key, changes]) => [key, changes.length])
      ),
    };
  }

  clear() {
    this.logs = [];
    this.renderCounts.clear();
    this.lastRenderTime.clear();
    this.stateChanges.clear();
    this.performanceMarks.clear();
  }
}

export const debugLogger = new DebugLogger();

// Helper hooks for React components
export function useDebugRender(componentName: string, props?: any, state?: any) {
  React.useEffect(() => {
    debugLogger.logRender(componentName, props, state);
  });
}

// Export for manual use
export const debug = {
  logRender: (component: string, props?: any, state?: any) =>
    debugLogger.logRender(component, props, state),
  logStateChange: (component: string, stateName: string, oldValue: any, newValue: any) =>
    debugLogger.logStateChange(component, stateName, oldValue, newValue),
  logEffect: (component: string, effectName: string, dependencies: any[], hasChanged: boolean) =>
    debugLogger.logEffect(component, effectName, dependencies, hasChanged),
  logCallback: (component: string, callbackName: string, dependencies: any[], isNew: boolean) =>
    debugLogger.logCallback(component, callbackName, dependencies, isNew),
  startPerformanceMark: (marker: string) => debugLogger.startPerformanceMark(marker),
  endPerformanceMark: (marker: string, operationName: string) =>
    debugLogger.endPerformanceMark(marker, operationName),
  logLongOperation: (operationName: string, duration: number) =>
    debugLogger.logLongOperation(operationName, duration),
  logAsyncOperation: (component: string, operationName: string, status: "start" | "end" | "error", data?: any) =>
    debugLogger.logAsyncOperation(component, operationName, status, data),
  logMemoryWarning: (component: string, message: string, data?: any) =>
    debugLogger.logMemoryWarning(component, message, data),
  getStats: () => debugLogger.getStats(),
  clear: () => debugLogger.clear(),
  printSummary: () => {
    const stats = debugLogger.getStats();
    console.group("%c📊 Debug Summary", "font-size: 16px; font-weight: bold; color: #2196F3;");
    console.log("Total logs:", stats.totalLogs);
    console.log("Render counts:", stats.renderCounts);
    console.log("State changes:", stats.stateChanges);
    console.groupEnd();
  },
};

// Make debug utilities available globally in development
if (typeof window !== "undefined" && DEBUG_ENABLED) {
  (window as any).__debug = debug;
  console.log(
    "%c🐛 Debug mode enabled! Use window.__debug to access debug utilities.",
    "color: #4CAF50; font-weight: bold;"
  );
  console.log("Try: window.__debug.printSummary()");
  console.log("Try: window.__debug.getStats()");
  console.log("Toggle: localStorage.setItem('debugAppBehavior', 'true')");
}
