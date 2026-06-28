<div align="center">
    <img src="https://raw.githubusercontent.com/y-moriya/antigravity-usage/main/images/icon.png" alt="agy-usage logo" width="150" height="150">
    <h1>agy-usage</h1>
</div>

<p align="center">
    <a href="https://npmjs.com/package/agy-usage"><img src="https://img.shields.io/npm/v/agy-usage?color=yellow" alt="npm version" /></a>
    <a href="https://packagephobia.com/result?p=agy-usage"><img src="https://packagephobia.com/badge?p=agy-usage" alt="install size" /></a>
    <a href="https://www.npmjs.com/package/agy-usage"><img src="https://img.shields.io/npm/dt/agy-usage" alt="NPM Downloads" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js Version" /></a>
</p>

<p align="center">
A fast, lightweight, and powerful CLI tool to track your Antigravity model quota and usage. Works offline with your IDE or online with multiple Google accounts.
</p>

<p align="center">
<em>Forked from <a href="https://github.com/skainguyen1412/antigravity-usage">antigravity-usage</a>, inspired by <a href="https://github.com/ryoppippi/ccusage">ccusage</a></em>
</p>

<div align="center">
    <img src="https://raw.githubusercontent.com/y-moriya/antigravity-usage/main/images/banner.png" alt="Antigravity Usage Screenshot">
</div>


## Quick Start (No Login Required) 🚀

If you have Antigravity running in your IDE (VSCode, JetBrains, etc.), you can check your quota immediately **without logging in**.

```bash
# Install globally
npm install -g agy-usage

# Check quota immediately (uses your IDE's connection)
agy-usage
```

> 💡 **Note:** The `antigravity-usage` command is also available as a built-in alias for convenience!

---

## Power User Guide ⚡️

Want to check quota for **multiple accounts** or when your IDE is closed?

### 1. Login with Google
```bash
agy-usage login
```

### 1a. Manual Login (Headless/SSH)
If you are on a headless server or cannot open a browser locally:
```bash
agy-usage login --manual
```
Follow the on-screen instructions to paste the authentication URL into your local browser and copy the result back.

### 2. Add more accounts
```bash
agy-usage accounts add
```

### 3. Check everything at once
```bash
agy-usage quota --all
```

---

## How It Works 🛠️

`agy-usage` employs a smart "Dual-Fetch" strategy to ensure you always get data:

1.  **Local Mode (Priority)**: First, it tries to connect to the Antigravity Language Server running inside your IDE.
    *   **Pros**: Fast, works offline, no extra login required.
    *   **Cons**: IDE must be open.
2.  **Cloud Mode (Fallback)**: If Local Mode fails (or if managing multiple accounts), it uses the Google Cloud Code API.
    *   **Pros**: Works anywhere, supports multiple accounts, resolves real weekly and 5-hour limits (including consumed/exhausted states) by querying under consumer quota project ID (`default-cli-project`).
    *   **Cons**: Requires one-time login.

By default, the command runs in **Auto Mode**, seamlessly switching between these methods.

---

## Features

### 🌈 Rich Color Progress Bars & Emojis
Visual feedback has been enhanced to instantly reflect your remaining quota level at a glance:
- **75% or more**: 🟢 Green progress bar and text.
- **50% to 75%**: 🟡 Yellow progress bar and text.
- **25% to 50%**: 🟠 Orange progress bar and text.
- **Under 25% / Exhausted**: 🔴 Red progress bar and text with ❌ indicators.

### 🤖 Auto Wakeup (macOS & Linux)
Never waste quota again. Automatically wake up your AI models to maximize your daily limits.
- **Fully Automatic**: Runs in the background via native system scheduler - no need to keep terminal or Antigravity open
- **Native Cron Integration**: Schedule-based triggers (every N hours, daily, or custom cron)
- **Smart Quota-Reset Detection**: Zero-waste mode that detects when quota resets
- **Multi-Account Support**: Trigger all your accounts simultaneously
- **Built-in Safety**: Cooldown protection, retry logic, detailed history tracking
- **Platform Support**: Currently available on **macOS and Linux** (Windows support coming soon)

See the [Wakeup Command](#agy-usage-wakeup-) section for full details.

### 🔐 Multi-Account Management
Manage multiple Google accounts and compare quota across Personal, Work, and other accounts.
- **Check All Accounts**: Use `--all` flag to fetch and compare quota across all logged-in accounts simultaneously
- **Side-by-Side Comparison**: View quota usage and reset times for all accounts in a single table
- **Easy Switching**: Switch between accounts to use different credentials for API calls
- **Privacy Focused**: All tokens stored locally on your machine, never sent to third-party servers

### 🔌 Offline Capabilities
Designed for plane rides and spotty wifi.
- **Direct IDE Access**: Reads directly from the local server loopback.
- **Smart Fallbacks**: If the internet cuts out, it defaults to the last known state from your local IDE.

### ⚡️ Smart Caching
To keep the CLI snappy and avoid hitting API rate limits:
- Quota data is cached for **5 minutes**.
- Use the `--refresh` flag to force a new fetch:
    ```bash
    agy-usage quota --refresh
    ```

### 🎯 Focused Model View
By default, `agy-usage` hides "autocomplete" models (like `gemini-2.5-flash-002`) to reduce clutter, as these typically share quota with their main counterparts or are less relevant for tracking.

To see **ALL** available models, including autocomplete ones:
```bash
agy-usage quota --all-models
```

---

## Command Reference

### `agy-usage` (Default)
Alias for `quota`. Fetches and displays usage data.

```bash
agy-usage                   # Auto-detect (Local -> Cloud)
agy-usage --all             # Fetch ALL accounts
agy-usage --method local    # Force local IDE connection
agy-usage --method google   # Force google IDE connection
agy-usage --all-models      # Show ALL models (including autocomplete)
agy-usage --json            # Output JSON for scripts
agy-usage --version         # Show version number
```

### `agy-usage --version`
Display the current version of the CLI tool.

```bash
agy-usage --version  # or -V
```

### `agy-usage accounts`
Manage your roster of Google accounts.

```bash
agy-usage accounts list            # Show all accounts & status
agy-usage accounts add             # Login a new account
agy-usage accounts switch <email>  # Set active account
agy-usage accounts remove <email>  # Logout & delete data
```

### `agy-usage doctor`
Troubleshoot issues with your setup. Checks env vars, auth status, and local server connectivity.

### `agy-usage status`
Quickly check if your auth tokens are valid or expired.

### `agy-usage wakeup` 🚀
**Never waste quota again.** Automatically wake up your AI models at strategic times to maximize your daily limits.

> **Platform Support:** Currently available on **macOS** and **Linux**. Windows support (via Task Scheduler) is coming soon.

```bash
agy-usage wakeup config     # Interactive setup (takes 30 seconds)
agy-usage wakeup install    # Install to native system cron
agy-usage wakeup status     # Check configuration & next run
agy-usage wakeup test       # Test trigger manually (interactive)
agy-usage wakeup history    # View trigger history
```

**Quick Test with Flags:**
```bash
# Test with specific email and model
agy-usage wakeup test -e your@gmail.com -m claude-sonnet-4-5

# Full command with custom prompt
agy-usage wakeup test --email your@gmail.com --model gemini-3-flash --prompt "hello"

# Mix flags (missing ones will be prompted)
agy-usage wakeup test -e your@gmail.com
```

**Available Options:**
- `-e, --email <email>` - Account email to use for testing
- `-m, --model <model>` - Model ID to test (e.g., claude-sonnet-4-5, gemini-3-flash)
- `-p, --prompt <prompt>` - Test prompt to send (default: "hi")

**Why This Matters:**
Your Antigravity quota resets every ~5 hours, but if you don't use it, you lose it. The wakeup feature ensures you **automatically trigger** both Claude and Gemini models to keep your quota flowing.

#### 🎯 Intelligent Model Selection
Zero configuration needed. Automatically wakes up:
- **`claude-sonnet-4-5`** → Triggers the entire Claude family
- **`gemini-3-flash`** → Triggers Gemini flash quota group
- **`gemini-3-pro-low`** → Triggers Gemini pro quota group

All three models combined ensure comprehensive coverage and optimal quota utilization across all available AI models and quota groups.

#### ⚡️ Two Powerful Trigger Modes

**1. Schedule-Based** (Native Cron Integration)
Runs locally on your machine with zero dependencies:
- **Interval Mode**: Every N hours (e.g., every 6 hours)
- **Daily Mode**: At specific times (e.g., 9 AM, 5 PM)
- **Custom Mode**: Advanced cron expressions for power users
- **Portable Design**: Auto-detects Node.js path for seamless operation across different machines

```bash
agy-usage wakeup install
# ✅ Installs to your system's native crontab (macOS/Linux)
# ✅ Runs even when terminal/antigravity is closed
# ✅ Persists across reboots
# ✅ Works on any machine with Node.js installed
```

**2. Smart Quota-Reset Detection** (Zero-Waste Mode)
The most intelligent trigger mode. Automatically detects when:
- Quota is at **100%** (unused)
- Reset time is **~5 hours away** (just reset)
- No cooldown conflicts

When triggered, it wakes up **ALL** your accounts simultaneously, ensuring none of your quota goes to waste.

#### 🛡️ Built-in Safety Features
- **Cooldown Protection**: Prevents duplicate triggers (1-hour default)
- **Multi-Account Support**: Trigger for specific accounts or all at once
- **Detailed History**: Track every trigger with timestamps and results
- **Graceful Failures**: Automatic retry logic with exponential backoff
- **Token Efficiency**: Minimal output tokens (just 1 token per request)

#### 📊 Real-Time Monitoring
```bash
agy-usage wakeup status
```
Shows:
- ✅ Enabled/disabled status
- 📅 Next scheduled run time
- 🎯 Selected models and accounts
- 📝 Last trigger result
- ⚙️ Cron installation status

## Configuration & Migration
Data is stored in your system's standard config location:
- **macOS**: `~/Library/Application Support/agy-usage/`
- **Linux**: `~/.config/agy-usage/`
- **Windows**: `%APPDATA%/agy-usage/`

> 🔄 **Seamless Migration:** If you previously used `antigravity-usage`, the CLI automatically detects and uses your existing configuration directory under `antigravity-usage`, so you won't lose your logged-in accounts or settings!

## Development
```bash
npm run dev -- quota --all
npm test
```

## License
MIT
