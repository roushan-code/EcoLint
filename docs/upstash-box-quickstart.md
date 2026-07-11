# Upstash Box Quickstart Documentation

**Upstash Box lets you give your AI agents a computer.**

Every Upstash Box is a **secure, isolated cloud container with an AI Agent built-in**. Spin up as many as you want in parallel. Each one includes a full environment with a filesystem, shell, git, and a runtime. Your agent can read files, write code, and execute tasks inside it.

> Upstash Box is in developer preview — APIs and pricing may change.

---

## 1. Get your API key

Go to the [Upstash Console](https://console.upstash.com/) and create an API key.

## 2. Install the SDK

```bash
npm install @upstash/box
# or
yarn add @upstash/box
# or
pnpm add @upstash/box
# or
bun install @upstash/box
# or
pip install upstash-box
```

## 3. Set API Key

```env
UPSTASH_BOX_API_KEY=box_xxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Create a Box

```typescript
import { Box } from "@upstash/box"

const box = await Box.create({
  runtime: "node",
})
```

```python
from upstash_box import Box

box = Box.create(runtime="node")
```

By default, runtimes use **Debian** (glibc). For smaller Alpine-based images, use `"node-alpine"`, `"python-alpine"`, etc.

You can also create a keep-alive box by setting `keepAlive: true`. Keep-alive boxes stay on between sessions and can run an `initCommand` at startup.

## 5. Configure an Agent (optional)

To configure an agent for your box, pass the model you want to use and the provider API key:

### Using Claude

```typescript
import { Agent, Box } from "@upstash/box"

const box = await Box.create({
  runtime: "node",
  agent: {
    harness: Agent.ClaudeCode,
    model: "anthropic/claude-opus-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
})
```

### Using Codex

```typescript
import { Agent, Box } from "@upstash/box"

const box = await Box.create({
  runtime: "node",
  agent: {
    harness: Agent.Codex,
    model: "openai/gpt-5.3-codex",
    apiKey: process.env.OPENAI_API_KEY,
  },
})
```

## 6. Run Your First Task

```typescript
import { Agent, Box } from "@upstash/box"

const box = await Box.create({
  runtime: "node",
  agent: {
    harness: Agent.ClaudeCode,
    model: "anthropic/claude-opus-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
})

// 👇 execute OS-level commands
await box.exec.command("node --version")

// 👇 run agent
await box.agent.run({
  prompt: "create an index.txt saying 'hello world'",
})
```

## 7. Connect over SSH

You can also connect directly to a box shell with SSH:

```bash
ssh <box-id>@us-east-1.box.upstash.com
```

When SSH asks for a password, enter your **Box API key**.

---

## Use Cases

The idea behind Upstash Box is simple: **give AI its own computer**. Your agent gets a full, isolated cloud environment it can control. Run commands, write files, or execute code independent of any user device. Freeze a box anytime, and continue days or even weeks later with perfect resumability.

### Great example use cases:

- **Agent Servers** - One box per user with durable state. Personalized agents that remember context and improve over time.
- **Multi-Agent Orchestration** - Fan out to multiple boxes running specialized agents in parallel, then combine their results.
- **Parallel Testing** - Run the same inputs across isolated boxes and compare model output side by side.

---

## Next Steps

- [How Boxes work](https://upstash.com/docs/box/overall/how-it-works) - Learn the basics about using Upstash Box.
- [Agent](https://upstash.com/docs/box/overall/agent) - Boxes have Claude Code, Codex or OpenCode built-in.