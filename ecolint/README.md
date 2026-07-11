# EcoLint - AI-Powered Code Analysis & Optimization

EcoLint is an AI-powered VS Code extension that analyzes your code for performance issues, benchmarks execution, and suggests optimizations.

## Features

- **Code Analysis**: Detects performance anti-patterns like nested loops, expensive array operations, and more
- **Benchmarking**: Measures code execution time and memory usage
- **AI Optimization**: Uses AI to suggest code improvements
- **Carbon Estimation**: Estimates carbon footprint of code execution
- **Pull Request Generation**: Generates PR descriptions for optimized code

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18+ for local execution
- E2B API key (optional) for cloud sandbox execution

## Extension Settings

This extension contributes the following settings:

* `ecolint.apiEndpoint`: Backend API endpoint (default: `http://localhost:3000`)
* `ecolint.enableNotifications`: Enable/disable notifications (default: `true`)
* `ecolint.autoAnalyze`: Automatically analyze code on save (default: `false`)
* `ecolint.analysisTimeout`: Analysis timeout in milliseconds (default: `30000`)

## Commands

- `EcoLint: Analyze Code` - Analyze the current file for performance issues
- `EcoLint: Run Benchmark` - Benchmark the current code
- `EcoLint: Optimize Code` - Get AI-powered optimization suggestions
- `EcoLint: Generate PR` - Generate a pull request description
- `EcoLint: Validate` - Validate code with AI agent

## Getting Started

1. Install the extension
2. Start the backend server: `cd backend && yarn dev`
3. Open a code file in VS Code
4. Run any EcoLint command from the command palette

## License

MIT