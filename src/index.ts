/**
 * Represents a single structured error record.
 */
interface ErrorRecord {
  type: string; // Error type (e.g., TypeError, ReferenceError)
  message: string; // Error message
  stack: string; // Stack trace
  file?: string; // Source file or URL
  timestamp: number; // Time of latest occurrence
  count: number; // Number of times this error has occurred
  suggestion?: string; // Suggested fix (if available)
}

/**
 * Defines a rule for matching errors and providing suggestions.
 */
interface SuggestionRule {
  condition: (error: Error) => boolean; // Condition to match error
  suggestion: string; // Human-readable suggestion
}

/**
 * SmartErrorAggregator captures and stores runtime errors,
 * detects common patterns, and provides suggestions for resolving them.
 */
class SmartErrorAggregator {
  private errors: Map<string, ErrorRecord> = new Map(); // Stores unique errors
  private suggestionRules: SuggestionRule[] = []; // Rules to provide suggestions
  private isInitialized = false; // Prevent multiple initializations

  /**
   * Sets up error listeners based on the environment.
   * @param options - Specify the runtime environment: 'node' or 'browser'
   */
  initialize(
    options: { environment: "node" | "browser" } = { environment: "node" }
  ) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.setupDefaultSuggestions();

    // Attach global error handlers in browser
    if (options.environment === "browser" && typeof window !== "undefined") {
      window.onerror = (message, source, _lineno, _colno, error) => {
        this.handleError(error || new Error(message.toString()), source);
        return false;
      };

      window.addEventListener("unhandledrejection", (event) => {
        this.handleError(event.reason);
      });
    }
    // Attach error handlers in Node.js
    else if (options.environment === "node" && typeof process !== "undefined") {
      process.on("uncaughtException", (error) => {
        this.handleError(error);
      });

      process.on("unhandledRejection", (reason) => {
        this.handleError(reason);
      });
    }
  }

  /**
   * Registers default suggestions for common JavaScript error patterns.
   */
  private setupDefaultSuggestions() {
    // Example: Accessing a property on undefined
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" && error.message.includes("undefined"),
      suggestion:
        "Check for undefined or null values before accessing properties or methods.",
    });

    // Calling something that isn't a function
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" && error.message.includes("not a function"),
      suggestion: "Ensure the variable is a function before calling it.",
    });

    // Modifying a constant variable
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" &&
        error.message.includes("Assignment to constant variable"),
      suggestion: "Check for attempts to modify a constant variable.",
    });

    // More specific and useful checks
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" && error.message.includes("is not iterable"),
      suggestion:
        "Use iterable objects (like arrays, strings) with for...of or spread syntax.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" &&
        error.message.includes("is not a constructor"),
      suggestion:
        "Ensure you're not trying to instantiate a non-constructor value.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" &&
        error.message.includes("cannot read property") &&
        error.message.includes("of null"),
      suggestion: "Ensure the object you're accessing is not null.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" &&
        error.message.includes("reduce") &&
        error.message.includes("not a function"),
      suggestion: "Use reduce only on arrays, not non-array values.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" &&
        error.message.includes("map") &&
        error.message.includes("not a function"),
      suggestion: "Confirm the variable is an array before using map().",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "TypeError" && error.message.includes("toFixed"),
      suggestion: "Use toFixed() only on numbers.",
    });

    // Reference errors
    this.addSuggestionRule({
      condition: (error) => error.name === "ReferenceError",
      suggestion: "Ensure the variable or function is defined and in scope.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "ReferenceError" &&
        error.message.includes("is not defined"),
      suggestion: "Check for typos and that the variable is declared.",
    });

    // Syntax errors
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "SyntaxError" &&
        error.message.includes("Unexpected token"),
      suggestion: "Check for misplaced commas or brackets.",
    });

    this.addSuggestionRule({
      condition: (error) =>
        error.name === "SyntaxError" &&
        error.message.includes("Unexpected end of input"),
      suggestion: "Ensure all blocks and strings are properly closed.",
    });

    this.addSuggestionRule({
      condition: (error) => error.name === "SyntaxError",
      suggestion: "Check for invalid JavaScript syntax.",
    });

    // Range errors
    this.addSuggestionRule({
      condition: (error) =>
        error.name === "RangeError" &&
        error.message.includes("maximum call stack size exceeded"),
      suggestion: "Avoid infinite recursion or circular references.",
    });

    this.addSuggestionRule({
      condition: (error) => error.name === "RangeError",
      suggestion:
        "Ensure values are within valid ranges (e.g., array indices, numbers).",
    });

    // URI and eval errors
    this.addSuggestionRule({
      condition: (error) => error.name === "URIError",
      suggestion: "Ensure URLs and encoded strings are correctly formatted.",
    });

    this.addSuggestionRule({
      condition: (error) => error.name === "EvalError",
      suggestion: "Avoid using eval(); check your dynamic code execution.",
    });

    // Fallback rule
    this.addSuggestionRule({
      condition: (error) => error.name === "Error" || !error.name,
      suggestion: "Review the error message and stack trace for more context.",
    });
  }

  /**
   * Internal method to handle any error object.
   * @param error - The thrown or rejected error.
   * @param source - Optional source file or origin of error.
   */
  private handleError(error: unknown, source?: string) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const key = `${errorObj.name || "Error"}:${errorObj.message}:${
      source || ""
    }`;

    const existing = this.errors.get(key);
    if (existing) {
      existing.count += 1;
      existing.timestamp = Date.now();
    } else {
      this.errors.set(key, {
        type: errorObj.name || "Error",
        message: errorObj.message || "Unknown error",
        stack: errorObj.stack || "",
        file: source,
        timestamp: Date.now(),
        count: 1,
        suggestion: this.getSuggestion(errorObj),
      });
    }
  }

  /**
   * Find a suggestion for the given error using registered rules.
   * @param error - Error object to evaluate.
   */
  private getSuggestion(error: Error): string | undefined {
    for (const rule of this.suggestionRules) {
      if (rule.condition(error)) {
        return rule.suggestion;
      }
    }
    return undefined; // No matching rule found
  }

  /**
   * Register a custom suggestion rule.
   * @param rule - The rule to be added.
   */
  addSuggestionRule(rule: SuggestionRule) {
    this.suggestionRules.push(rule);
  }

  /**
   * Manually logs an error to the aggregator.
   * @param error - Error or value to log.
   * @param source - Optional source of the error.
   */
  logError(error: unknown, source?: string) {
    this.handleError(error, source);
  }

  /**
   * Retrieves a list of all logged error records, sorted by frequency.
   */
  getReport(): ErrorRecord[] {
    return Array.from(this.errors.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Clears all tracked error records.
   */
  clear() {
    this.errors.clear();
  }

  /**
   * Returns the number of unique error types tracked.
   */
  getErrorCount(): number {
    return this.errors.size;
  }
}

// Export a singleton instance
export const errorAggregator = new SmartErrorAggregator();

// Export types for TypeScript consumers
export type { ErrorRecord, SuggestionRule };
