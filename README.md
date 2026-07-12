# EcoLint 🍃

**Terminal-Based Performance, Security, & AI FinOps Optimizer**

EcoLint is a next-generation AI-powered CLI tool designed to drastically reduce the computational footprint of your code. By acting as an advanced FinOps engine, it intelligently analyzes your source code to optimize performance (speed, RAM, CPU cycles), calculate carbon and cost savings, and apply automated cybersecurity patches.

---

## 🚀 Features

- **🧠 Multi-Mode AI Optimization:**
  - **Maximum Performance**: Strips formatting and readability to compress variables, implement bitwise operations, and maximize raw computational speed. *(C/C++ Aware: Aggressively replaces heavy includes like `<stdio.h>` with lightweight forward declarations).*
  - **Balanced Production**: Achieves high-performance metrics while adhering strictly to clean architectural principles and human maintainability.
  - **Educational Mode**: Provides optimized code alongside a deep, JSON-formatted technical breakdown explaining the complexity shifts (e.g., $O(N^2) \rightarrow O(N)$).

- **🔒 Intelligent Security Scanner (SOLID Design):**
  - Operates on a dedicated, decoupled `securityController`.
  - Scans entire files for severe vulnerabilities (SQL Injections, XSS, Hardcoded Credentials).
  - Pauses execution to explain the vulnerabilities to the user and offers 1-click automated security patches.

- **📊 Eco Metrics & FinOps Telemetry:**
  - Simulates the real-world impact of your code optimizations.
  - Outputs visual metrics calculating **Runtime Latency Differential**, **Hardware Overhead (RAM)**, **Token Savings**, **Carbon Footprint Reduction (g CO2e)**, and **Cloud FinOps Cost Savings**.

- **💬 Dynamic Custom Directives:**
  - Allows you to override the engine with natural language rules (e.g., *"Do not remove comments"* or *"Use a HashMap instead of an Array"*).

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/roushan-code/EcoLint.git
   cd EcoLint/ecolint-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `ecolint-cli` directory and add your AI provider API Key:
   ```env
   NVIDIA_API_KEY=your_api_key_here
   ```

4. **Build the CLI:**
   ```bash
   npm run build
   ```

---

## 💻 Usage

EcoLint can be run interactively or targeted at specific files.

### 1. File Optimization (Recommended)
Pass a specific file to the CLI to optimize, scan for security, and overwrite:
```bash
npm start -- --file ../test.c
```
*(EcoLint will prompt you before applying any optimizations or security fixes to the original file).*

### 2. Line-Specific Optimization
Only want to optimize a specific poorly-written function? Use the `--lines` flag:
```bash
npm start -- --file ../test.c --lines 10-25
```

### 3. Interactive Snippet Mode
If you run the CLI without arguments, it will open an interactive prompt allowing you to paste raw code directly into your terminal for quick optimization:
```bash
npm start
```

---

## 🧪 Testing

The repository contains two dedicated test files to demonstrate the engine's capabilities:

- **`vulnerable_test.py`**: Contains highly unoptimized `O(N^2)` loops and glaring security flaws (Hardcoded Secrets & SQL Injection). Run this file to see both the FinOps optimization and the Security Scanner in action.
- **`test.c`**: Contains standard C code. Run this in *Maximum Performance* mode to watch the engine aggressively optimize standard library includes.

---

## 🏗️ Architecture

EcoLint is built with **Node.js, TypeScript, and `@clack/prompts`**. It follows **SOLID** architectural principles, heavily decoupling the file parsing (`fileController`), AI optimization (`aiController`), FinOps mathematics (`metrics`), and vulnerability patching (`securityController`) into distinct, maintainable modules.
