# Smart Error Aggregator

[![npm](https://img.shields.io/npm/v/smart-error-aggregator)](https://www.npmjs.com/package/smart-error-aggregator)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A lightweight JavaScript/TypeScript package to **aggregate, analyze, and report errors** with actionable suggestions. Simplify debugging by centralizing error tracking, grouping duplicates, and providing fix recommendations for Node.js and browser applications.

## Why Use Smart Error Aggregator?

Errors can be hard to track in complex applications. This package helps by:

- **Collecting all errors** in one place, including unhandled exceptions.
- **Grouping similar errors** to reduce noise and show frequency.
- **Suggesting fixes** for common JavaScript errors (e.g., `TypeError`, `ReferenceError`).
- **Generating detailed reports** for debugging and prioritization.
- **Working seamlessly** in both Node.js and browser environments.

Whether you're building a small script or a large app, Smart Error Aggregator makes error management easier without heavy dependencies.

## Features

- Captures all standard JavaScript errors (`TypeError`, `ReferenceError`, `SyntaxError`, etc.).
- Groups duplicate errors and tracks occurrence counts.
- Provides actionable suggestions for common errors.
- Supports Node.js and browser environments with automatic error handling.
- Extensible with custom suggestion rules for app-specific errors.
- Lightweight with zero runtime dependencies.
- TypeScript support with full type definitions.

## Installation

Install via npm:

```bash
npm install smart-error-aggregator
```

## Usage

### Basic Example

```javascript
import { errorAggregator } from "smart-error-aggregator";

// Initialize for Node.js or browser
errorAggregator.initialize({ environment: "node" });

// Log an error
errorAggregator.logError(new TypeError("Cannot read undefined"), "app.js");

// Get the error report
console.log(errorAggregator.getReport());
```

Output:

```json
[
  {
    "type": "TypeError",
    "message": "Cannot read undefined",
    "stack": "...",
    "file": "app.js",
    "timestamp": 1730412345678,
    "count": 1,
    "suggestion": "Check for undefined or null values before accessing properties."
  }
]
```

### Browser Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Error Aggregator Test</title>
  </head>
  <body>
    <button onclick="triggerError()">Trigger Error</button>
    <button onclick="showReport()">Show Report</button>
    <pre id="report"></pre>
    <script type="module">
      import { errorAggregator } from "smart-error-aggregator";

      errorAggregator.initialize({ environment: "browser" });

      window.triggerError = () => {
        try {
          const obj = undefined;
          obj.x; // TypeError
        } catch (error) {
          errorAggregator.logError(error, "index.html");
        }
      };

      window.showReport = () => {
        document.getElementById("report").textContent = JSON.stringify(
          errorAggregator.getReport(),
          null,
          2
        );
      };
    </script>
  </body>
</html>
```

### Adding Custom Suggestions

Extend the aggregator with custom rules:

```javascript
errorAggregator.addSuggestionRule({
  condition: (error) => error.message.includes("API"),
  suggestion: "Check API connectivity or server status.",
});

errorAggregator.logError(new Error("API request failed"), "api.js");
```

### API

#### `errorAggregator.initialize({ environment: 'node' | 'browser' })`

Sets up global error handlers for unhandled errors (e.g., window.onerror for browsers, process.on('uncaughtException') for Node.js).

- `environment`: Specify `node` for Node.js or `browser` for web apps.
- Example: `errorAggregator.initialize({ environment: 'node' })`

#### `errorAggregator.logError(error, source?)`

Manually log an error.

- `error`: The error object or value (e.g., `new TypeError('...')`).
- `source`: Optional file or context (e.g., '`app.js`').
- Example: `errorAggregator.logError(new Error('Oops'), 'main.js')`

#### `errorAggregator.getReport()`

Returns an array of `ErrorRecord` objects, sorted by frequency.

- Returns: `ErrorRecord[]` with `type`, `message`, `stack`, `file`, `timestamp`, `count`, `suggestion`.
- Example: `errorAggregator.getReport()`

#### `errorAggregator.addSuggestionRule(rule)`

Adds a custom suggestion rule.

- `rule`: `{ condition: (error: Error) => boolean, suggestion: string }`
- Example: `{ condition: (e) => e.message.includes('timeout'), suggestion: 'Increase timeout.' }`

#### `errorAggregator.clear()`

Clears all stored errors.

- Example: `errorAggregator.clear()`

#### `errorAggregator.getErrorCount()`

Returns the number of unique errors.

- Example: `errorAggregator.getErrorCount() // Output: 3`

### TypeScript Support

The package includes full TypeScript definitions (dist/index.d.ts). Import types for type-safe usage:

```typescript
import {
  errorAggregator,
  ErrorRecord,
  SuggestionRule,
} from "smart-error-aggregator";

const report: ErrorRecord[] = errorAggregator.getReport();
```

### Supported Errors

Handles all standard JavaScript errors with tailored suggestions:

- `TypeError` (e.g., "Check for undefined or null values.")
- `ReferenceError` (e.g., "Ensure the variable is defined.")
- `SyntaxError`, `RangeError`, `URIError`, `EvalError`, and generic `Error`.

Non-error values (e.g., strings thrown via `throw 'oops'`) are converted to `Error` objects.

### Use Cases

- Debugging: Centralize errors in complex apps to identify patterns.
- Team Collaboration: Provide suggestions for junior developers.
- Production Monitoring: Track errors without external services.
- Prototyping: Quick error tracking for MVPs or small projects.

### Limitations

- Errors are stored in memory (lost on app restart). For persistence, save reports to a file or database.
- Suggestions are generic for standard errors. Add custom rules for app-specific cases.
- For advanced monitoring (e.g., user tracking), consider combining with tools like Sentry.

### Contributing

Found a bug or have a feature request? Open an issue or submit a pull request at GitHub. All contributions are welcome!

### License

MIT (LICENSE) © Rohit Mishra
