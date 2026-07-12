# EcoLint 🍃

**AI-Powered FinOps Optimizer, Security Scanner, & VS Code Extension**

EcoLint is a comprehensive suite of tools designed to drastically reduce the computational footprint of your code. By acting as an advanced FinOps engine, it intelligently analyzes your source code to optimize performance (speed, RAM, CPU cycles), calculate carbon and cost savings, and apply automated cybersecurity patches.

The EcoLint project is divided into two primary interfaces:
1. **The VS Code Extension** (`/ecolint` & `/backend`)
2. **The Terminal CLI Tool** (`/ecolint-cli`)

---

## 💻 1. EcoLint for VS Code

The EcoLint VS Code extension brings our AI-powered code analysis, benchmarking, and optimization directly into your IDE. It communicates with a dedicated backend language server to provide real-time suggestions and automated refactoring.

### ✨ Extension Features
- **Analyze (`ecolint.analyze`)**: Analyzes the current code for performance bottlenecks and structural issues.
- **Benchmark (`ecolint.benchmark`)**: Runs simulated performance benchmarks on the active file.
- **Optimize (`ecolint.optimize`)**: Automatically optimizes the selected code inline.
- **Generate Pull Request (`ecolint.generatePullRequest`)**: Generates a summary PR containing the analysis results and optimization justifications.
- **Interactive UI**: Integrates directly into the VS Code Activity Bar with dedicated views for *Analysis Results*, *Benchmarks*, and *Optimizations*.

### 🛠️ Extension Setup
The VS Code extension requires the backend server to be running:
1. **Start the Backend:**
   ```bash
   cd EcoLint/backend
   npm install
   npm run start # (or equivalent dev script)
   ```
2. **Install the Extension:**
   ```bash
   cd EcoLint/ecolint
   npm install
   # Press F5 in VS Code to launch the Extension Development Host
   ```
*(Note: Ensure `ecolint.apiEndpoint` in your VS Code settings points to your running backend).*

---

## 🚀 2. EcoLint CLI

The EcoLint CLI is a lightweight, terminal-based alternative for fast, pipeline-friendly optimizations.

### ✨ CLI Features
- **🧠 Multi-Mode AI Optimization:**
  - **Maximum Performance**: Strips formatting and readability to compress variables and maximize raw computational speed. *(C/C++ Aware: Replaces heavy includes with lightweight forward declarations).*
  - **Balanced Production**: Achieves high performance while adhering strictly to clean architectural principles.
  - **Educational Mode**: Provides a JSON-formatted technical breakdown explaining the complexity shifts (e.g., $O(N^2) \rightarrow O(N)$).
- **🔒 Intelligent Security Scanner (SOLID Design):** Scans entire files for severe vulnerabilities (SQL Injections, XSS) and offers 1-click automated security patches.
- **📊 Eco Metrics Telemetry:** Simulates the real-world impact of your code optimizations (Latency, RAM, Carbon Reduction, Cost Savings).
- **💬 Dynamic Custom Directives:** Override the engine with natural language rules (e.g., *"Do not remove comments"*).

### 🛠️ CLI Setup & Usage
1. **Installation:**
   ```bash
   cd EcoLint/ecolint-cli
   npm install
   ```
2. **Configuration:** Add your AI provider API Key to `ecolint-cli/.env`:
   ```env
   NVIDIA_API_KEY=your_api_key_here
   ```
3. **Usage:**
   ```bash
   npm run build
   
   # Optimize and secure a specific file
   npm start -- --file ../test.c
   
   # Optimize a specific line range
   npm start -- --file ../test.c --lines 10-25
   ```

---

## 📚 Documentation
For more in-depth architectural details, API documentation, and contribution guidelines, please refer to the `/docs` directory.

## 🧪 Testing the Pipeline
You can test the core AI engine using the provided test files at the root of the repository:
- **`vulnerable_test.py`**: Contains `O(N^2)` loops and glaring security flaws (Hardcoded Secrets & SQL Injection). Tests both the FinOps optimizer and the Security Scanner.
- **`test.c`**: Contains standard C code. Tests the C/C++ specific include optimizations.
