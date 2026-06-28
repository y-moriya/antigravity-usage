#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";

// src/version.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var packageJsonPath = join(__dirname, "../package.json");
var packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
var version = packageJson.version;

// src/core/logger.ts
var debugMode = false;
function setDebugMode(enabled) {
  debugMode = enabled;
}
function isDebugMode() {
  return debugMode;
}
function debug(category, message, data) {
  if (!debugMode) return;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  if (data !== void 0) {
    console.error(`${prefix} ${message}`, data);
  } else {
    console.error(`${prefix} ${message}`);
  }
}
function info(message) {
  console.log(message);
}
function warn(message) {
  console.warn(`\u26A0\uFE0F  ${message}`);
}
function error(message) {
  console.error(`\u274C ${message}`);
}
function success(message) {
  console.log(`\u2705 ${message}`);
}

// src/google/oauth.ts
import { createServer } from "http";
import { URL as URL2, URLSearchParams } from "url";
import open from "open";
import inquirer from "inquirer";

// src/accounts/types.ts
var DEFAULT_CONFIG = {
  version: "2.0",
  activeAccount: null,
  preferences: {
    cacheTTL: 300
  }
};

// src/accounts/storage.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, writeFileSync, readdirSync, rmSync } from "fs";
import { join as join3 } from "path";

// src/core/env.ts
import { homedir, platform } from "os";
import { join as join2 } from "path";
import { existsSync } from "fs";
function getPlatform() {
  const p = platform();
  if (p === "win32") return "windows";
  if (p === "darwin") return "macos";
  return "linux";
}
function getConfigDir() {
  const p = getPlatform();
  const home = homedir();
  const getPath = (name) => {
    switch (p) {
      case "windows":
        return join2(process.env.APPDATA || join2(home, "AppData", "Roaming"), name);
      case "macos":
        return join2(home, "Library", "Application Support", name);
      case "linux":
      default:
        return join2(process.env.XDG_CONFIG_HOME || join2(home, ".config"), name);
    }
  };
  const oldPath = getPath("agy-usage");
  const newPath = getPath("agy-usage");
  if (existsSync(oldPath)) {
    return oldPath;
  }
  return newPath;
}
function getTokensPath() {
  return join2(getConfigDir(), "tokens.json");
}
function getAccountsDir() {
  return join2(getConfigDir(), "accounts");
}
function getAccountDir(email) {
  const safeName = email.replace(/[^a-zA-Z0-9@._-]/g, "_");
  return join2(getAccountsDir(), safeName);
}
function getGlobalConfigPath() {
  return join2(getConfigDir(), "config.json");
}

// src/accounts/storage.ts
function ensureAccountsDir() {
  const dir = getAccountsDir();
  if (!existsSync2(dir)) {
    debug("accounts-storage", `Creating accounts directory: ${dir}`);
    mkdirSync(dir, { recursive: true });
  }
}
function ensureAccountDir(email) {
  ensureAccountsDir();
  const dir = getAccountDir(email);
  if (!existsSync2(dir)) {
    debug("accounts-storage", `Creating account directory: ${dir}`);
    mkdirSync(dir, { recursive: true });
  }
}
function accountExists(email) {
  const dir = getAccountDir(email);
  return existsSync2(dir) && existsSync2(join3(dir, "tokens.json"));
}
function listAccountEmails() {
  const accountsDir = getAccountsDir();
  if (!existsSync2(accountsDir)) {
    return [];
  }
  try {
    const entries = readdirSync(accountsDir, { withFileTypes: true });
    const emails = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const tokensPath = join3(accountsDir, entry.name, "tokens.json");
        if (existsSync2(tokensPath)) {
          emails.push(entry.name);
        }
      }
    }
    return emails;
  } catch (err) {
    debug("accounts-storage", "Failed to list accounts", err);
    return [];
  }
}
function saveAccountTokens(email, tokens) {
  ensureAccountDir(email);
  const path = join3(getAccountDir(email), "tokens.json");
  debug("accounts-storage", `Saving tokens for ${email}`);
  writeFileSync(path, JSON.stringify(tokens, null, 2), { mode: 384 });
}
function loadAccountTokens(email) {
  const path = join3(getAccountDir(email), "tokens.json");
  if (!existsSync2(path)) {
    debug("accounts-storage", `No tokens file for ${email}`);
    return null;
  }
  try {
    const content = readFileSync2(path, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    debug("accounts-storage", `Failed to parse tokens for ${email}`, err);
    return null;
  }
}
function saveAccountMetadata(email, metadata) {
  ensureAccountDir(email);
  const path = join3(getAccountDir(email), "metadata.json");
  debug("accounts-storage", `Saving metadata for ${email}`);
  writeFileSync(path, JSON.stringify(metadata, null, 2), { mode: 384 });
}
function loadAccountMetadata(email) {
  const path = join3(getAccountDir(email), "metadata.json");
  if (!existsSync2(path)) {
    return null;
  }
  try {
    const content = readFileSync2(path, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    debug("accounts-storage", `Failed to parse metadata for ${email}`, err);
    return null;
  }
}
function updateLastUsed(email) {
  const metadata = loadAccountMetadata(email);
  if (metadata) {
    metadata.lastUsed = (/* @__PURE__ */ new Date()).toISOString();
    saveAccountMetadata(email, metadata);
  }
}
function saveAccountCache(email, cache) {
  ensureAccountDir(email);
  const path = join3(getAccountDir(email), "cache.json");
  debug("accounts-storage", `Saving cache for ${email}`);
  writeFileSync(path, JSON.stringify(cache, null, 2));
}
function loadAccountCache(email) {
  const path = join3(getAccountDir(email), "cache.json");
  if (!existsSync2(path)) {
    return null;
  }
  try {
    const content = readFileSync2(path, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    debug("accounts-storage", `Failed to parse cache for ${email}`, err);
    return null;
  }
}
function deleteAccount(email) {
  const dir = getAccountDir(email);
  if (!existsSync2(dir)) {
    debug("accounts-storage", `Account ${email} does not exist`);
    return false;
  }
  try {
    rmSync(dir, { recursive: true, force: true });
    debug("accounts-storage", `Deleted account ${email}`);
    return true;
  } catch (err) {
    debug("accounts-storage", `Failed to delete account ${email}`, err);
    return false;
  }
}

// src/accounts/config.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2 } from "fs";
import { dirname as dirname2 } from "path";
function loadConfig() {
  const path = getGlobalConfigPath();
  if (!existsSync3(path)) {
    debug("config", "No config file found, using defaults");
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = readFileSync3(path, "utf-8");
    const config = JSON.parse(content);
    return {
      ...DEFAULT_CONFIG,
      ...config,
      preferences: {
        ...DEFAULT_CONFIG.preferences,
        ...config.preferences
      }
    };
  } catch (err) {
    debug("config", "Failed to parse config, using defaults", err);
    return { ...DEFAULT_CONFIG };
  }
}
function saveConfig(config) {
  const path = getGlobalConfigPath();
  const dir = dirname2(path);
  if (!existsSync3(dir)) {
    mkdirSync2(dir, { recursive: true });
  }
  debug("config", `Saving config to ${path}`);
  writeFileSync2(path, JSON.stringify(config, null, 2));
}
function getActiveAccountEmail() {
  const config = loadConfig();
  return config.activeAccount;
}
function setActiveAccountEmail(email) {
  const config = loadConfig();
  config.activeAccount = email;
  saveConfig(config);
}
function getCacheTTL() {
  const config = loadConfig();
  return config.preferences.cacheTTL;
}

// src/accounts/cache.ts
function isCacheValid(email) {
  const cache = loadAccountCache(email);
  if (!cache || !cache.data) {
    debug("cache", `No valid cache for ${email}`);
    return false;
  }
  const cachedAt = new Date(cache.cachedAt).getTime();
  const ttlMs = cache.ttl * 1e3;
  const now = Date.now();
  const isValid = now - cachedAt < ttlMs;
  debug("cache", `Cache for ${email} is ${isValid ? "valid" : "stale"}`);
  return isValid;
}
function getCacheAge(email) {
  const cache = loadAccountCache(email);
  if (!cache) {
    return null;
  }
  const cachedAt = new Date(cache.cachedAt).getTime();
  return Math.floor((Date.now() - cachedAt) / 1e3);
}
function saveCache(email, data) {
  const ttl = getCacheTTL();
  const cache = {
    cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ttl,
    data
  };
  saveAccountCache(email, cache);
  debug("cache", `Cached quota for ${email}, TTL: ${ttl}s`);
}
function loadCache(email) {
  const cache = loadAccountCache(email);
  return cache?.data || null;
}
function loadCacheWithMeta(email) {
  return loadAccountCache(email);
}

// src/accounts/manager.ts
var EXPIRY_BUFFER_MS = 5 * 60 * 1e3;
var AccountManager = class _AccountManager {
  static instance = null;
  constructor() {
  }
  static getInstance() {
    if (!_AccountManager.instance) {
      _AccountManager.instance = new _AccountManager();
    }
    return _AccountManager.instance;
  }
  /**
   * Reset instance (for testing)
   */
  static resetInstance() {
    _AccountManager.instance = null;
  }
  /**
   * Get all account emails
   */
  getAccountEmails() {
    return listAccountEmails();
  }
  /**
   * Get active account email
   */
  getActiveEmail() {
    return getActiveAccountEmail();
  }
  /**
   * Set active account
   */
  setActiveAccount(email) {
    if (!accountExists(email)) {
      debug("account-manager", `Account ${email} does not exist`);
      return false;
    }
    setActiveAccountEmail(email);
    updateLastUsed(email);
    debug("account-manager", `Switched to account ${email}`);
    return true;
  }
  /**
   * Check if an account exists
   */
  hasAccount(email) {
    return accountExists(email);
  }
  /**
   * Get account status
   */
  getAccountStatus(email) {
    const tokens = loadAccountTokens(email);
    if (!tokens) {
      return "invalid";
    }
    const now = Date.now();
    if (now >= tokens.expiresAt - EXPIRY_BUFFER_MS) {
      if (tokens.refreshToken) {
        return "expired";
      }
      return "invalid";
    }
    return "valid";
  }
  /**
   * Get detailed account info
   */
  getAccountInfo(email) {
    if (!accountExists(email)) {
      return null;
    }
    const activeEmail = getActiveAccountEmail();
    const tokens = loadAccountTokens(email);
    const metadata = loadAccountMetadata(email);
    const cache = loadCacheWithMeta(email);
    const status = this.getAccountStatus(email);
    return {
      email,
      isActive: email === activeEmail,
      tokens,
      metadata,
      cache,
      status
    };
  }
  /**
   * Get account summaries for list display
   */
  getAccountSummaries() {
    const emails = this.getAccountEmails();
    const activeEmail = getActiveAccountEmail();
    return emails.map((email) => {
      const metadata = loadAccountMetadata(email);
      const cache = loadCacheWithMeta(email);
      const status = this.getAccountStatus(email);
      let cachedCredits = null;
      if (cache?.data?.promptCredits) {
        const pc = cache.data.promptCredits;
        cachedCredits = {
          used: pc.monthly - pc.available,
          limit: pc.monthly
        };
      }
      return {
        email,
        isActive: email === activeEmail,
        status,
        lastUsed: metadata?.lastUsed || null,
        cachedCredits
      };
    });
  }
  /**
   * Add a new account after successful OAuth
   */
  addAccount(tokens, email) {
    debug("account-manager", `Adding account ${email}`);
    saveAccountTokens(email, tokens);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const metadata = {
      email,
      addedAt: now,
      lastUsed: now
    };
    saveAccountMetadata(email, metadata);
    setActiveAccountEmail(email);
    debug("account-manager", `Account ${email} added and set as active`);
  }
  /**
   * Update tokens for existing account
   */
  updateTokens(email, tokens) {
    if (!accountExists(email)) {
      debug("account-manager", `Cannot update tokens: account ${email} does not exist`);
      return;
    }
    saveAccountTokens(email, tokens);
    updateLastUsed(email);
    debug("account-manager", `Updated tokens for ${email}`);
  }
  /**
   * Remove an account
   */
  removeAccount(email) {
    if (!accountExists(email)) {
      debug("account-manager", `Account ${email} does not exist`);
      return false;
    }
    const activeEmail = getActiveAccountEmail();
    if (email === activeEmail) {
      setActiveAccountEmail(null);
    }
    const deleted = deleteAccount(email);
    if (deleted && email === activeEmail) {
      const remaining = this.getAccountEmails();
      if (remaining.length > 0) {
        setActiveAccountEmail(remaining[0]);
        debug("account-manager", `Set ${remaining[0]} as new active account`);
      }
    }
    return deleted;
  }
  /**
   * Remove all accounts
   */
  removeAllAccounts() {
    const emails = this.getAccountEmails();
    let count = 0;
    for (const email of emails) {
      if (deleteAccount(email)) {
        count++;
      }
    }
    setActiveAccountEmail(null);
    debug("account-manager", `Removed ${count} accounts`);
    return count;
  }
  /**
   * Get tokens for an account
   */
  getTokens(email) {
    return loadAccountTokens(email);
  }
  /**
   * Get tokens for active account
   */
  getActiveTokens() {
    const email = getActiveAccountEmail();
    if (!email) {
      return null;
    }
    return loadAccountTokens(email);
  }
  /**
   * Check if cache is valid for an account
   */
  isCacheValid(email) {
    return isCacheValid(email);
  }
  /**
   * Get cache age in seconds
   */
  getCacheAge(email) {
    return getCacheAge(email);
  }
};
function getAccountManager() {
  return AccountManager.getInstance();
}

// src/google/oauth.ts
var OAUTH_CONFIG = {
  clientId: process.env.ANTIGRAVITY_OAUTH_CLIENT_ID || "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com",
  clientSecret: process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET || "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",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
};
var CLOUDCODE_CONFIG = {
  baseUrl: "https://daily-cloudcode-pa.googleapis.com",
  userAgent: "antigravity",
  metadata: {
    ideType: "ANTIGRAVITY",
    platform: "PLATFORM_UNSPECIFIED",
    pluginType: "GEMINI"
  },
  onboardAttempts: 5,
  onboardDelayMs: 2e3
};
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function getAvailablePort(preferredPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(preferredPort || 0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get server address"));
      }
    });
    server.on("error", reject);
  });
}
async function exchangeCodeForTokens(code, redirectUri) {
  debug("oauth", "Exchanging code for tokens");
  const params = new URLSearchParams({
    code,
    client_id: OAUTH_CONFIG.clientId,
    client_secret: OAUTH_CONFIG.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const response = await fetch(OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error2 = await response.text();
    debug("oauth", "Token exchange failed", error2);
    throw new Error(`Token exchange failed: ${response.status} ${error2}`);
  }
  const data = await response.json();
  debug("oauth", "Token exchange successful");
  return data;
}
async function getUserEmail(accessToken) {
  debug("oauth", "Fetching user info");
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.email;
    }
  } catch (err) {
    debug("oauth", "Failed to get user info", err);
  }
  return void 0;
}
function extractProjectId(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (value && typeof value === "object" && "id" in value) {
    const id = value.id;
    if (typeof id === "string" && id.length > 0) {
      return id;
    }
  }
  return void 0;
}
function pickOnboardTier(allowedTiers, tierIdFromLoad) {
  if (!allowedTiers || allowedTiers.length === 0) {
    return tierIdFromLoad;
  }
  const defaultTier = allowedTiers.find((t) => t.isDefault === true && t.id && t.id.length > 0);
  if (defaultTier?.id) {
    return defaultTier.id;
  }
  const firstTier = allowedTiers.find((t) => t.id && t.id.length > 0);
  if (firstTier?.id) {
    return firstTier.id;
  }
  if (allowedTiers.length > 0) {
    return "LEGACY";
  }
  return tierIdFromLoad;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function tryOnboardUser(accessToken, tierId) {
  debug("oauth", `Starting onboard flow with tierId: ${tierId}`);
  const payload = {
    tierId,
    metadata: CLOUDCODE_CONFIG.metadata
  };
  for (let attempt = 1; attempt <= CLOUDCODE_CONFIG.onboardAttempts; attempt++) {
    debug("oauth", `Onboard attempt ${attempt}/${CLOUDCODE_CONFIG.onboardAttempts}`);
    try {
      const response = await fetch(`${CLOUDCODE_CONFIG.baseUrl}/v1internal:onboardUser`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": CLOUDCODE_CONFIG.userAgent
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        debug("oauth", `Onboard request failed: ${response.status}`);
        if (response.status === 401 || response.status === 403) {
          debug("oauth", "Onboarding forbidden or unauthorized, stopping retries");
          return void 0;
        }
      } else {
        const data = await response.json();
        debug("oauth", `Onboard response: done=${data.done}`);
        if (data.done === true) {
          const projectId = extractProjectId(data.response?.cloudaicompanionProject);
          if (projectId) {
            debug("oauth", `Onboarding complete, projectId: ${projectId}`);
            return projectId;
          }
          debug("oauth", "Onboarding done but no projectId in response");
          return void 0;
        }
      }
    } catch (err) {
      debug("oauth", `Onboard attempt ${attempt} error:`, err);
    }
    if (attempt < CLOUDCODE_CONFIG.onboardAttempts) {
      debug("oauth", `Waiting ${CLOUDCODE_CONFIG.onboardDelayMs}ms before next attempt`);
      await sleep(CLOUDCODE_CONFIG.onboardDelayMs);
    }
  }
  debug("oauth", "Onboarding attempts exhausted");
  return void 0;
}
async function resolveProjectId(accessToken) {
  debug("oauth", "Resolving project ID from Cloud Code API");
  try {
    const response = await fetch(`${CLOUDCODE_CONFIG.baseUrl}/v1internal:loadCodeAssist`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": CLOUDCODE_CONFIG.userAgent
      },
      body: JSON.stringify({ metadata: CLOUDCODE_CONFIG.metadata })
    });
    if (!response.ok) {
      debug("oauth", `loadCodeAssist failed: ${response.status}`);
      return { projectId: void 0, tierId: void 0 };
    }
    const data = await response.json();
    const projectId = extractProjectId(data.cloudaicompanionProject);
    const tierId = data.paidTier?.id || data.currentTier?.id;
    if (projectId) {
      debug("oauth", `Got projectId from loadCodeAssist: ${projectId}`);
      return { projectId, tierId };
    }
    debug("oauth", "No projectId in loadCodeAssist response, initiating onboarding");
    const onboardTier = pickOnboardTier(data.allowedTiers, tierId);
    if (!onboardTier) {
      debug("oauth", "Cannot determine tier for onboarding");
      return { projectId: void 0, tierId };
    }
    const onboardedProjectId = await tryOnboardUser(accessToken, onboardTier);
    return {
      projectId: onboardedProjectId,
      tierId: onboardTier
    };
  } catch (err) {
    debug("oauth", "Error resolving project ID", err);
    return { projectId: void 0, tierId: void 0 };
  }
}
async function completeLogin(code, redirectUri) {
  const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
  const email = await getUserEmail(tokenResponse.access_token);
  let projectId;
  try {
    const projectResult = await resolveProjectId(tokenResponse.access_token);
    projectId = projectResult.projectId;
    if (projectId) {
      debug("oauth", `Project ID resolved: ${projectId}`);
    } else {
      debug("oauth", "No project ID obtained (will fetch on demand)");
    }
  } catch (err) {
    debug("oauth", "Failed to resolve project ID during login (will fetch on demand)", err);
  }
  const tokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || "",
    expiresAt: Date.now() + tokenResponse.expires_in * 1e3,
    email,
    projectId
  };
  if (email) {
    getAccountManager().addAccount(tokens, email);
  }
  return { success: true, email };
}
async function startOAuthFlow(options = {}) {
  const port = await getAvailablePort(options.port);
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const state = generateState();
  debug("oauth", `Starting OAuth flow on port ${port}`);
  const authParams = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_CONFIG.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state
  });
  const authUrl = `${OAUTH_CONFIG.authUrl}?${authParams.toString()}`;
  if (options.manual) {
    info("");
    info("MANUAL LOGIN MODE");
    info("1. Copy this URL and open it in your browser:");
    info(authUrl);
    info("");
    info("2. Login with your Google account.");
    info("3. You will be redirected to a localhost URL (which may fail to load).");
    info("4. Copy that ENTIRE localhost URL and paste it below.");
    info("");
    const { pastedUrl } = await inquirer.prompt([
      {
        type: "input",
        name: "pastedUrl",
        message: "Paste the full redirect URL here:",
        validate: (input) => input.trim().length > 0 ? true : "Please paste the URL"
      }
    ]);
    try {
      const url = new URL2(pastedUrl.trim());
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");
      if (errorParam) {
        return { success: false, error: errorParam };
      }
      if (!code || returnedState !== state) {
        return { success: false, error: "Invalid URL: Missing code or state mismatch" };
      }
      return await completeLogin(code, redirectUri);
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, error: err.message };
      }
      return { success: false, error: "Invalid URL format" };
    }
  }
  return new Promise((resolve) => {
    let resolved = false;
    const server = createServer(async (req, res) => {
      if (resolved) return;
      const url = new URL2(req.url || "/", `http://127.0.0.1:${port}`);
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        if (errorParam) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Login Failed</h1><p>You can close this window.</p></body></html>");
          resolved = true;
          server.close();
          resolve({ success: false, error: errorParam });
          return;
        }
        if (!code || returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Invalid Request</h1><p>State mismatch or missing code.</p></body></html>");
          resolved = true;
          server.close();
          resolve({ success: false, error: "Invalid callback" });
          return;
        }
        try {
          const result = await completeLogin(code, redirectUri);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Login Successful!</h1>
                <p>You are now logged in${result.email ? ` as <strong>${result.email}</strong>` : ""}.</p>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
          resolved = true;
          server.close();
          resolve(result);
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Login Failed</h1><p>Token exchange failed.</p></body></html>");
          resolved = true;
          server.close();
          resolve({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
        }
      }
    });
    server.listen(port, "127.0.0.1", async () => {
      info("");
      info("Opening browser for Google login...");
      info("");
      if (options.noBrowser) {
        info("Open this URL in your browser:");
        info(authUrl);
      } else {
        try {
          await open(authUrl);
          info("If the browser did not open, visit this URL:");
          info(authUrl);
        } catch (err) {
          debug("oauth", "Failed to open browser", err);
          info("Could not open browser. Please visit this URL:");
          info(authUrl);
        }
      }
      info("");
      info("Waiting for authentication...");
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        resolve({ success: false, error: "Login timed out" });
      }
    }, 2 * 60 * 1e3);
  });
}
async function refreshAccessToken(refreshToken) {
  debug("oauth", "Refreshing access token");
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: OAUTH_CONFIG.clientId,
    client_secret: OAUTH_CONFIG.clientSecret,
    grant_type: "refresh_token"
  });
  const response = await fetch(OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error2 = await response.text();
    debug("oauth", "Token refresh failed", error2);
    throw new Error(`Token refresh failed: ${response.status}`);
  }
  const data = await response.json();
  debug("oauth", "Token refresh successful");
  return data;
}

// src/google/storage.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync4, writeFileSync as writeFileSync3, unlinkSync } from "fs";
import { dirname as dirname3 } from "path";
function saveTokens(tokens) {
  const email = tokens.email;
  if (!email) {
    const path = getTokensPath();
    const dir = dirname3(path);
    debug("storage", `Saving tokens to legacy path ${path}`);
    if (!existsSync4(dir)) {
      mkdirSync3(dir, { recursive: true });
    }
    writeFileSync3(path, JSON.stringify(tokens, null, 2), { mode: 384 });
    return;
  }
  debug("storage", `Saving tokens for account ${email}`);
  saveAccountTokens(email, tokens);
  if (!getActiveAccountEmail()) {
    setActiveAccountEmail(email);
  }
}
function loadTokens() {
  const activeEmail = getActiveAccountEmail();
  if (activeEmail) {
    const tokens = loadAccountTokens(activeEmail);
    if (tokens) {
      debug("storage", `Loaded tokens for active account ${activeEmail}`);
      return tokens;
    }
  }
  const legacyPath = getTokensPath();
  debug("storage", `Loading tokens from legacy path ${legacyPath}`);
  if (!existsSync4(legacyPath)) {
    debug("storage", "No tokens file found");
    return null;
  }
  try {
    const content = readFileSync4(legacyPath, "utf-8");
    const tokens = JSON.parse(content);
    debug("storage", "Tokens loaded successfully from legacy path");
    return tokens;
  } catch (err) {
    debug("storage", "Failed to parse tokens file", err);
    return null;
  }
}
function hasTokens() {
  const activeEmail = getActiveAccountEmail();
  if (activeEmail && accountExists(activeEmail)) {
    return true;
  }
  return existsSync4(getTokensPath());
}
function getStorageInfo() {
  const configDir = getConfigDir();
  const activeEmail = getActiveAccountEmail();
  let tokensPath;
  let exists;
  if (activeEmail) {
    tokensPath = `${getAccountDir(activeEmail)}/tokens.json`;
    exists = accountExists(activeEmail);
  } else {
    tokensPath = getTokensPath();
    exists = existsSync4(tokensPath);
  }
  return {
    configDir,
    tokensPath,
    exists
  };
}

// src/core/errors.ts
var NotLoggedInError = class extends Error {
  constructor(message = "Not logged in. Run: agy-usage login") {
    super(message);
    this.name = "NotLoggedInError";
  }
};
var AuthenticationError = class extends Error {
  constructor(message = "Authentication failed. Please login again.") {
    super(message);
    this.name = "AuthenticationError";
  }
};
var NetworkError = class extends Error {
  constructor(message = "Network error. Please check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
};
var RateLimitError = class extends Error {
  retryAfterMs;
  constructor(message = "Rate limited. Please try again later.", retryAfterMs) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
};
var APIError = class extends Error {
  statusCode;
  constructor(message, statusCode) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
  }
};
var TokenRefreshError = class extends Error {
  /** Original error that caused the refresh failure */
  cause;
  /** HTTP status code if available */
  statusCode;
  /** Whether the error is retryable (network issues) vs permanent (invalid token) */
  isRetryable;
  constructor(message = "Failed to refresh token. Please login again.", options) {
    super(message);
    this.name = "TokenRefreshError";
    this.cause = options?.cause;
    this.statusCode = options?.statusCode;
    this.isRetryable = options?.isRetryable ?? true;
  }
  /** Get detailed error message including cause */
  getDetailedMessage() {
    let msg = this.message;
    if (this.statusCode) {
      msg += ` (HTTP ${this.statusCode})`;
    }
    if (this.cause) {
      msg += `: ${this.cause.message}`;
    }
    return msg;
  }
};
var AntigravityNotRunningError = class extends Error {
  constructor(message = "Antigravity language server is not running. Please start Antigravity in your IDE.") {
    super(message);
    this.name = "AntigravityNotRunningError";
  }
};
var LocalConnectionError = class extends Error {
  constructor(message = "Failed to connect to local Antigravity server.") {
    super(message);
    this.name = "LocalConnectionError";
  }
};
var PortDetectionError = class extends Error {
  constructor(message = "Could not detect Antigravity server port.") {
    super(message);
    this.name = "PortDetectionError";
  }
};
var NoAuthMethodAvailableError = class extends Error {
  constructor(message = "Unable to fetch quota: Antigravity is not running and you are not logged in.\n\nPlease do one of the following:\n  \u2022 Run Antigravity in your IDE (VSCode, etc.), or\n  \u2022 Login with: agy-usage login") {
    super(message);
    this.name = "NoAuthMethodAvailableError";
  }
};

// src/google/token-manager.ts
var EXPIRY_BUFFER_MS2 = 5 * 60 * 1e3;
var TokenManager = class {
  tokens = null;
  accountEmail = null;
  constructor(email) {
    if (email) {
      this.accountEmail = email;
      this.tokens = loadAccountTokens(email);
    } else {
      this.accountEmail = getActiveAccountEmail();
      if (this.accountEmail) {
        this.tokens = loadAccountTokens(this.accountEmail);
      } else {
        this.tokens = loadTokens();
      }
    }
  }
  /**
   * Get the email this manager is for
   */
  getAccountEmail() {
    return this.accountEmail || this.tokens?.email || null;
  }
  /**
   * Check if user is logged in (has tokens)
   */
  isLoggedIn() {
    if (this.accountEmail) {
      return accountExists(this.accountEmail) && this.tokens !== null;
    }
    return hasTokens() && this.tokens !== null;
  }
  /**
   * Get the stored email
   */
  getEmail() {
    return this.tokens?.email;
  }
  /**
   * Get token expiry time
   */
  getExpiresAt() {
    if (!this.tokens) return void 0;
    return new Date(this.tokens.expiresAt);
  }
  /**
   * Get stored project ID
   */
  getProjectId() {
    return this.tokens?.projectId;
  }
  /**
   * Set and persist project ID
   */
  setProjectId(projectId) {
    if (!this.tokens) return;
    this.tokens.projectId = projectId;
    if (this.accountEmail) {
      saveAccountTokens(this.accountEmail, this.tokens);
    } else {
      saveTokens(this.tokens);
    }
    debug("token-manager", `Project ID saved: ${projectId}`);
  }
  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired() {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt - EXPIRY_BUFFER_MS2;
  }
  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken() {
    if (!this.tokens) {
      throw new NotLoggedInError();
    }
    debug("token-manager", "Checking token validity");
    if (this.isTokenExpired()) {
      debug("token-manager", "Token expired or expiring soon, refreshing...");
      await this.refreshToken();
    }
    return this.tokens.accessToken;
  }
  /**
   * Refresh the access token with retry logic
   * Retries on transient network errors, fails immediately on permanent errors (invalid_grant)
   */
  async refreshToken() {
    if (!this.tokens?.refreshToken) {
      throw new NotLoggedInError("No refresh token available. Please login again.");
    }
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1e3;
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        debug("token-manager", `Refreshing token (attempt ${attempt}/${MAX_RETRIES})...`);
        const response = await refreshAccessToken(this.tokens.refreshToken);
        this.tokens = {
          accessToken: response.access_token,
          refreshToken: response.refresh_token || this.tokens.refreshToken,
          expiresAt: Date.now() + response.expires_in * 1e3,
          email: this.tokens.email,
          projectId: this.tokens.projectId
        };
        if (this.accountEmail) {
          saveAccountTokens(this.accountEmail, this.tokens);
          updateLastUsed(this.accountEmail);
        } else {
          saveTokens(this.tokens);
        }
        debug("token-manager", "Token refreshed successfully");
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errorMessage = lastError.message.toLowerCase();
        const isPermanentError = errorMessage.includes("invalid_grant") || errorMessage.includes("400") || errorMessage.includes("401") || errorMessage.includes("invalid_token") || errorMessage.includes("token has been revoked");
        if (isPermanentError) {
          debug("token-manager", `Token refresh failed permanently: ${lastError.message}`);
          throw new TokenRefreshError(
            `Refresh token invalid or expired. Please login again.`,
            { cause: lastError, isRetryable: false }
          );
        }
        if (attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          debug("token-manager", `Token refresh attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`);
          await this.sleep(delayMs);
        } else {
          debug("token-manager", `Token refresh failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
        }
      }
    }
    throw new TokenRefreshError(
      `Failed to refresh token after ${MAX_RETRIES} attempts`,
      { cause: lastError, isRetryable: true }
    );
  }
  /**
   * Sleep helper for retry delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Reload tokens from disk
   */
  reload() {
    if (this.accountEmail) {
      this.tokens = loadAccountTokens(this.accountEmail);
    } else {
      this.tokens = loadTokens();
    }
  }
};
var tokenManagerInstance = null;
function getTokenManager() {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
}
function getTokenManagerForAccount(email) {
  return new TokenManager(email);
}
function resetTokenManager() {
  tokenManagerInstance = null;
}

// src/commands/login.ts
async function loginCommand(options) {
  const manager = getAccountManager();
  const existingAccounts = manager.getAccountEmails();
  if (existingAccounts.length > 0) {
    info(`You have ${existingAccounts.length} account(s). Adding another account...`);
  }
  const result = await startOAuthFlow({
    noBrowser: options.noBrowser,
    port: options.port,
    manual: options.manual
  });
  if (result.success) {
    resetTokenManager();
    success(`Logged in successfully${result.email ? ` as ${result.email}` : ""}!`);
    const accounts = manager.getAccountEmails();
    if (accounts.length > 1) {
      info(`
You now have ${accounts.length} accounts. Use \`agy-usage accounts list\` to see all.`);
    }
    process.exit(0);
  } else {
    error(`Login failed: ${result.error}`);
    process.exit(1);
  }
}

// src/commands/logout.ts
function logoutCommand(options, email) {
  const manager = getAccountManager();
  if (options.all) {
    const count = manager.removeAllAccounts();
    resetTokenManager();
    if (count > 0) {
      success(`Logged out of ${count} account(s).`);
    } else {
      warn("No accounts to log out.");
    }
    return;
  }
  if (email) {
    if (!manager.hasAccount(email)) {
      warn(`Account '${email}' not found.`);
      return;
    }
    const removed2 = manager.removeAccount(email);
    resetTokenManager();
    if (removed2) {
      success(`Logged out of ${email}.`);
      const remaining = manager.getAccountEmails();
      if (remaining.length > 0) {
        info(`Active account: ${manager.getActiveEmail() || "none"}`);
      }
    } else {
      warn(`Could not log out of ${email}.`);
    }
    return;
  }
  const activeEmail = manager.getActiveEmail();
  if (!activeEmail) {
    warn("Not logged in.");
    return;
  }
  const removed = manager.removeAccount(activeEmail);
  resetTokenManager();
  if (removed) {
    success(`Logged out of ${activeEmail}.`);
    const remaining = manager.getAccountEmails();
    if (remaining.length > 0) {
      const newActive = manager.getActiveEmail();
      info(`Switched to: ${newActive}`);
    }
  } else {
    warn("Could not delete account.");
  }
}

// src/core/mask.ts
function maskToken(token) {
  if (!token) return "";
  if (token.length <= 10) return "***";
  const first = token.slice(0, 6);
  const last = token.slice(-4);
  return `${first}...${last}`;
}
function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0] || ""}**@${domain}`;
  }
  return `${local.slice(0, 2)}**@${domain}`;
}

// src/commands/status.ts
import Table from "cli-table3";
function showSingleAccountStatus(email) {
  const tokenManager = email ? getTokenManagerForAccount(email) : getTokenManager();
  console.log();
  console.log("\u{1F4CD} Antigravity Usage Status");
  console.log("\u2500".repeat(40));
  if (!tokenManager.isLoggedIn()) {
    warn("Not logged in");
    console.log();
    info("Run `agy-usage login` to authenticate.");
    console.log();
    return;
  }
  const accountEmail = tokenManager.getEmail();
  const expiresAt = tokenManager.getExpiresAt();
  const isExpired = tokenManager.isTokenExpired();
  console.log(`\u2705 Logged in: Yes`);
  if (accountEmail) {
    console.log(`\u{1F4E7} Email: ${maskEmail(accountEmail)}`);
  }
  if (expiresAt) {
    const expiryStr = expiresAt.toLocaleString();
    const status = isExpired ? " (expired/expiring soon)" : "";
    console.log(`\u23F0 Token expires: ${expiryStr}${status}`);
  }
  if (isDebugMode()) {
    const tokens = email ? getAccountManager().getTokens(email) : getAccountManager().getActiveTokens();
    if (tokens) {
      console.log();
      console.log("Debug info:");
      console.log(`  Access token: ${maskToken(tokens.accessToken)}`);
      console.log(`  Refresh token: ${maskToken(tokens.refreshToken)}`);
    }
  }
  console.log();
}
function showAllAccountsStatus() {
  const manager = getAccountManager();
  const emails = manager.getAccountEmails();
  const activeEmail = manager.getActiveEmail();
  console.log();
  console.log("\u{1F4CD} Antigravity Usage Status - All Accounts");
  console.log("\u2550".repeat(60));
  if (emails.length === 0) {
    warn("No accounts found.");
    console.log();
    info("Run `agy-usage login` to add an account.");
    console.log();
    return;
  }
  const table = new Table({
    head: ["Account", "Logged In", "Token Expiry"],
    style: {
      head: ["cyan"],
      border: ["gray"]
    },
    colWidths: [30, 12, 28]
  });
  for (const email of emails) {
    const tokenManager = getTokenManagerForAccount(email);
    const isActive = email === activeEmail;
    const nameDisplay = isActive ? `${email} [*]` : email;
    if (tokenManager.isLoggedIn()) {
      const expiresAt = tokenManager.getExpiresAt();
      const isExpired = tokenManager.isTokenExpired();
      let expiryDisplay = "-";
      if (expiresAt) {
        expiryDisplay = expiresAt.toLocaleString();
        if (isExpired) {
          expiryDisplay = `\u26A0\uFE0F ${expiryDisplay}`;
        }
      }
      table.push([
        nameDisplay,
        "\u2705",
        expiryDisplay
      ]);
    } else {
      table.push([
        nameDisplay,
        "\u274C",
        "Invalid or missing"
      ]);
    }
  }
  console.log(table.toString());
  console.log();
  console.log("[*] = active account");
  console.log();
}
function statusCommand(options = {}) {
  if (options.all) {
    showAllAccountsStatus();
    return;
  }
  if (options.account) {
    const manager = getAccountManager();
    if (!manager.hasAccount(options.account)) {
      warn(`Account '${options.account}' not found.`);
      return;
    }
    showSingleAccountStatus(options.account);
    return;
  }
  showSingleAccountStatus();
}

// src/google/cloudcode.ts
import { randomUUID } from "crypto";
var BASE_URLS = [
  "https://daily-cloudcode-pa.googleapis.com",
  "https://cloudcode-pa.googleapis.com",
  "https://daily-cloudcode-pa.sandbox.googleapis.com"
];
var BASE_URL = BASE_URLS[0];
var USER_AGENT = "antigravity";
var MAX_TRIGGER_ATTEMPTS = 3;
var STREAM_PATH = "/v1internal:streamGenerateContent?alt=sse";
var SYSTEM_PROMPT = "You are Antigravity, a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding. You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question.**Absolute paths only****Proactiveness**";
var METADATA = {
  ideType: "ANTIGRAVITY",
  platform: "PLATFORM_UNSPECIFIED",
  pluginType: "GEMINI"
};
var CloudCodeClient = class {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
    this.projectId = tokenManager.getProjectId() || "default-cli-project";
  }
  projectId;
  /**
   * Make an authenticated API request
   */
  async request(endpoint, body) {
    const token = await this.tokenManager.getValidAccessToken();
    const url = `${BASE_URL}${endpoint}`;
    debug("cloudcode", `Calling ${endpoint}`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT
        },
        body: body ? JSON.stringify(body) : void 0
      });
      debug("cloudcode", `Response status: ${response.status}`);
      if (response.status === 401 || response.status === 403) {
        const errorBody = await response.text();
        debug("cloudcode", `Auth error body: ${errorBody}`);
        throw new AuthenticationError("Authentication failed. Please run: agy-usage login");
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryMs = retryAfter ? parseInt(retryAfter) * 1e3 : void 0;
        throw new RateLimitError("Rate limited by Google API", retryMs);
      }
      if (response.status >= 500) {
        throw new APIError(`Server error: ${response.status}`, response.status);
      }
      if (!response.ok) {
        const errorText = await response.text();
        debug("cloudcode", "API error response", errorText);
        throw new APIError(`API request failed: ${response.status}`, response.status);
      }
      const data = await response.json();
      debug("cloudcode", "API call successful");
      return data;
    } catch (err) {
      if (err instanceof AuthenticationError || err instanceof RateLimitError || err instanceof APIError) {
        throw err;
      }
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new NetworkError("Network error. Please check your connection.");
      }
      throw err;
    }
  }
  /**
   * Load code assist status and plan info
   * Also extracts project ID for subsequent calls
   */
  async loadCodeAssist() {
    const response = await this.request("/v1internal:loadCodeAssist", {
      metadata: METADATA
    });
    if (response.cloudaicompanionProject) {
      if (typeof response.cloudaicompanionProject === "string") {
        this.projectId = response.cloudaicompanionProject;
      } else if (response.cloudaicompanionProject.id) {
        this.projectId = response.cloudaicompanionProject.id;
      }
      debug("cloudcode", `Project ID: ${this.projectId}`);
    } else {
      this.projectId = this.projectId || "default-cli-project";
      debug("cloudcode", `Project ID (defaulted): ${this.projectId}`);
    }
    return response;
  }
  /**
   * Extract project ID from loadCodeAssist response
   */
  extractProjectId(response) {
    const projectId = response.cloudaicompanionProject || response.project || response.projectId || response.cloudProject;
    if (projectId && typeof projectId === "string" && projectId.length > 0) {
      this.projectId = projectId;
      debug("cloudcode", `Project ID extracted: ${this.projectId}`);
    } else {
      debug("cloudcode", "No project ID found in response");
    }
  }
  /**
   * Resolve project ID with onboarding retry if needed
   * This is the recommended way to get projectId reliably
   */
  async resolveProjectId(maxRetries = 5, retryDelayMs = 2e3) {
    if (this.projectId) {
      debug("cloudcode", `Using cached project ID: ${this.projectId}`);
      return this.projectId;
    }
    const loadResponse = await this.loadCodeAssist();
    if (this.projectId) {
      return this.projectId;
    }
    debug("cloudcode", "Project ID not found, attempting onboarding...");
    const tiers = loadResponse.allowedTiers || [];
    let tierId;
    const defaultTier = tiers.find((t) => t.isDefault);
    if (defaultTier) {
      tierId = defaultTier.id;
    } else if (loadResponse.paidTier?.id) {
      tierId = loadResponse.paidTier.id;
    } else if (loadResponse.currentTier?.id) {
      tierId = loadResponse.currentTier.id;
    } else if (tiers.length > 0) {
      tierId = tiers[0].id;
    }
    if (!tierId) {
      debug("cloudcode", "No tier available for onboarding");
      return void 0;
    }
    debug("cloudcode", `Onboarding with tier: ${tierId}`);
    try {
      await this.request("/v1internal:onboardUser", {
        tierId,
        metadata: {
          ideType: "ANTIGRAVITY",
          platform: "PLATFORM_UNSPECIFIED",
          pluginType: "GEMINI"
        }
      });
    } catch (err) {
      debug("cloudcode", "Onboarding call failed (may be expected):", err);
    }
    for (let i = 0; i < maxRetries; i++) {
      debug("cloudcode", `Retry ${i + 1}/${maxRetries} for project ID...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      await this.loadCodeAssist();
      if (this.projectId) {
        debug("cloudcode", `Project ID resolved after ${i + 1} retries: ${this.projectId}`);
        return this.projectId;
      }
    }
    debug("cloudcode", "Failed to resolve project ID after all retries");
    return void 0;
  }
  /**
   * Fetch available models with quota info
   * Requires project ID from loadCodeAssist
   */
  async fetchAvailableModels() {
    const projectId = this.projectId || "default-cli-project";
    const body = { project: projectId };
    return this.request("/v1internal:fetchAvailableModels", body);
  }
  /**
   * Generate content using a specific model (Agent Request Format)
   * Used for wake-up triggers to warm up models
   * 
   * Per docs/trigger.md, must use the agent request format with:
   * - project: Cloud Code project ID
   * - requestId: unique ID
   * - model: model ID
   * - userAgent: "antigravity"
   * - requestType: "agent"
   * - request: contains contents, session_id, systemInstruction, generationConfig
   * 
   * @param modelId Model ID to use
   * @param prompt User prompt to send
   * @param maxOutputTokens Maximum tokens to generate (0 = no limit)
   * @returns Generated text and optional token usage
   */
  async generateContent(modelId, prompt, maxOutputTokens) {
    debug("cloudcode", `Generating content with model: ${modelId}`);
    debug("cloudcode", `Current projectId: ${this.projectId}`);
    debug("cloudcode", "Warming up session with loadCodeAssist...");
    try {
      await this.loadCodeAssist();
      debug("cloudcode", `Session warmed up, projectId: ${this.projectId}`);
    } catch (err) {
      debug("cloudcode", "Warmup failed (continuing anyway):", err);
    }
    const requestId = randomUUID();
    const sessionId = randomUUID();
    const systemInstruction = {
      parts: [{ text: SYSTEM_PROMPT }]
    };
    const generationConfig = {
      temperature: 0
    };
    if (maxOutputTokens && maxOutputTokens > 0) {
      generationConfig.maxOutputTokens = maxOutputTokens;
    }
    const body = {
      requestId,
      model: modelId,
      userAgent: "antigravity",
      requestType: "agent",
      request: {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        session_id: sessionId,
        systemInstruction,
        generationConfig
      }
    };
    if (this.projectId) {
      body.project = this.projectId;
      debug("cloudcode", `Using project ID: ${this.projectId}`);
    } else {
      debug("cloudcode", "Sending request WITHOUT project ID");
    }
    debug("cloudcode", `Request body:`, JSON.stringify(body, null, 2));
    const token = await this.tokenManager.getValidAccessToken();
    const getBackoffDelay = (attempt) => {
      const raw = 500 * Math.pow(2, attempt - 2);
      const jitter = Math.random() * 100;
      return Math.min(raw + jitter, 4e3);
    };
    const sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const parseSSEResponse = (sseText) => {
      let fullText = "";
      let tokensUsed;
      for (const line of sseText.split("\n")) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.substring(6);
          if (jsonStr.trim() === "[DONE]") continue;
          try {
            const data = JSON.parse(jsonStr);
            const responseData = data.response || data;
            const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              fullText += candidateText;
            }
            if (responseData.usageMetadata) {
              tokensUsed = {
                prompt: responseData.usageMetadata.promptTokenCount || 0,
                completion: responseData.usageMetadata.candidatesTokenCount || 0,
                total: responseData.usageMetadata.totalTokenCount || 0
              };
            }
          } catch {
          }
        }
      }
      return { text: fullText, tokensUsed };
    };
    for (const baseUrl of BASE_URLS) {
      for (let attempt = 1; attempt <= MAX_TRIGGER_ATTEMPTS; attempt++) {
        if (attempt > 1) {
          const delay = getBackoffDelay(attempt);
          debug("cloudcode", `Retry ${attempt}/${MAX_TRIGGER_ATTEMPTS} in ${Math.round(delay)}ms...`);
          await sleep2(delay);
        }
        const url = `${baseUrl}${STREAM_PATH}`;
        debug("cloudcode", `Attempt ${attempt}/${MAX_TRIGGER_ATTEMPTS} on ${baseUrl}`);
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "User-Agent": USER_AGENT,
              "Content-Type": "application/json",
              "Accept-Encoding": "gzip"
              // CRITICAL: Must match example.ts
            },
            body: JSON.stringify(body)
          });
          const text = await response.text();
          debug("cloudcode", `Response ${response.status}`);
          debug("cloudcode", `Response text: ${text.slice(0, 500)}`);
          if (response.status === 429 || response.status >= 500) {
            debug("cloudcode", `${response.status} - retryable`);
            if (attempt === MAX_TRIGGER_ATTEMPTS) {
              debug("cloudcode", "Max attempts on this URL, trying next...");
              break;
            }
            continue;
          }
          if (response.ok) {
            debug("cloudcode", "Request succeeded!");
            const parsed = parseSSEResponse(text);
            debug("cloudcode", `Generated ${parsed.text.length} chars, tokens: ${parsed.tokensUsed?.total || "unknown"}`);
            return parsed;
          }
          debug("cloudcode", `Non-retryable error: ${response.status}`);
          throw new Error(`API request failed: ${response.status} - ${text}`);
        } catch (err) {
          if (err instanceof Error && !err.message.startsWith("API request failed")) {
            debug("cloudcode", `Network error: ${err.message}`);
            if (attempt === MAX_TRIGGER_ATTEMPTS) {
              debug("cloudcode", "Max attempts on this URL, trying next...");
              break;
            }
            continue;
          }
          throw err;
        }
      }
    }
    throw new Error("All trigger attempts failed across all base URLs");
  }
};

// src/google/parser.ts
function parseResetTime(resetTime) {
  if (!resetTime) return void 0;
  try {
    const resetDate = new Date(resetTime);
    const now = Date.now();
    const diff = resetDate.getTime() - now;
    return diff > 0 ? diff : void 0;
  } catch {
    return void 0;
  }
}
function parseModelInfo(modelId, model) {
  const quotaInfo = model.quotaInfo;
  const hasResetTime = !!quotaInfo?.resetTime;
  let remainingPercentage = quotaInfo?.remainingFraction;
  let isExhausted = quotaInfo?.isExhausted ?? quotaInfo?.remainingFraction === 0;
  if (hasResetTime && remainingPercentage === void 0) {
    remainingPercentage = 0;
    isExhausted = true;
  }
  return {
    label: model.displayName || model.label || modelId,
    modelId,
    remainingPercentage,
    isExhausted,
    resetTime: quotaInfo?.resetTime,
    timeUntilResetMs: parseResetTime(quotaInfo?.resetTime),
    isAutocompleteOnly: modelId.includes("gemini-2.5") || (model.displayName || "").includes("Gemini 2.5")
  };
}
function parsePromptCredits(response) {
  const monthly = response.planInfo?.monthlyPromptCredits;
  const available = response.availablePromptCredits;
  if (monthly === void 0 || available === void 0) {
    return void 0;
  }
  const used = monthly - available;
  const usedPercentage = monthly > 0 ? used / monthly : 0;
  const remainingPercentage = monthly > 0 ? available / monthly : 0;
  return {
    available,
    monthly,
    usedPercentage,
    remainingPercentage
  };
}
function shouldShowModel(modelId, model) {
  if (modelId.startsWith("tab_")) {
    return false;
  }
  if (modelId.includes("image")) {
    return false;
  }
  if (modelId.startsWith("rev")) {
    return false;
  }
  if (modelId.includes("mquery") || modelId.includes("lite")) {
    return false;
  }
  if (!model.quotaInfo) {
    return false;
  }
  return true;
}
function parseQuotaSnapshot(codeAssistResponse, modelsResponse, email) {
  debug("parser", "Parsing quota snapshot");
  const promptCredits = parsePromptCredits(codeAssistResponse);
  const planType = codeAssistResponse.planInfo?.planType;
  const modelsMap = modelsResponse.models || {};
  const models = [];
  for (const [modelId, modelInfo] of Object.entries(modelsMap)) {
    if (shouldShowModel(modelId, modelInfo)) {
      models.push(parseModelInfo(modelId, modelInfo));
    }
  }
  models.sort((a, b) => a.label.localeCompare(b.label));
  debug("parser", `Parsed ${models.length} models`);
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    method: "google",
    email,
    planType,
    promptCredits,
    models
  };
}

// src/local/process-detector.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
async function detectAntigravityProcess() {
  const platform2 = process.platform;
  debug("process-detector", `Detecting Antigravity process on platform: ${platform2}`);
  if (platform2 === "win32") {
    return detectOnWindows();
  } else {
    return detectOnUnix();
  }
}
async function detectOnUnix() {
  try {
    const { stdout } = await execAsync("ps aux");
    const lines = stdout.split("\n");
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!lower.includes("antigravity")) {
        continue;
      }
      if (lower.includes("server installation script")) {
        continue;
      }
      const hasServerSignal = line.includes("language-server") || line.includes("lsp") || line.includes("--csrf_token") || line.includes("--extension_server_port") || line.includes("exa.language_server_pb");
      if (!hasServerSignal) {
        continue;
      }
      debug("process-detector", `Found potential Antigravity process: ${line}`);
      const processInfo = parseUnixProcessLine(line);
      if (processInfo) {
        return processInfo;
      }
    }
    debug("process-detector", "No Antigravity process found");
    return null;
  } catch (err) {
    debug("process-detector", "Error detecting process on Unix", err);
    return null;
  }
}
function parseUnixProcessLine(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 11) {
    return null;
  }
  const pid = parseInt(parts[1], 10);
  if (isNaN(pid)) {
    return null;
  }
  const commandLine = parts.slice(10).join(" ");
  const csrfToken = extractArgument(commandLine, "--csrf_token");
  const extensionServerPort = extractArgument(commandLine, "--extension_server_port");
  return {
    pid,
    csrfToken: csrfToken || void 0,
    extensionServerPort: extensionServerPort ? parseInt(extensionServerPort, 10) : void 0,
    commandLine
  };
}
async function detectOnWindows() {
  try {
    const { stdout } = await execAsync(
      `wmic process where "name like '%antigravity%' or commandline like '%antigravity%'" get processid,commandline /format:csv`,
      { maxBuffer: 10 * 1024 * 1024 }
      // 10MB buffer for long command lines
    );
    const lines = stdout.split("\n").filter((line) => line.trim() && !line.includes("Node,CommandLine,ProcessId"));
    const candidates = [];
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 3) {
        const commandLine = parts.slice(1, -1).join(",");
        const pid = parseInt(parts[parts.length - 1].trim(), 10);
        if (!isNaN(pid) && commandLine.toLowerCase().includes("antigravity")) {
          candidates.push({
            pid,
            csrfToken: extractArgument(commandLine, "--csrf_token") || void 0,
            extensionServerPort: parsePortValue(extractArgument(commandLine, "--extension_server_port")),
            commandLine
          });
        }
      }
    }
    const selected = selectBestWindowsCandidate(candidates);
    if (selected) {
      debug("process-detector", `Selected Antigravity process on Windows: PID ${selected.pid}`);
      return selected;
    }
    return await detectOnWindowsPowerShell();
  } catch (err) {
    debug("process-detector", "Error detecting process on Windows with WMIC, trying PowerShell", err);
    return await detectOnWindowsPowerShell();
  }
}
async function detectOnWindowsPowerShell() {
  try {
    const { stdout } = await execAsync(
      `powershell -Command "Get-Process | Where-Object { $_.ProcessName -like '*antigravity*' } | Select-Object Id, ProcessName | ConvertTo-Json"`
    );
    if (!stdout.trim()) {
      return null;
    }
    const processes = JSON.parse(stdout);
    const processList = Array.isArray(processes) ? processes : [processes];
    const candidates = [];
    for (const proc of processList) {
      if (proc.Id) {
        const { stdout: cmdLine } = await execAsync(
          `powershell -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId = ${proc.Id}').CommandLine"`
        );
        const commandLine = cmdLine.trim();
        if (!commandLine.toLowerCase().includes("antigravity")) {
          continue;
        }
        candidates.push({
          pid: proc.Id,
          csrfToken: extractArgument(commandLine, "--csrf_token") || void 0,
          extensionServerPort: parsePortValue(extractArgument(commandLine, "--extension_server_port")),
          commandLine
        });
      }
    }
    const selected = selectBestWindowsCandidate(candidates);
    if (selected) {
      debug("process-detector", `Selected Antigravity process on Windows (PowerShell): PID ${selected.pid}`);
      return selected;
    }
    return null;
  } catch (err) {
    debug("process-detector", "Error detecting process on Windows with PowerShell", err);
    return null;
  }
}
function parsePortValue(rawPort) {
  if (!rawPort) {
    return void 0;
  }
  const parsed = parseInt(rawPort, 10);
  return isNaN(parsed) ? void 0 : parsed;
}
function scoreWindowsCandidate(candidate) {
  const lower = candidate.commandLine.toLowerCase();
  let score = 0;
  if (lower.includes("antigravity")) score += 1;
  if (lower.includes("lsp")) score += 5;
  if (candidate.extensionServerPort) score += 10;
  if (candidate.csrfToken) score += 20;
  if (lower.includes("language_server") || lower.includes("language-server") || lower.includes("exa.language_server_pb")) {
    score += 50;
  }
  return score;
}
function selectBestWindowsCandidate(candidates) {
  if (candidates.length === 0) {
    return null;
  }
  debug("process-detector", `Found ${candidates.length} Antigravity candidate process(es) on Windows`);
  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = scoreWindowsCandidate(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  if (best) {
    debug("process-detector", `Selected PID ${best.pid} with score ${bestScore}`);
  }
  return best;
}
function extractArgument(commandLine, argName) {
  const eqRegex = new RegExp(`${argName}=([^\\s"']+|"[^"]*"|'[^']*')`, "i");
  const eqMatch = commandLine.match(eqRegex);
  if (eqMatch) {
    return eqMatch[1].replace(/^["']|["']$/g, "");
  }
  const spaceRegex = new RegExp(`${argName}\\s+([^\\s"']+|"[^"]*"|'[^']*')`, "i");
  const spaceMatch = commandLine.match(spaceRegex);
  if (spaceMatch) {
    return spaceMatch[1].replace(/^["']|["']$/g, "");
  }
  return null;
}

// src/local/port-detective.ts
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
var execAsync2 = promisify2(exec2);
async function discoverPorts(pid) {
  const platform2 = process.platform;
  debug("port-detective", `Discovering ports for PID ${pid} on platform: ${platform2}`);
  if (platform2 === "win32") {
    return discoverPortsOnWindows(pid);
  } else if (platform2 === "darwin") {
    return discoverPortsOnMacOS(pid);
  } else {
    return discoverPortsOnLinux(pid);
  }
}
async function discoverPortsOnMacOS(pid) {
  try {
    const { stdout } = await execAsync2(`lsof -nP -iTCP -sTCP:LISTEN -a -p ${pid}`);
    const ports = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) {
        const port = parseInt(match[1], 10);
        if (!isNaN(port) && !ports.includes(port)) {
          ports.push(port);
        }
      }
    }
    debug("port-detective", `Found ports on macOS: ${ports.join(", ")}`);
    return ports;
  } catch (err) {
    debug("port-detective", "Error discovering ports on macOS", err);
    return [];
  }
}
async function discoverPortsOnLinux(pid) {
  try {
    const { stdout } = await execAsync2(`ss -tlnp | grep "pid=${pid},"`);
    const ports = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.match(/:(\d+)\s/);
      if (match) {
        const port = parseInt(match[1], 10);
        if (!isNaN(port) && !ports.includes(port)) {
          ports.push(port);
        }
      }
    }
    if (ports.length > 0) {
      debug("port-detective", `Found ports on Linux (ss): ${ports.join(", ")}`);
      return ports;
    }
    return await discoverPortsOnLinuxNetstat(pid);
  } catch {
    return await discoverPortsOnLinuxNetstat(pid);
  }
}
async function discoverPortsOnLinuxNetstat(pid) {
  try {
    const { stdout } = await execAsync2(`netstat -tlnp 2>/dev/null | grep "${pid}/"`);
    const ports = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.match(/:(\d+)\s/);
      if (match) {
        const port = parseInt(match[1], 10);
        if (!isNaN(port) && !ports.includes(port)) {
          ports.push(port);
        }
      }
    }
    debug("port-detective", `Found ports on Linux (netstat): ${ports.join(", ")}`);
    return ports;
  } catch (err) {
    debug("port-detective", "Error discovering ports on Linux", err);
    return [];
  }
}
async function discoverPortsOnWindows(pid) {
  try {
    const { stdout } = await execAsync2("netstat -ano");
    const ports = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.includes("LISTENING")) {
        const parts = line.trim().split(/\s+/);
        const linePid = parseInt(parts[parts.length - 1], 10);
        if (linePid === pid) {
          const localAddr = parts[1];
          const portMatch = localAddr.match(/:(\d+)$/);
          if (portMatch) {
            const port = parseInt(portMatch[1], 10);
            if (!isNaN(port) && !ports.includes(port)) {
              ports.push(port);
            }
          }
        }
      }
    }
    debug("port-detective", `Found ports on Windows: ${ports.join(", ")}`);
    return ports;
  } catch (err) {
    debug("port-detective", "Error discovering ports on Windows", err);
    return [];
  }
}

// src/local/port-prober.ts
import https from "https";
import http from "http";
var CONNECT_RPC_PATH = "/exa.language_server_pb.LanguageServerService/GetUnleashData";
var VALID_CONNECT_STATUSES = /* @__PURE__ */ new Set([200, 401]);
async function probeForConnectAPI(ports, csrfToken, timeout = 500) {
  debug("port-prober", `Probing ${ports.length} ports: ${ports.join(", ")}`);
  const probePromises = ports.map((port) => probePort(port, csrfToken, timeout));
  const results = await Promise.allSettled(probePromises);
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value) {
      debug("port-prober", `Found working endpoint: ${result.value.baseUrl}`);
      return result.value;
    }
  }
  debug("port-prober", "No working Connect API endpoint found");
  return null;
}
async function probePort(port, csrfToken, timeout = 500) {
  const httpsResult = await probeHttps(port, timeout, csrfToken);
  if (httpsResult) {
    return httpsResult;
  }
  const httpResult = await probeHttp(port, timeout, csrfToken);
  if (httpResult) {
    return httpResult;
  }
  return null;
}
function probeHttps(port, timeout, csrfToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path: CONNECT_RPC_PATH,
      method: "POST",
      timeout,
      rejectUnauthorized: false,
      // Allow self-signed certificates
      headers: {
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
        ...csrfToken ? { "X-Codeium-Csrf-Token": csrfToken } : {}
      }
    };
    const req = https.request(options, (res) => {
      if (res.statusCode && VALID_CONNECT_STATUSES.has(res.statusCode)) {
        debug("port-prober", `HTTPS Connect RPC probe on port ${port}: status ${res.statusCode} - valid connect port`);
        resolve({
          baseUrl: `https://127.0.0.1:${port}`,
          protocol: "https",
          port
        });
      } else {
        debug("port-prober", `HTTPS probe on port ${port}: status ${res.statusCode} - not connect port`);
        resolve(null);
      }
      res.resume();
    });
    req.on("error", (err) => {
      debug("port-prober", `HTTPS probe on port ${port} failed: ${err.message}`);
      resolve(null);
    });
    req.on("timeout", () => {
      debug("port-prober", `HTTPS probe on port ${port} timed out`);
      req.destroy();
      resolve(null);
    });
    req.write(JSON.stringify({ wrapper_data: {} }));
    req.end();
  });
}
function probeHttp(port, timeout, csrfToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path: CONNECT_RPC_PATH,
      method: "POST",
      timeout,
      headers: {
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
        ...csrfToken ? { "X-Codeium-Csrf-Token": csrfToken } : {}
      }
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk.toString();
      });
      res.on("end", () => {
        if (data.toLowerCase().includes("client sent an http request to an https server")) {
          debug("port-prober", `HTTP probe on port ${port}: protocol mismatch response, rejecting`);
          resolve(null);
          return;
        }
        if (res.statusCode && VALID_CONNECT_STATUSES.has(res.statusCode)) {
          debug("port-prober", `HTTP Connect RPC probe on port ${port}: status ${res.statusCode} - valid connect port`);
          resolve({
            baseUrl: `http://127.0.0.1:${port}`,
            protocol: "http",
            port
          });
          return;
        }
        debug("port-prober", `HTTP probe on port ${port}: status ${res.statusCode} - not connect port`);
        resolve(null);
      });
    });
    req.on("error", (err) => {
      debug("port-prober", `HTTP probe on port ${port} failed: ${err.message}`);
      resolve(null);
    });
    req.on("timeout", () => {
      debug("port-prober", `HTTP probe on port ${port} timed out`);
      req.destroy();
      resolve(null);
    });
    req.write(JSON.stringify({ wrapper_data: {} }));
    req.end();
  });
}

// src/local/connect-client.ts
import https2 from "https";
import http2 from "http";
var ConnectClient = class {
  baseUrl;
  csrfToken;
  isHttps;
  constructor(baseUrl, csrfToken) {
    this.baseUrl = baseUrl;
    this.csrfToken = csrfToken;
    this.isHttps = baseUrl.startsWith("https://");
    debug("connect-client", `Initialized with baseUrl: ${baseUrl}, hasToken: ${!!csrfToken}`);
  }
  /**
   * Get user status including quota information
   * Uses Connect RPC protocol to communicate with Antigravity language server
   */
  async getUserStatus() {
    debug("connect-client", "Fetching user status via Connect RPC");
    const endpoint = "/exa.language_server_pb.LanguageServerService/GetUserStatus";
    try {
      const response = await this.request("POST", endpoint, {
        metadata: {
          ideName: "antigravity",
          extensionName: "antigravity",
          locale: "en"
        }
      });
      if (response) {
        debug("connect-client", `Got response from ${endpoint}`);
        return this.parseUserStatus(response);
      }
    } catch (err) {
      debug("connect-client", `Connect RPC call failed: ${err}`);
      throw new Error(`Failed to fetch user status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    throw new Error("Could not fetch user status from Connect RPC endpoint");
  }
  /**
   * Make an HTTP(S) request to the Connect API
   */
  request(method, path, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1"
      };
      if (this.csrfToken) {
        headers["X-Codeium-Csrf-Token"] = this.csrfToken;
      }
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers,
        timeout: 5e3,
        rejectUnauthorized: false
        // Allow self-signed certificates
      };
      const protocol = this.isHttps ? https2 : http2;
      const req = protocol.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch {
              resolve(data);
            }
          } else if (res.statusCode === 404) {
            reject(new Error(`Endpoint not found: ${path}`));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on("error", (err) => {
        reject(err);
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
  /**
   * Parse raw API response into ConnectUserStatus
   */
  parseUserStatus(response) {
    debug("connect-client", "Raw response:", JSON.stringify(response, null, 2));
    const status = {
      raw: response
    };
    if (typeof response !== "object" || response === null) {
      return status;
    }
    const data = response;
    const userStatus = data.userStatus || data;
    if ("email" in userStatus && typeof userStatus.email === "string") {
      status.email = userStatus.email;
    }
    if ("isAuthenticated" in userStatus) {
      status.isAuthenticated = Boolean(userStatus.isAuthenticated);
    }
    status.quota = this.extractQuota(userStatus);
    return status;
  }
  /**
   * Extract quota information from response
   */
  extractQuota(data) {
    const quota = {};
    const planStatus = data.planStatus;
    if (planStatus) {
      const available = planStatus.availablePromptCredits;
      const planInfo = planStatus.planInfo;
      const monthly = planInfo?.monthlyPromptCredits;
      if (typeof available === "number" && typeof monthly === "number") {
        const used = monthly - available;
        quota.promptCredits = {
          used,
          limit: monthly,
          remaining: available
        };
      }
    }
    const cascadeData = data.cascadeModelConfigData;
    const clientModelConfigs = cascadeData?.clientModelConfigs;
    if (Array.isArray(clientModelConfigs)) {
      quota.models = clientModelConfigs.map(this.parseModel.bind(this));
    }
    return quota;
  }
  /**
   * Parse a single model from the response
   */
  parseModel(model) {
    if (typeof model !== "object" || model === null) {
      return {
        modelId: "unknown",
        isExhausted: false
      };
    }
    const m = model;
    const modelOrAlias = m.modelOrAlias;
    const modelId = typeof modelOrAlias?.model === "string" ? modelOrAlias.model : "unknown";
    const quotaInfo = m.quotaInfo;
    const remainingFraction = typeof quotaInfo?.remainingFraction === "number" ? quotaInfo.remainingFraction : void 0;
    const resetTime = typeof quotaInfo?.resetTime === "string" ? quotaInfo.resetTime : void 0;
    return {
      modelId,
      displayName: typeof m.label === "string" ? m.label : void 0,
      label: typeof m.label === "string" ? m.label : void 0,
      quota: {
        remaining: void 0,
        limit: void 0,
        usedPercentage: remainingFraction !== void 0 ? 1 - remainingFraction : void 0,
        remainingPercentage: remainingFraction,
        resetTime,
        timeUntilResetMs: resetTime ? this.parseResetTime(resetTime) : void 0
      },
      isExhausted: remainingFraction === 0
    };
  }
  /**
   * Parse reset time to milliseconds until reset
   */
  parseResetTime(resetTime) {
    try {
      const resetDate = new Date(resetTime);
      const now = Date.now();
      const diff = resetDate.getTime() - now;
      return diff > 0 ? diff : void 0;
    } catch {
      return void 0;
    }
  }
};

// src/local/local-parser.ts
function parseLocalQuotaSnapshot(userStatus) {
  debug("local-parser", "Parsing local user status into QuotaSnapshot");
  const snapshot = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    method: "local",
    email: userStatus.email,
    models: []
  };
  if (userStatus.quota?.promptCredits) {
    snapshot.promptCredits = parsePromptCredits2(userStatus.quota.promptCredits);
  }
  if (userStatus.quota?.models) {
    snapshot.models = userStatus.quota.models.map(parseModelQuota);
  }
  debug("local-parser", `Parsed ${snapshot.models.length} models`);
  return snapshot;
}
function parsePromptCredits2(credits) {
  if (!credits) {
    return void 0;
  }
  const limit = credits.limit ?? 0;
  const remaining = credits.remaining ?? limit;
  const used = credits.used ?? limit - remaining;
  if (limit === 0) {
    return void 0;
  }
  const usedPercentage = limit > 0 ? used / limit : 0;
  const remainingPercentage = limit > 0 ? remaining / limit : 1;
  return {
    available: remaining,
    monthly: limit,
    usedPercentage,
    remainingPercentage
  };
}
function parseModelQuota(model) {
  const quota = model.quota;
  return {
    label: model.label || model.displayName || model.modelId,
    modelId: model.modelId,
    remainingPercentage: quota?.remainingPercentage,
    isExhausted: model.isExhausted ?? quota?.remainingPercentage === 0,
    resetTime: quota?.resetTime,
    timeUntilResetMs: quota?.timeUntilResetMs,
    isAutocompleteOnly: model.modelId.includes("gemini-2.5") || (model.label || "").includes("Gemini 2.5") || (model.displayName || "").includes("Gemini 2.5")
  };
}

// src/quota/service.ts
async function fetchQuota(method = "auto") {
  if (method === "auto") {
    try {
      debug("service", "Auto mode: trying local method first");
      return await fetchQuotaLocal();
    } catch (err) {
      debug("service", "Auto mode: local method failed", err);
      const tokenManager = getTokenManager();
      if (tokenManager.isLoggedIn()) {
        debug("service", "User is logged in, falling back to Google method");
        return fetchQuotaGoogle();
      }
      throw new NoAuthMethodAvailableError();
    }
  }
  if (method === "local") {
    return fetchQuotaLocal();
  }
  return fetchQuotaGoogle();
}
async function fetchQuotaGoogle() {
  debug("service", "Fetching quota from Google");
  const tokenManager = getTokenManager();
  const email = tokenManager.getEmail();
  const client = new CloudCodeClient(tokenManager);
  const codeAssistResponse = await client.loadCodeAssist();
  debug("service", "Code assist response received", JSON.stringify(codeAssistResponse));
  if (codeAssistResponse?.cloudaicompanionProject) {
    const projectId = extractProjectId(codeAssistResponse.cloudaicompanionProject);
    if (projectId) {
      tokenManager.setProjectId(projectId);
      debug("service", `Project ID saved: ${projectId}`);
    }
  }
  let modelsResponse = {};
  try {
    modelsResponse = await client.fetchAvailableModels();
    debug("service", "Models response received", JSON.stringify(modelsResponse));
  } catch (err) {
    debug("service", "Failed to fetch models (might need different permissions)", err);
  }
  const snapshot = parseQuotaSnapshot(codeAssistResponse, modelsResponse, email);
  debug("service", "Quota snapshot created");
  return snapshot;
}
async function fetchQuotaLocal() {
  debug("service", "Fetching quota from local Antigravity server");
  const processInfo = await detectAntigravityProcess();
  if (!processInfo) {
    throw new AntigravityNotRunningError();
  }
  debug("service", `Found Antigravity process: PID ${processInfo.pid}`);
  let ports = await discoverPorts(processInfo.pid);
  if (ports.length === 0 && processInfo.extensionServerPort) {
    debug("service", `Falling back to extension_server_port: ${processInfo.extensionServerPort}`);
    ports = [processInfo.extensionServerPort];
  }
  if (ports.length === 0) {
    throw new PortDetectionError();
  }
  debug("service", `Discovered ${ports.length} listening ports: ${ports.join(", ")}`);
  const probeResult = await probeForConnectAPI(ports, processInfo.csrfToken);
  if (!probeResult) {
    throw new LocalConnectionError("Could not find Antigravity Connect API on any port");
  }
  debug("service", `Found Connect API at ${probeResult.baseUrl}`);
  const client = new ConnectClient(probeResult.baseUrl, processInfo.csrfToken);
  const userStatus = await client.getUserStatus();
  debug("service", "User status received from local server");
  const snapshot = parseLocalQuotaSnapshot(userStatus);
  debug("service", "Local quota snapshot created");
  return snapshot;
}

// src/quota/format.ts
function formatTimeUntilReset(ms) {
  if (ms === void 0 || ms <= 0) return "N/A";
  const hours = Math.floor(ms / (1e3 * 60 * 60));
  const minutes = Math.floor(ms % (1e3 * 60 * 60) / (1e3 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
function getLimitColor(pct) {
  if (pct >= 75) {
    return { emoji: "\u{1F7E2}", ansi: "\x1B[32m" };
  }
  if (pct >= 50) {
    return { emoji: "\u{1F7E1}", ansi: "\x1B[33m" };
  }
  if (pct >= 25) {
    return { emoji: "\u{1F7E0}", ansi: "\x1B[38;5;208m" };
  }
  return { emoji: "\u{1F534}", ansi: "\x1B[31m" };
}
function drawProgressBar(percentage) {
  const width = 50;
  const filledChar = "\u2588";
  const emptyChar = "\u2591";
  if (percentage === void 0) {
    return `[\x1B[90m${emptyChar.repeat(width)}\x1B[0m]`;
  }
  const filledCount = Math.min(width, Math.max(0, Math.round(percentage / 100 * width)));
  const emptyCount = width - filledCount;
  const { ansi } = getLimitColor(percentage);
  return `[${ansi}${filledChar.repeat(filledCount)}\x1B[0m\x1B[90m${emptyChar.repeat(emptyCount)}\x1B[0m]`;
}
function extractGroupLimits(models) {
  let weekly = void 0;
  let fiveHour = void 0;
  const weeklyModel = models.find(
    (m) => m.modelId.toLowerCase().includes("weekly") || m.modelId.toLowerCase().includes("week") || m.timeUntilResetMs !== void 0 && m.timeUntilResetMs > 5.5 * 60 * 60 * 1e3
  );
  if (weeklyModel) {
    weekly = {
      remainingPercentage: weeklyModel.remainingPercentage,
      timeUntilResetMs: weeklyModel.timeUntilResetMs,
      isExhausted: weeklyModel.isExhausted
    };
  }
  const fiveHourModel = models.find(
    (m) => (m.timeUntilResetMs === void 0 || m.timeUntilResetMs <= 5.5 * 60 * 60 * 1e3) && (m.modelId.toLowerCase().includes("five") || m.modelId.toLowerCase().includes("5h") || m.modelId.toLowerCase().includes("hour") || m.modelId.toLowerCase().includes("daily") || m.modelId.toLowerCase().startsWith("chat_") || !m.modelId.toLowerCase().includes("weekly") && !m.modelId.toLowerCase().includes("week"))
  );
  if (fiveHourModel) {
    fiveHour = {
      remainingPercentage: fiveHourModel.remainingPercentage,
      timeUntilResetMs: fiveHourModel.timeUntilResetMs,
      isExhausted: fiveHourModel.isExhausted
    };
  }
  if (models.length > 0) {
    if (!weekly && !fiveHour) {
      fiveHour = {
        remainingPercentage: models[0].remainingPercentage,
        timeUntilResetMs: models[0].timeUntilResetMs,
        isExhausted: models[0].isExhausted
      };
    }
  }
  return { weekly, fiveHour };
}
function getLimitOrDefault(limit) {
  if (!limit) {
    return {
      percentage: 100,
      rawPercentage: 100,
      barText: `\x1B[32m100.00%\x1B[0m`,
      infoText: "\u{1F7E2} Quota available"
    };
  }
  const rawPercentage = limit.remainingPercentage !== void 0 ? limit.remainingPercentage * 100 : 100;
  const percentage = Math.round(rawPercentage * 100) / 100;
  const { emoji, ansi } = getLimitColor(percentage);
  if (limit.isExhausted || percentage === 0) {
    const timeText2 = limit.timeUntilResetMs ? ` \xB7 Refreshes in ${formatTimeUntilReset(limit.timeUntilResetMs)}` : "";
    return {
      percentage: 0,
      rawPercentage: 0,
      barText: `\x1B[31m0.00%\x1B[0m`,
      infoText: `\u{1F534} \x1B[31m\u274C EXHAUSTED${timeText2}\x1B[0m`
    };
  }
  if (percentage >= 99.99) {
    return {
      percentage: 100,
      rawPercentage: 100,
      barText: `\x1B[32m100.00%\x1B[0m`,
      infoText: "\u{1F7E2} Quota available"
    };
  }
  const roundedPct = Math.round(percentage);
  const timeText = limit.timeUntilResetMs ? ` \xB7 Refreshes in ${formatTimeUntilReset(limit.timeUntilResetMs)}` : "";
  return {
    percentage,
    rawPercentage,
    barText: `${ansi}${percentage.toFixed(2)}%\x1B[0m`,
    infoText: `${emoji} ${ansi}${roundedPct}% remaining\x1B[0m${timeText}`
  };
}
function printQuotaTable(snapshot, options = {}) {
  const email = snapshot.email || "Unknown";
  const geminiModels = snapshot.models.filter(
    (m) => m.label.toLowerCase().includes("gemini") || m.modelId.toLowerCase().includes("gemini")
  );
  const claudeGptModels = snapshot.models.filter(
    (m) => m.label.toLowerCase().includes("claude") || m.label.toLowerCase().includes("gpt") || m.modelId.toLowerCase().includes("claude") || m.modelId.toLowerCase().includes("gpt")
  );
  const geminiLimits = extractGroupLimits(geminiModels);
  const claudeGptLimits = extractGroupLimits(claudeGptModels);
  const gWeekly = getLimitOrDefault(geminiLimits.weekly);
  const gFiveHour = getLimitOrDefault(geminiLimits.fiveHour);
  const cWeekly = getLimitOrDefault(claudeGptLimits.weekly);
  const cFiveHour = getLimitOrDefault(claudeGptLimits.fiveHour);
  console.log();
  console.log(" Models & Quota");
  console.log();
  console.log(`  Account: ${email}`);
  console.log();
  console.log("GEMINI MODELS");
  console.log("  Models within this group: Gemini Flash, Gemini Pro");
  console.log();
  console.log("  Weekly Limit");
  console.log(`    ${drawProgressBar(gWeekly.rawPercentage)} ${gWeekly.barText}`);
  console.log(`    ${gWeekly.infoText}`);
  console.log();
  console.log("  Five Hour Limit");
  console.log(`    ${drawProgressBar(gFiveHour.rawPercentage)} ${gFiveHour.barText}`);
  console.log(`    ${gFiveHour.infoText}`);
  console.log();
  console.log();
  console.log("CLAUDE AND GPT MODELS");
  console.log("  Models within this group: Claude Opus, Claude Sonnet, GPT-OSS");
  console.log();
  console.log("  Weekly Limit");
  console.log(`    ${drawProgressBar(cWeekly.rawPercentage)} ${cWeekly.barText}`);
  console.log(`    ${cWeekly.infoText}`);
  console.log();
  console.log("  Five Hour Limit");
  console.log(`    ${drawProgressBar(cFiveHour.rawPercentage)} ${cFiveHour.barText}`);
  console.log(`    ${cFiveHour.infoText}`);
  console.log();
  console.log();
  console.log("  \u2502Within each group, models share a weekly limit and a 5-hour limit. Quota is");
  console.log("  \u2502consumed proportionally to the cost of the tokens. Thus, limits will last");
  console.log("  \u2502longer with shorter tasks or using more cost-effective models. The 5-hour");
  console.log("  \u2502limit smooths out aggregate demand to fairly distribute global capacity across");
  console.log("  \u2502all users, while your weekly limit is tied directly to your individual tier.");
  console.log();
}
function printQuotaJson(snapshot) {
  console.log(JSON.stringify(snapshot, null, 2));
}

// src/render/table.ts
import Table2 from "cli-table3";
function formatRelativeTime(isoDate) {
  if (!isoDate) return "Never";
  const date = new Date(isoDate);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / (1e3 * 60));
  const hours = Math.floor(diffMs / (1e3 * 60 * 60));
  const days = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
function formatStatus(status) {
  switch (status) {
    case "valid":
      return "\u2705";
    case "expired":
      return "\u26A0\uFE0F";
    case "invalid":
      return "\u274C";
    default:
      return "\u2753";
  }
}
function formatCredits(credits) {
  if (!credits) return "-";
  return `${credits.limit - credits.used} / ${credits.limit}`;
}
function renderAccountsTable(accounts) {
  if (accounts.length === 0) {
    console.log("\n\u{1F4ED} No accounts found.");
    console.log("\n\u{1F4A1} Run `agy-usage login` to add an account.\n");
    return;
  }
  console.log("\n\u{1F4CA} Antigravity Accounts");
  console.log("\u2550".repeat(60));
  const totalWidth = process.stdout.columns || 80;
  const isSmallTerminal = totalWidth < 90;
  const colWidths = isSmallTerminal ? [25, 8, 12, 12] : [30, 10, 15, 15];
  const finalColWidths = totalWidth < 60 ? void 0 : colWidths;
  const tableOptions = {
    head: ["Account", "Status", "Credits", "Last Used"],
    style: {
      head: ["cyan"],
      border: ["gray"]
    }
  };
  if (finalColWidths) {
    tableOptions.colWidths = finalColWidths;
  }
  const table = new Table2(tableOptions);
  for (const account of accounts) {
    const nameDisplay = account.isActive ? `${account.email} [*]` : account.email;
    table.push([
      nameDisplay,
      formatStatus(account.status),
      formatCredits(account.cachedCredits),
      formatRelativeTime(account.lastUsed)
    ]);
  }
  console.log(table.toString());
  console.log("\n[*] = active account\n");
}
function formatQuotaRemainingBar(remainingPercentage) {
  const width = 10;
  const filledChar = "\u2588";
  const emptyChar = "\u2591";
  if (remainingPercentage === void 0) {
    return `${emptyChar.repeat(width)} N/A`;
  }
  const filled = Math.round(remainingPercentage / 100 * width);
  const empty = width - filled;
  return `${filledChar.repeat(filled)}${emptyChar.repeat(empty)} ${Math.round(remainingPercentage)}%`;
}
function renderAllQuotaTable(results, options = {}) {
  if (results.length === 0) {
    console.log("\n\u{1F4ED} No accounts found.");
    console.log("\n\u{1F4A1} Run `agy-usage login` to add an account.\n");
    return;
  }
  const sortedResults = [...results].sort((a, b) => {
    if (a.status === "error" && b.status !== "error") return 1;
    if (a.status !== "error" && b.status === "error") return -1;
    if (a.status === "error" && b.status === "error") return 0;
    const getRemaining = (result) => {
      const models = options.allModels ? result.snapshot?.models : result.snapshot?.models?.filter((m) => !m.isAutocompleteOnly);
      const firstModel = models?.[0];
      if (!firstModel) return -1;
      if (firstModel.isExhausted) return 0;
      return firstModel.remainingPercentage ?? -1;
    };
    const aRemaining = getRemaining(a);
    const bRemaining = getRemaining(b);
    return bRemaining - aRemaining;
  });
  console.log("\n\u{1F4CA} Quota Overview - All Accounts");
  console.log("\u2550".repeat(70));
  const totalWidth = process.stdout.columns || 80;
  let colWidths;
  if (totalWidth < 80) {
    colWidths = void 0;
  } else if (totalWidth < 100) {
    colWidths = [25, 8, 12, 18];
  } else {
    colWidths = [30, 10, 15, 20];
  }
  const tableOptions = {
    head: ["Account", "Source", "Credits", "Quota Remaining"],
    style: {
      head: ["cyan"],
      border: ["gray"]
    }
  };
  if (colWidths) {
    tableOptions.colWidths = colWidths;
  }
  const table = new Table2(tableOptions);
  const errors = [];
  for (const result of sortedResults) {
    const nameDisplay = result.isActive ? `${result.email} [*]` : result.email;
    if (result.status === "error") {
      table.push([
        nameDisplay,
        "-",
        "-",
        result.error || "Error"
      ]);
      errors.push(`${result.email}: ${result.error}`);
    } else {
      const snapshot = result.snapshot;
      const source = result.status === "cached" ? `Cached (${formatCacheAge(result.cacheAge)})` : snapshot?.method.toUpperCase() || "-";
      let credits = "-";
      if (snapshot?.promptCredits) {
        const pc = snapshot.promptCredits;
        credits = `${pc.available} / ${pc.monthly}`;
      }
      let quotaRemaining = "-";
      const models = snapshot?.models || [];
      const relevantModels = options.allModels ? models : models.filter((m) => !m.isAutocompleteOnly);
      if (relevantModels.length > 0) {
        const percentages = relevantModels.filter((m) => m.remainingPercentage !== void 0).map((m) => m.remainingPercentage);
        if (percentages.length > 0) {
          const minRemaining = Math.min(...percentages);
          quotaRemaining = formatQuotaRemainingBar(minRemaining * 100);
        } else if (relevantModels.some((m) => m.isExhausted)) {
          quotaRemaining = "\u274C EXHAUSTED";
        } else {
          quotaRemaining = formatQuotaRemainingBar(void 0);
        }
      }
      table.push([
        nameDisplay,
        source,
        credits,
        quotaRemaining
      ]);
    }
  }
  console.log(table.toString());
  if (errors.length > 0) {
    console.log(`
\u26A0\uFE0F  ${errors.length} account(s) had errors:`);
    for (const err of errors) {
      console.log(`   - ${err}`);
    }
  }
  console.log("\n[*] = active account");
  console.log("\u{1F4A1} Use --refresh to fetch latest data\n");
}
function formatCacheAge(seconds) {
  if (seconds === void 0) return "?";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

// src/commands/quota.ts
async function fetchSingleAccountQuota(options) {
  const manager = getAccountManager();
  const accountEmail = options.account || manager.getActiveEmail();
  const originalActiveEmail = manager.getActiveEmail();
  let method = options.method || "auto";
  if (options.account && method !== "google") {
    debug("quota", `Account specified, forcing google method (local uses IDE account)`);
    method = "google";
  }
  if (method === "google") {
    const tokenManager = options.account ? getTokenManagerForAccount(options.account) : getTokenManager();
    if (!tokenManager.isLoggedIn()) {
      error("Not logged in. Run: agy-usage login");
      process.exit(1);
    }
  }
  try {
    let accountSwitched = false;
    if (options.account && options.account !== originalActiveEmail) {
      debug("quota", `Temporarily switching to account ${options.account} for fetch`);
      manager.setActiveAccount(options.account);
      accountSwitched = true;
    }
    try {
      debug("quota", `Fetching quota via ${method} method...`);
      const snapshot = await fetchQuota(method);
      if (accountEmail) {
        saveCache(accountEmail, snapshot);
      }
      if (options.json) {
        printQuotaJson(snapshot);
      } else {
        printQuotaTable(snapshot, { allModels: options.allModels });
      }
    } finally {
      if (accountSwitched && originalActiveEmail) {
        debug("quota", `Restoring active account to ${originalActiveEmail}`);
        manager.setActiveAccount(originalActiveEmail);
      }
    }
  } catch (err) {
    handleQuotaError(err);
  }
}
async function fetchAllAccountsQuota(options) {
  const manager = getAccountManager();
  const emails = manager.getAccountEmails();
  const activeEmail = manager.getActiveEmail();
  if (emails.length === 0) {
    error("No accounts found. Run: agy-usage login");
    process.exit(1);
  }
  if (options.refresh) {
    info("\u{1F504} Refreshing quota data for all accounts...\n");
  }
  const results = [];
  for (const email of emails) {
    const isActive = email === activeEmail;
    try {
      if (!options.refresh && isCacheValid(email)) {
        const cached = loadCache(email);
        if (cached) {
          debug("quota", `Using cached data for ${email}`);
          results.push({
            email,
            isActive,
            status: "cached",
            snapshot: cached,
            cacheAge: getCacheAge(email) || 0
          });
          continue;
        }
      }
      debug("quota", `Fetching fresh data for ${email}`);
      const snapshot = await fetchQuotaForAccount(email, options.method || "auto");
      saveCache(email, snapshot);
      results.push({
        email,
        isActive,
        status: "success",
        snapshot
      });
    } catch (err) {
      debug("quota", `Error fetching quota for ${email}:`, err);
      const cached = loadCache(email);
      if (cached) {
        results.push({
          email,
          isActive,
          status: "cached",
          snapshot: cached,
          cacheAge: getCacheAge(email) || 0
        });
      } else {
        results.push({
          email,
          isActive,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }
  }
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    renderAllQuotaTable(results, { allModels: options.allModels });
  }
}
async function fetchQuotaForAccount(email, method) {
  const manager = getAccountManager();
  const originalActiveEmail = manager.getActiveEmail();
  let effectiveMethod = method;
  if (method === "auto" || method === "local") {
    effectiveMethod = "google";
    debug("quota", `Forcing Google API for multi-account fetch (email: ${email})`);
  }
  let accountSwitched = false;
  if (email !== originalActiveEmail) {
    debug("quota", `Switching to ${email} for fetch`);
    manager.setActiveAccount(email);
    resetTokenManager();
    accountSwitched = true;
  }
  try {
    const snapshot = await fetchQuota(effectiveMethod);
    return snapshot;
  } finally {
    if (accountSwitched && originalActiveEmail) {
      debug("quota", `Restoring active account to ${originalActiveEmail}`);
      manager.setActiveAccount(originalActiveEmail);
      resetTokenManager();
    }
  }
}
function handleQuotaError(err) {
  if (err instanceof NoAuthMethodAvailableError) {
    error(err.message);
    process.exit(1);
  }
  if (err instanceof AntigravityNotRunningError) {
    error(err.message);
    console.log("\nTip: Make sure Antigravity is running in your IDE (VSCode, etc.)");
    process.exit(1);
  }
  if (err instanceof LocalConnectionError) {
    error(err.message);
    console.log("\nTip: Try restarting your IDE or the Antigravity extension.");
    process.exit(1);
  }
  if (err instanceof PortDetectionError) {
    error(err.message);
    console.log("\nTip: This may happen if the Antigravity language server is still starting up.");
    process.exit(1);
  }
  if (err instanceof NotLoggedInError) {
    error(err.message);
    process.exit(1);
  }
  if (err instanceof AuthenticationError) {
    error(err.message);
    process.exit(1);
  }
  if (err instanceof NetworkError) {
    error(err.message);
    process.exit(1);
  }
  if (err instanceof RateLimitError) {
    error(err.message);
    if (err.retryAfterMs) {
      const seconds = Math.ceil(err.retryAfterMs / 1e3);
      console.log(`Retry after ${seconds} seconds.`);
    }
    process.exit(1);
  }
  if (err instanceof APIError) {
    error(err.message);
    process.exit(1);
  }
  error(`Failed to fetch quota: ${err instanceof Error ? err.message : "Unknown error"}`);
  debug("quota", "Error details", err);
  process.exit(1);
}
async function quotaCommand(options) {
  if (options.all) {
    await fetchAllAccountsQuota(options);
  } else {
    await fetchSingleAccountQuota(options);
  }
}

// src/commands/doctor.ts
function doctorCommand() {
  console.log();
  console.log("\u{1FA7A} Antigravity Usage - Diagnostics");
  console.log("\u2550".repeat(50));
  console.log();
  console.log("\u{1F4E6} Version");
  console.log("\u2500".repeat(40));
  console.log(`  CLI version: ${version}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${getPlatform()}`);
  console.log();
  const storage = getStorageInfo();
  console.log("\u{1F4C1} Configuration");
  console.log("\u2500".repeat(40));
  console.log(`  Config dir: ${storage.configDir}`);
  console.log(`  Tokens file: ${storage.tokensPath}`);
  console.log(`  Tokens exist: ${storage.exists ? "Yes" : "No"}`);
  console.log();
  const tokenManager = getTokenManager();
  console.log("\u{1F510} Authentication");
  console.log("\u2500".repeat(40));
  if (!tokenManager.isLoggedIn()) {
    console.log("  Status: Not logged in");
    console.log();
    console.log("  \u{1F4A1} Run `agy-usage login` to authenticate.");
  } else {
    console.log("  Status: Logged in");
    const email = tokenManager.getEmail();
    if (email) {
      console.log(`  Email: ${maskEmail(email)}`);
    }
    const expiresAt = tokenManager.getExpiresAt();
    if (expiresAt) {
      const isExpired = tokenManager.isTokenExpired();
      console.log(`  Token expires: ${expiresAt.toLocaleString()}`);
      console.log(`  Token valid: ${isExpired ? "No (needs refresh)" : "Yes"}`);
    }
  }
  console.log();
  console.log("\u{1F527} OAuth Configuration");
  console.log("\u2500".repeat(40));
  const hasClientId = !!process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
  const hasClientSecret = !!process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;
  if (hasClientId || hasClientSecret) {
    console.log("  Using custom OAuth credentials:");
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_ID: ${hasClientId ? "Set" : "Not set"}`);
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_SECRET: ${hasClientSecret ? "Set" : "Not set"}`);
  } else {
    console.log("  \u2705 Using built-in OAuth credentials");
    console.log("  \u{1F4A1} Set ANTIGRAVITY_OAUTH_CLIENT_ID and ANTIGRAVITY_OAUTH_CLIENT_SECRET");
    console.log("     environment variables to use custom credentials.");
  }
  console.log();
}

// src/commands/accounts.ts
function listAccountsCommand(options) {
  const manager = getAccountManager();
  const summaries = manager.getAccountSummaries();
  renderAccountsTable(summaries);
  if (options.refresh) {
    info("Use `agy-usage quota --all --refresh` to fetch fresh quota data.");
  }
}
async function addAccountCommand() {
  info("Adding a new account...");
  const result = await startOAuthFlow();
  if (result.success) {
    success(`Account added successfully${result.email ? `: ${result.email}` : ""}!`);
    const manager = getAccountManager();
    const summaries = manager.getAccountSummaries();
    console.log("\nYour accounts:");
    renderAccountsTable(summaries);
  } else {
    error(`Failed to add account: ${result.error}`);
    process.exit(1);
  }
}
function switchAccountCommand(email) {
  const manager = getAccountManager();
  if (!manager.hasAccount(email)) {
    error(`Account '${email}' not found.`);
    const emails = manager.getAccountEmails();
    if (emails.length > 0) {
      console.log("\nAvailable accounts:");
      for (const e of emails) {
        console.log(`  - ${e}`);
      }
    } else {
      info("\nNo accounts found. Run `agy-usage login` to add one.");
    }
    process.exit(1);
  }
  const switched = manager.setActiveAccount(email);
  if (switched) {
    success(`Switched to account: ${email}`);
  } else {
    error(`Failed to switch to account: ${email}`);
    process.exit(1);
  }
}
function removeAccountCommand(email, options) {
  const manager = getAccountManager();
  if (!manager.hasAccount(email)) {
    error(`Account '${email}' not found.`);
    process.exit(1);
  }
  if (!options.force) {
    warn(`This will remove account '${email}' and all its data.`);
    info("Use --force to skip this warning.");
  }
  const removed = manager.removeAccount(email);
  if (removed) {
    success(`Account '${email}' removed.`);
    const remaining = manager.getAccountEmails();
    if (remaining.length > 0) {
      const active = manager.getActiveEmail();
      console.log(`
Active account: ${active || "none"}`);
      console.log(`Remaining accounts: ${remaining.length}`);
    } else {
      info("\nNo accounts remaining. Run `agy-usage login` to add one.");
    }
  } else {
    error(`Failed to remove account: ${email}`);
    process.exit(1);
  }
}
function currentAccountCommand() {
  const manager = getAccountManager();
  const active = manager.getActiveEmail();
  if (active) {
    console.log();
    console.log(`\u{1F4CD} Active account: ${active}`);
    const info2 = manager.getAccountInfo(active);
    if (info2) {
      const statusIcon = info2.status === "valid" ? "\u2705" : info2.status === "expired" ? "\u26A0\uFE0F" : "\u274C";
      console.log(`   Status: ${statusIcon} ${info2.status}`);
      if (info2.tokens?.expiresAt) {
        const expiresAt = new Date(info2.tokens.expiresAt).toLocaleString();
        console.log(`   Token expires: ${expiresAt}`);
      }
    }
    console.log();
  } else {
    warn("No active account set.");
    const emails = manager.getAccountEmails();
    if (emails.length > 0) {
      console.log("\nAvailable accounts:");
      for (const e of emails) {
        console.log(`  - ${e}`);
      }
      info("\nRun `agy-usage accounts switch <email>` to set an active account.");
    } else {
      info("\nRun `agy-usage login` to add an account.");
    }
  }
}
async function refreshAccountCommand(email, options) {
  const manager = getAccountManager();
  if (options.all) {
    const emails = manager.getAccountEmails();
    if (emails.length === 0) {
      warn("No accounts to refresh.");
      return;
    }
    console.log(`
\u{1F504} Refreshing ${emails.length} account(s)...
`);
    let successCount = 0;
    let failCount = 0;
    for (const e of emails) {
      try {
        const tokenManager = getTokenManagerForAccount(e);
        if (tokenManager.isTokenExpired()) {
          await tokenManager.refreshToken();
          success(`  \u2705 ${e}`);
          successCount++;
        } else {
          info(`  \u23ED\uFE0F  ${e} (token still valid)`);
          successCount++;
        }
      } catch (err) {
        error(`  \u274C ${e}: ${err instanceof Error ? err.message : "Failed"}`);
        failCount++;
      }
    }
    resetTokenManager();
    console.log();
    if (failCount > 0) {
      warn(`${failCount} account(s) need re-authentication. Run: agy-usage login`);
    } else {
      success(`All ${successCount} account(s) refreshed successfully!`);
    }
    return;
  }
  const targetEmail = email || manager.getActiveEmail();
  if (!targetEmail) {
    error("No account specified and no active account.");
    info("Usage: agy-usage accounts refresh <email>");
    info("   or: agy-usage accounts refresh --all");
    process.exit(1);
  }
  if (!manager.hasAccount(targetEmail)) {
    error(`Account '${targetEmail}' not found.`);
    process.exit(1);
  }
  console.log(`
\u{1F504} Refreshing ${targetEmail}...`);
  try {
    const tokenManager = getTokenManagerForAccount(targetEmail);
    if (!tokenManager.isTokenExpired()) {
      info(`Token for ${targetEmail} is still valid.`);
      return;
    }
    await tokenManager.refreshToken();
    resetTokenManager();
    success(`
\u2705 Token refreshed for ${targetEmail}`);
  } catch (err) {
    error(`
\u274C Failed to refresh token: ${err instanceof Error ? err.message : "Unknown error"}`);
    info("\nThe refresh token may be expired. Please re-authenticate:");
    info(`  agy-usage accounts switch ${targetEmail}`);
    info("  agy-usage login");
    process.exit(1);
  }
}
async function accountsCommand(subcommand, args, options) {
  switch (subcommand) {
    case "list":
      listAccountsCommand({ refresh: options.refresh });
      break;
    case "add":
      await addAccountCommand();
      break;
    case "switch":
      if (!args[0]) {
        error("Please specify an account email to switch to.");
        console.log("Usage: agy-usage accounts switch <email>");
        process.exit(1);
      }
      switchAccountCommand(args[0]);
      break;
    case "remove":
      if (!args[0]) {
        error("Please specify an account email to remove.");
        console.log("Usage: agy-usage accounts remove <email>");
        process.exit(1);
      }
      removeAccountCommand(args[0], { force: options.force });
      break;
    case "current":
      currentAccountCommand();
      break;
    case "refresh":
      await refreshAccountCommand(args[0], { all: options.all });
      break;
    default:
      listAccountsCommand({ refresh: options.refresh });
  }
}

// src/commands/wakeup.ts
import inquirer2 from "inquirer";
import Table3 from "cli-table3";

// src/wakeup/types.ts
function getDefaultConfig() {
  return {
    enabled: false,
    selectedModels: ["claude-sonnet-4-5", "gemini-3-flash", "gemini-3-pro-low"],
    selectedAccounts: void 0,
    customPrompt: void 0,
    maxOutputTokens: 1,
    // Minimal tokens to save quota
    scheduleMode: "interval",
    intervalHours: 6,
    dailyTimes: ["09:00"],
    weeklySchedule: {},
    cronExpression: void 0,
    wakeOnReset: false,
    resetCooldownMinutes: 10
  };
}

// src/wakeup/storage.ts
import { join as join4 } from "path";
import { readFileSync as readFileSync5, writeFileSync as writeFileSync4, existsSync as existsSync5, mkdirSync as mkdirSync4 } from "fs";
var WAKEUP_DIR_NAME = "wakeup";
var CONFIG_FILE_NAME = "config.json";
var HISTORY_FILE_NAME = "history.json";
var MAX_HISTORY_ENTRIES = 100;
function getWakeupDir() {
  return join4(getConfigDir(), WAKEUP_DIR_NAME);
}
function ensureWakeupDir() {
  const dir = getWakeupDir();
  if (!existsSync5(dir)) {
    mkdirSync4(dir, { recursive: true });
    debug("wakeup-storage", `Created wakeup directory: ${dir}`);
  }
}
function readJsonFile(filename, defaultValue) {
  const filepath = join4(getWakeupDir(), filename);
  try {
    if (existsSync5(filepath)) {
      const content = readFileSync5(filepath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    debug("wakeup-storage", `Error reading ${filename}:`, err);
  }
  return defaultValue;
}
function writeJsonFile(filename, data) {
  ensureWakeupDir();
  const filepath = join4(getWakeupDir(), filename);
  try {
    writeFileSync4(filepath, JSON.stringify(data, null, 2), "utf-8");
    debug("wakeup-storage", `Wrote ${filename}`);
  } catch (err) {
    debug("wakeup-storage", `Error writing ${filename}:`, err);
    throw err;
  }
}
function loadWakeupConfig() {
  const config = readJsonFile(CONFIG_FILE_NAME, null);
  if (config) {
    debug("wakeup-storage", "Loaded wakeup config");
  }
  return config;
}
function saveWakeupConfig(config) {
  writeJsonFile(CONFIG_FILE_NAME, config);
  debug("wakeup-storage", "Saved wakeup config");
}
function getOrCreateConfig() {
  const existing = loadWakeupConfig();
  if (existing) {
    if (!existing.selectedModels || existing.selectedModels.length === 0) {
      existing.selectedModels = ["claude-sonnet-4-5", "gemini-3-flash", "gemini-3-pro-low"];
      saveWakeupConfig(existing);
      debug("wakeup-storage", "Migrated config to new default models");
    }
    return existing;
  }
  const defaultConfig = getDefaultConfig();
  saveWakeupConfig(defaultConfig);
  return defaultConfig;
}
function loadTriggerHistory() {
  return readJsonFile(HISTORY_FILE_NAME, []);
}
function saveTriggerHistory(history) {
  writeJsonFile(HISTORY_FILE_NAME, history);
}
function addTriggerRecord(record) {
  const history = loadTriggerHistory();
  history.unshift(record);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.splice(MAX_HISTORY_ENTRIES);
  }
  saveTriggerHistory(history);
  debug("wakeup-storage", `Added trigger record (total: ${history.length})`);
}
function getRecentHistory(limit = 10) {
  const history = loadTriggerHistory();
  return history.slice(0, limit);
}
function getLastTrigger() {
  const history = loadTriggerHistory();
  return history.length > 0 ? history[0] : null;
}

// src/wakeup/account-resolver.ts
function resolveAccounts(selectedAccounts) {
  const accountManager = getAccountManager();
  if (selectedAccounts !== void 0) {
    debug("account-resolver", `Explicit account selection: ${selectedAccounts.length} accounts`);
    const validAccounts = selectedAccounts.filter((email) => {
      if (!accountManager.hasAccount(email)) {
        debug("account-resolver", `Account ${email} not found, skipping`);
        return false;
      }
      const status = accountManager.getAccountStatus(email);
      if (status === "invalid") {
        debug("account-resolver", `Account ${email} is invalid, skipping`);
        return false;
      }
      return true;
    });
    debug("account-resolver", `Resolved ${validAccounts.length} valid accounts from selection`);
    return validAccounts;
  }
  debug("account-resolver", "No explicit selection, using fallback logic");
  const activeEmail = accountManager.getActiveEmail();
  if (activeEmail) {
    const status = accountManager.getAccountStatus(activeEmail);
    if (status === "valid" || status === "expired") {
      debug("account-resolver", `Using active account: ${activeEmail}`);
      return [activeEmail];
    }
    debug("account-resolver", `Active account ${activeEmail} is ${status}, trying fallback`);
  }
  const allEmails = accountManager.getAccountEmails();
  for (const email of allEmails) {
    const status = accountManager.getAccountStatus(email);
    if (status === "valid" || status === "expired") {
      debug("account-resolver", `Fallback to first valid account: ${email}`);
      return [email];
    }
  }
  debug("account-resolver", "No valid accounts found");
  return [];
}
function getAccountResolutionStatus(selectedAccounts) {
  const resolved = resolveAccounts(selectedAccounts);
  if (resolved.length === 0) {
    if (selectedAccounts !== void 0 && selectedAccounts.length > 0) {
      return "Selected accounts are invalid or not found";
    }
    return "No valid accounts available";
  }
  if (resolved.length === 1) {
    return `Using account: ${resolved[0]}`;
  }
  return `Using ${resolved.length} accounts: ${resolved.join(", ")}`;
}

// src/wakeup/schedule-converter.ts
function configToCronExpression(config) {
  if (config.cronExpression) {
    return config.cronExpression;
  }
  switch (config.scheduleMode) {
    case "interval":
      return intervalToCron(config.intervalHours || 6);
    case "daily":
      return dailyToCron(config.dailyTimes || ["09:00"]);
    case "weekly":
      return weeklyToCron(config.weeklySchedule || {});
    case "custom":
      return "0 */6 * * *";
    default:
      throw new Error(`Unknown schedule mode: ${config.scheduleMode}`);
  }
}
function intervalToCron(hours) {
  if (hours < 1 || hours > 23) {
    throw new Error("Interval hours must be between 1 and 23");
  }
  return `0 */${hours} * * *`;
}
function dailyToCron(times) {
  if (times.length === 0) {
    throw new Error("Daily mode requires at least one time");
  }
  const parsedTimes = times.map(parseTime);
  const [firstHour, firstMinute] = parsedTimes[0];
  const hours = parsedTimes.map(([h]) => h);
  const allSameMinute = parsedTimes.every(([, m]) => m === firstMinute);
  if (allSameMinute) {
    return `${firstMinute} ${hours.join(",")} * * *`;
  }
  return `${firstMinute} ${firstHour} * * *`;
}
function weeklyToCron(schedule) {
  const days = Object.keys(schedule).map(Number).sort();
  if (days.length === 0) {
    throw new Error("Weekly mode requires at least one day");
  }
  const firstDay = days[0];
  const firstDayTimes = schedule[firstDay];
  if (!firstDayTimes || firstDayTimes.length === 0) {
    throw new Error(`No times specified for day ${firstDay}`);
  }
  const [hour, minute] = parseTime(firstDayTimes[0]);
  const daysStr = days.join(",");
  return `${minute} ${hour} * * ${daysStr}`;
}
function parseTime(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM`);
  }
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time values: ${timeStr}`);
  }
  return [hour, minute];
}
function getScheduleDescription(config) {
  if (!config.enabled) {
    return "Disabled";
  }
  if (config.wakeOnReset) {
    const cooldown = config.resetCooldownMinutes || 10;
    return `Quota-reset based (${cooldown}min cooldown)`;
  }
  switch (config.scheduleMode) {
    case "interval":
      const hours = config.intervalHours || 6;
      return `Every ${hours} hour${hours > 1 ? "s" : ""}`;
    case "daily":
      const times = config.dailyTimes || ["09:00"];
      if (times.length === 1) {
        return `Daily at ${times[0]}`;
      }
      return `Daily at ${times.join(", ")}`;
    case "weekly":
      const days = Object.keys(config.weeklySchedule || {}).map(Number);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayList = days.map((d) => dayNames[d]).join(", ");
      return `Weekly on ${dayList}`;
    case "custom":
      return `Custom: ${config.cronExpression || "Not set"}`;
    default:
      return "Unknown schedule";
  }
}
function getNextRunEstimate(cronExpression) {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return "Invalid cron";
    }
    const [minute, hour, day, month, weekday] = parts;
    if (hour.startsWith("*/")) {
      const interval = parseInt(hour.substring(2), 10);
      return `Every ${interval} hour${interval > 1 ? "s" : ""}`;
    }
    if (day === "*" && month === "*" && weekday === "*") {
      const displayHour = hour.includes(",") ? hour.split(",")[0] : hour;
      return `Daily at ${displayHour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }
    if (weekday !== "*") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayNums = weekday.split(",").map(Number);
      const dayList = dayNums.map((d) => dayNames[d] || d).join(", ");
      return `${dayList} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }
    return cronExpression;
  } catch {
    return cronExpression;
  }
}

// src/wakeup/cron-installer.ts
import { execSync, exec as exec3 } from "child_process";
import { promisify as promisify3 } from "util";
var execAsync3 = promisify3(exec3);
var CRON_COMMENT_MARKER = "agy-usage-wakeup";
var OLD_CRON_COMMENT_MARKER = "agy-usage-wakeup";
function getBinDirectories() {
  const dirs = /* @__PURE__ */ new Set();
  try {
    const nodePath = process.execPath;
    const nodeDir = nodePath.substring(0, nodePath.lastIndexOf("/"));
    if (nodeDir) {
      dirs.add(nodeDir);
      debug("cron-installer", `Found node bin dir: ${nodeDir}`);
    }
  } catch {
    debug("cron-installer", "Could not determine node bin directory");
  }
  try {
    const npmBin = execSync("npm bin -g", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    if (npmBin) {
      dirs.add(npmBin);
      debug("cron-installer", `Found npm bin dir: ${npmBin}`);
    }
  } catch {
    debug("cron-installer", "Could not determine npm bin directory");
  }
  if (process.env.PATH) {
    const userPaths = process.env.PATH.split(":").filter((p) => {
      return p.includes("node") || p.includes("npm") || p.includes("nvm") || p.includes(".local") || p === "/usr/local/bin" || p === "/opt/homebrew/bin";
    });
    userPaths.forEach((p) => {
      if (p) {
        dirs.add(p);
        debug("cron-installer", `Added user PATH: ${p}`);
      }
    });
  }
  dirs.add("/usr/local/bin");
  dirs.add("/usr/bin");
  dirs.add("/bin");
  dirs.add("/opt/homebrew/bin");
  return Array.from(dirs);
}
async function loadCrontab() {
  try {
    const { stdout } = await execAsync3('crontab -l 2>/dev/null || echo ""');
    const lines = stdout.split("\n").filter((line) => line.trim());
    debug("cron-installer", `Loaded ${lines.length} crontab entries`);
    return lines;
  } catch {
    debug("cron-installer", "No existing crontab or error loading");
    return [];
  }
}
async function saveCrontab(lines) {
  const content = lines.join("\n") + "\n";
  try {
    const { exec: execCallback } = await import("child_process");
    await new Promise((resolve, reject) => {
      const proc = execCallback("crontab -", (err) => {
        if (err) reject(err);
        else resolve();
      });
      proc.stdin?.write(content);
      proc.stdin?.end();
    });
    debug("cron-installer", "Saved crontab successfully");
  } catch (err) {
    debug("cron-installer", "Error saving crontab:", err);
    throw err;
  }
}
function removeWakeupEntries(lines) {
  return lines.filter(
    (line) => !line.includes(CRON_COMMENT_MARKER) && !line.includes(OLD_CRON_COMMENT_MARKER) && !line.includes("agy-usage wakeup trigger")
  );
}
function isCronSupported() {
  return process.platform === "darwin" || process.platform === "linux";
}
async function installCronJob(cronExpression) {
  if (!isCronSupported()) {
    return {
      success: false,
      error: `Cron is not supported on ${process.platform}. Windows Task Scheduler support coming soon.`,
      manualInstructions: getWindowsInstructions(cronExpression)
    };
  }
  try {
    const binDirs = getBinDirectories();
    const pathValue = binDirs.join(":");
    const lines = await loadCrontab();
    const filteredLines = removeWakeupEntries(lines);
    const hasPath = filteredLines.some((line) => line.startsWith("PATH="));
    if (!hasPath) {
      filteredLines.unshift(`PATH=${pathValue}`);
    }
    const cronLine = `${cronExpression} agy-usage wakeup trigger --scheduled # ${CRON_COMMENT_MARKER}`;
    filteredLines.push(cronLine);
    await saveCrontab(filteredLines);
    debug("cron-installer", `Installed cron job: ${cronLine}`);
    debug("cron-installer", `Using PATH: ${pathValue}`);
    return {
      success: true,
      cronExpression
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    debug("cron-installer", `Failed to install cron job: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
      manualInstructions: getManualInstructions(cronExpression)
    };
  }
}
async function uninstallCronJob() {
  if (!isCronSupported()) {
    debug("cron-installer", "Cron not supported on this platform");
    return false;
  }
  try {
    const lines = await loadCrontab();
    const filteredLines = removeWakeupEntries(lines);
    if (filteredLines.length === lines.length) {
      debug("cron-installer", "No cron job found to uninstall");
      return true;
    }
    await saveCrontab(filteredLines);
    debug("cron-installer", "Uninstalled cron job successfully");
    return true;
  } catch (err) {
    debug("cron-installer", "Failed to uninstall cron job:", err);
    return false;
  }
}
async function getCronStatus() {
  if (!isCronSupported()) {
    return { installed: false };
  }
  try {
    const lines = await loadCrontab();
    const cronLine = lines.find((line) => line.includes(CRON_COMMENT_MARKER));
    if (!cronLine) {
      return { installed: false };
    }
    const parts = cronLine.trim().split(/\s+/);
    const cronExpression = parts.slice(0, 5).join(" ");
    return {
      installed: true,
      cronExpression,
      nextRun: getNextRunDescription(cronExpression)
    };
  } catch {
    return { installed: false };
  }
}
function getManualInstructions(cronExpression) {
  const binDirs = getBinDirectories();
  const pathValue = binDirs.join(":");
  return `
Failed to automatically install cron job. Please add manually:
 
1. Open terminal and run: crontab -e

2. Add these lines:
   PATH=${pathValue}
   ${cronExpression} agy-usage wakeup trigger --scheduled # ${CRON_COMMENT_MARKER}

3. Save and exit the editor

To verify, run: crontab -l
`.trim();
}
function getWindowsInstructions(cronExpression) {
  return `
Windows Task Scheduler support is not yet available.

To set up manually using Task Scheduler:

1. Open Task Scheduler (taskschd.msc)
2. Create a new Basic Task
3. Set trigger: Based on your schedule (${cronExpression})
4. Set action: Start a program
   - Program: agy-usage
   - Arguments: wakeup trigger --scheduled
5. Save the task

Alternatively, use Windows Subsystem for Linux (WSL) with cron.
`.trim();
}
function getNextRunDescription(cronExpression) {
  try {
    const parts = cronExpression.split(/\s+/);
    if (parts.length !== 5) return "Unknown";
    const [minute, hour] = parts;
    if (hour.startsWith("*/")) {
      const hours = parseInt(hour.substring(2), 10);
      const now2 = /* @__PURE__ */ new Date();
      const currentHour = now2.getHours();
      const nextHour = Math.ceil((currentHour + 1) / hours) * hours;
      const isToday = nextHour < 24;
      return isToday ? `Today around ${nextHour}:00` : "Tomorrow";
    }
    const hourNum = parseInt(hour.split(",")[0], 10);
    const minuteNum = parseInt(minute, 10);
    const now = /* @__PURE__ */ new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = hourNum * 60 + minuteNum;
    if (targetMinutes > currentMinutes) {
      return `Today at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }
    return `Tomorrow at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  } catch {
    return "Unknown";
  }
}

// src/wakeup/trigger-service.ts
var DEFAULT_PROMPT = "hi";
var REQUEST_TIMEOUT_MS = 3e4;
var MAX_CONCURRENT_REQUESTS = 4;
async function executeTrigger(options) {
  const {
    models,
    accountEmail,
    triggerType,
    triggerSource,
    customPrompt,
    maxOutputTokens
  } = options;
  debug("trigger-service", `Executing trigger for ${models.length} models with account ${accountEmail}`);
  if (models.length === 0) {
    debug("trigger-service", "No models to trigger");
    return { success: true, results: [] };
  }
  let tokenManager;
  try {
    tokenManager = getTokenManagerForAccount(accountEmail);
  } catch (err) {
    debug("trigger-service", `Failed to get token manager for ${accountEmail}:`, err);
    const results2 = models.map((modelId) => ({
      modelId,
      success: false,
      durationMs: 0,
      error: `Failed to get credentials for ${accountEmail}`
    }));
    recordResults(results2, options);
    return { success: false, results: results2 };
  }
  try {
    await tokenManager.getValidAccessToken();
  } catch (err) {
    let errorMessage = `Authentication failed for ${accountEmail}`;
    if (err && typeof err === "object" && "getDetailedMessage" in err) {
      errorMessage = err.getDetailedMessage();
    } else if (err instanceof Error) {
      errorMessage = `Token refresh failed: ${err.message}`;
    }
    debug("trigger-service", `Failed to refresh token for ${accountEmail}:`, err);
    const results2 = models.map((modelId) => ({
      modelId,
      success: false,
      durationMs: 0,
      error: errorMessage
    }));
    recordResults(results2, options);
    return { success: false, results: results2 };
  }
  const client = new CloudCodeClient(tokenManager);
  debug("trigger-service", `Account ${accountEmail} projectId from tokenManager: ${tokenManager.getProjectId()}`);
  try {
    const projectId = await client.resolveProjectId();
    if (projectId) {
      debug("trigger-service", `Project ID resolved: ${projectId}`);
      tokenManager.setProjectId(projectId);
    } else {
      debug("trigger-service", "WARNING: Could not resolve project ID");
    }
  } catch (err) {
    debug("trigger-service", "Failed to resolve project ID:", err);
  }
  const userPrompt = customPrompt || DEFAULT_PROMPT;
  const results = [];
  for (let i = 0; i < models.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = models.slice(i, i + MAX_CONCURRENT_REQUESTS);
    debug("trigger-service", `Processing batch ${i / MAX_CONCURRENT_REQUESTS + 1}: ${batch.join(", ")}`);
    const batchResults = await Promise.all(
      batch.map((modelId) => triggerSingleModel(client, modelId, userPrompt, maxOutputTokens))
    );
    results.push(...batchResults);
  }
  recordResults(results, options);
  const allSuccess = results.every((r) => r.success);
  const successCount = results.filter((r) => r.success).length;
  debug("trigger-service", `Trigger complete: ${successCount}/${results.length} succeeded`);
  return { success: allSuccess, results };
}
async function triggerSingleModel(client, modelId, prompt, maxTokens) {
  const startTime = Date.now();
  debug("trigger-service", `Triggering model: ${modelId}`);
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), REQUEST_TIMEOUT_MS);
    });
    const response = await Promise.race([
      client.generateContent(modelId, prompt, maxTokens),
      timeoutPromise
    ]);
    const durationMs = Date.now() - startTime;
    debug("trigger-service", `Model ${modelId} responded in ${durationMs}ms`);
    return {
      modelId,
      success: true,
      durationMs,
      response: response.text.substring(0, 500),
      // Truncate to 500 chars
      tokensUsed: response.tokensUsed
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    debug("trigger-service", `Model ${modelId} failed after ${durationMs}ms: ${errorMessage}`);
    return {
      modelId,
      success: false,
      durationMs,
      error: errorMessage
    };
  }
}
function recordResults(results, options) {
  const { triggerType, triggerSource, accountEmail, customPrompt } = options;
  const prompt = customPrompt || DEFAULT_PROMPT;
  for (const result of results) {
    const record = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      success: result.success,
      triggerType,
      triggerSource,
      models: [result.modelId],
      accountEmail,
      durationMs: result.durationMs,
      prompt,
      response: result.response,
      error: result.error,
      tokensUsed: result.tokensUsed
    };
    addTriggerRecord(record);
  }
}
async function testTrigger(modelId, accountEmail, prompt) {
  const result = await executeTrigger({
    models: [modelId],
    accountEmail,
    triggerType: "manual",
    triggerSource: "manual",
    customPrompt: prompt
  });
  return result.results[0] || {
    modelId,
    success: false,
    durationMs: 0,
    error: "No result returned"
  };
}

// src/wakeup/reset-detector.ts
var RESET_TIME_MIN_HOURS = 4.5;
var RESET_TIME_MAX_HOURS = 5.5;
var RESET_TIME_MIN_MS = RESET_TIME_MIN_HOURS * 60 * 60 * 1e3;
var RESET_TIME_MAX_MS = RESET_TIME_MAX_HOURS * 60 * 60 * 1e3;
var DEFAULT_COOLDOWN_MS = 60 * 60 * 1e3;

// src/commands/wakeup.ts
async function wakeupCommand(subcommand, args, options) {
  debug("wakeup", `Subcommand: ${subcommand}, options:`, options);
  switch (subcommand) {
    case "config":
      await configureWakeup();
      break;
    case "trigger":
      await runScheduledTrigger(options.scheduled ?? false);
      break;
    case "install":
      await installSchedule();
      break;
    case "uninstall":
      await uninstallSchedule();
      break;
    case "test":
      await runTestTrigger(options);
      break;
    case "history":
      await showHistory(options);
      break;
    case "status":
    default:
      await showStatus();
      break;
  }
}
async function configureWakeup() {
  console.log("\n\u{1F527} Auto Wake-up Configuration\n");
  const config = getOrCreateConfig();
  const accountManager = getAccountManager();
  const accounts = accountManager.getAccountEmails();
  if (accounts.length === 0) {
    console.log("\u274C No accounts available. Please login first:");
    console.log("   agy-usage login\n");
    return;
  }
  const { enabled } = await inquirer2.prompt([{
    type: "confirm",
    name: "enabled",
    message: "Enable auto wake-up?",
    default: config.enabled
  }]);
  if (!enabled) {
    config.enabled = false;
    saveWakeupConfig(config);
    console.log("\n\u2705 Auto wake-up disabled");
    return;
  }
  const { triggerMode } = await inquirer2.prompt([{
    type: "list",
    name: "triggerMode",
    message: "Trigger mode:",
    choices: [
      { name: "Schedule-based (run at specific times)", value: "schedule" },
      { name: "Quota-reset-based (trigger when quota resets)", value: "reset" }
    ],
    default: config.wakeOnReset ? "reset" : "schedule"
  }]);
  config.wakeOnReset = triggerMode === "reset";
  if (!config.wakeOnReset) {
    const { scheduleMode } = await inquirer2.prompt([{
      type: "list",
      name: "scheduleMode",
      message: "Schedule type:",
      choices: [
        { name: "Every N hours", value: "interval" },
        { name: "Daily at specific times", value: "daily" },
        { name: "Custom cron expression", value: "custom" }
      ],
      default: config.scheduleMode
    }]);
    config.scheduleMode = scheduleMode;
    if (scheduleMode === "interval") {
      const { intervalHours } = await inquirer2.prompt([{
        type: "number",
        name: "intervalHours",
        message: "Trigger every N hours:",
        default: config.intervalHours || 6,
        validate: (val) => val >= 1 && val <= 23 ? true : "Must be 1-23"
      }]);
      config.intervalHours = intervalHours;
    } else if (scheduleMode === "daily") {
      const { dailyTime } = await inquirer2.prompt([{
        type: "input",
        name: "dailyTime",
        message: "Time to trigger (HH:MM):",
        default: config.dailyTimes?.[0] || "09:00",
        validate: (val) => /^\d{1,2}:\d{2}$/.test(val) ? true : "Use HH:MM format"
      }]);
      config.dailyTimes = [dailyTime];
    } else if (scheduleMode === "custom") {
      const { cronExpression } = await inquirer2.prompt([{
        type: "input",
        name: "cronExpression",
        message: "Cron expression (min hour day month weekday):",
        default: config.cronExpression || "0 */6 * * *"
      }]);
      config.cronExpression = cronExpression;
    }
  } else {
    const { resetCooldown } = await inquirer2.prompt([{
      type: "number",
      name: "resetCooldown",
      message: "Cooldown between triggers (minutes):",
      default: config.resetCooldownMinutes || 10,
      validate: (val) => val >= 1 ? true : "Must be at least 1 minute"
    }]);
    config.resetCooldownMinutes = resetCooldown;
  }
  config.selectedModels = ["claude-sonnet-4-5", "gemini-3-flash", "gemini-3-pro-low"];
  console.log("\n   \u{1F4E6} Models: claude-sonnet-4-5, gemini-3-flash, gemini-3-pro-low");
  console.log("      (Triggers both Claude and Gemini families)");
  if (accounts.length > 1) {
    const { selectedAccounts } = await inquirer2.prompt([{
      type: "checkbox",
      name: "selectedAccounts",
      message: "Select accounts to use:",
      choices: accounts.map((email) => ({
        name: email,
        value: email,
        checked: !config.selectedAccounts || config.selectedAccounts.includes(email)
      }))
    }]);
    config.selectedAccounts = selectedAccounts.length > 0 ? selectedAccounts : void 0;
  } else {
    config.selectedAccounts = void 0;
  }
  const { customPrompt } = await inquirer2.prompt([{
    type: "input",
    name: "customPrompt",
    message: 'Custom wake-up prompt (leave empty for default "hi"):',
    default: config.customPrompt || ""
  }]);
  config.customPrompt = customPrompt || void 0;
  const { maxTokens } = await inquirer2.prompt([{
    type: "number",
    name: "maxTokens",
    message: "Max output tokens (0 = no limit):",
    default: config.maxOutputTokens || 0
  }]);
  config.maxOutputTokens = maxTokens;
  config.enabled = true;
  saveWakeupConfig(config);
  console.log("\n\u2705 Configuration saved!");
  console.log(`   Mode: ${getScheduleDescription(config)}`);
  console.log(`   Models: ${config.selectedModels.join(", ")}`);
  console.log(`   Accounts: ${config.selectedAccounts?.join(", ") || "Active account"}`);
  if (!config.wakeOnReset && isCronSupported()) {
    const { installNow } = await inquirer2.prompt([{
      type: "confirm",
      name: "installNow",
      message: "Install to system cron now?",
      default: true
    }]);
    if (installNow) {
      await installSchedule();
    } else {
      console.log("\n\u{1F4CB} To install later, run:");
      console.log("   agy-usage wakeup install");
    }
  }
  console.log("");
}
async function runScheduledTrigger(isScheduled) {
  debug("wakeup", `Running trigger (scheduled: ${isScheduled})`);
  const config = loadWakeupConfig();
  if (!config || !config.enabled) {
    debug("wakeup", "Wakeup not configured or disabled");
    return;
  }
  const accounts = resolveAccounts(config.selectedAccounts);
  if (accounts.length === 0) {
    debug("wakeup", "No valid accounts");
    return;
  }
  if (config.selectedModels.length === 0) {
    debug("wakeup", "No models selected");
    return;
  }
  for (const accountEmail of accounts) {
    const result = await executeTrigger({
      models: config.selectedModels,
      accountEmail,
      triggerType: "auto",
      triggerSource: isScheduled ? "scheduled" : "manual",
      customPrompt: config.customPrompt,
      maxOutputTokens: config.maxOutputTokens
    });
    const successCount = result.results.filter((r) => r.success).length;
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${accountEmail}: ${successCount}/${result.results.length} models triggered`);
  }
}
async function installSchedule() {
  console.log("\n\u{1F4C5} Installing wake-up schedule to cron...\n");
  if (!isCronSupported()) {
    console.log("\u274C Cron is not supported on this platform.");
    console.log("   Windows Task Scheduler support coming soon.");
    return;
  }
  const config = loadWakeupConfig();
  if (!config) {
    console.log("\u274C No wake-up configuration found.");
    console.log("   Run: agy-usage wakeup config");
    return;
  }
  if (!config.enabled) {
    console.log("\u274C Wake-up is disabled. Enable it first:");
    console.log("   agy-usage wakeup config");
    return;
  }
  if (config.wakeOnReset) {
    console.log("\u2139\uFE0F  Quota-reset mode does not require cron installation.");
    console.log("   Triggers happen automatically when you check quota.");
    return;
  }
  try {
    const cronExpression = configToCronExpression(config);
    console.log(`   Schedule: ${getScheduleDescription(config)}`);
    console.log(`   Cron: ${cronExpression}`);
    console.log("");
    const result = await installCronJob(cronExpression);
    if (result.success) {
      console.log("\u2705 Cron job installed successfully!");
      console.log(`   Next run: ${getNextRunEstimate(cronExpression)}`);
      console.log("");
      console.log("   To check status: agy-usage wakeup status");
      console.log("   To uninstall: agy-usage wakeup uninstall");
    } else {
      console.log("\u26A0\uFE0F  Automatic installation failed.");
      if (result.manualInstructions) {
        console.log("");
        console.log(result.manualInstructions);
      }
    }
  } catch (err) {
    console.log(`\u274C Error: ${err instanceof Error ? err.message : err}`);
  }
  console.log("");
}
async function uninstallSchedule() {
  console.log("\n\u{1F5D1}\uFE0F  Removing wake-up schedule from cron...\n");
  const success2 = await uninstallCronJob();
  if (success2) {
    console.log("\u2705 Cron job removed successfully!");
  } else {
    console.log("\u26A0\uFE0F  Could not remove cron job. It may not be installed.");
    console.log("   Check your crontab: crontab -l");
  }
  console.log("");
}
async function runTestTrigger(options = {}) {
  console.log("\n\u{1F9EA} Test Trigger\n");
  const accountManager = getAccountManager();
  const accounts = accountManager.getAccountEmails();
  if (accounts.length === 0) {
    console.log("\u274C No accounts available. Please login first.");
    return;
  }
  let accountEmail;
  if (options.email) {
    if (!accounts.includes(options.email)) {
      console.log(`\u274C Account "${options.email}" not found.`);
      console.log(`   Available accounts: ${accounts.join(", ")}`);
      return;
    }
    accountEmail = options.email;
  } else if (accounts.length === 1) {
    accountEmail = accounts[0];
  } else {
    const { selectedAccount } = await inquirer2.prompt([{
      type: "list",
      name: "selectedAccount",
      message: "Select account:",
      choices: accounts
    }]);
    accountEmail = selectedAccount;
  }
  let modelId;
  if (options.model) {
    modelId = options.model;
  } else {
    const config = loadWakeupConfig();
    const { selectedModel } = await inquirer2.prompt([{
      type: "input",
      name: "selectedModel",
      message: "Model ID to test:",
      default: config?.selectedModels[0] || "claude-sonnet-4-5"
    }]);
    modelId = selectedModel;
  }
  const prompt = options.prompt || "hi";
  console.log("\n\u23F3 Triggering...");
  try {
    const result = await testTrigger(modelId, accountEmail, prompt);
    if (result.success) {
      console.log(`
\u2705 Success! (${result.durationMs}ms)`);
      if (result.response) {
        console.log(`
\u{1F4DD} Response:
${result.response.substring(0, 200)}...`);
      }
      if (result.tokensUsed) {
        console.log(`
\u{1F4CA} Tokens: ${result.tokensUsed.total} (prompt: ${result.tokensUsed.prompt}, completion: ${result.tokensUsed.completion})`);
      }
    } else {
      console.log(`
\u274C Failed: ${result.error}`);
    }
  } catch (err) {
    console.log(`
\u274C Error: ${err instanceof Error ? err.message : err}`);
  }
  console.log("");
  process.exit(0);
}
async function showHistory(options) {
  const limit = parseInt(options.limit || "10", 10);
  const history = getRecentHistory(limit);
  if (history.length === 0) {
    console.log("\n\u{1F4DC} No trigger history yet.\n");
    return;
  }
  if (options.json) {
    console.log(JSON.stringify(history, null, 2));
    return;
  }
  console.log(`
\u{1F4DC} Trigger History (last ${Math.min(limit, history.length)} records)
`);
  const table = new Table3({
    head: ["Time", "Source", "Model", "Account", "Duration", "Status"],
    style: { head: ["cyan"] }
  });
  for (const record of history) {
    const time = new Date(record.timestamp).toLocaleString();
    const status = record.success ? "\u2705" : `\u274C ${record.error?.substring(0, 20) || ""}`;
    table.push([
      time,
      record.triggerSource,
      record.models[0] || "-",
      record.accountEmail.split("@")[0],
      `${record.durationMs}ms`,
      status
    ]);
  }
  console.log(table.toString());
  console.log("");
}
async function showStatus() {
  console.log("\n\u{1F4CA} Auto Wake-up Status\n");
  const config = loadWakeupConfig();
  if (!config) {
    console.log("   Status: Not configured");
    console.log("");
    console.log("   To configure: agy-usage wakeup config");
    console.log("");
    return;
  }
  console.log(`   Enabled: ${config.enabled ? "\u2705 Yes" : "\u274C No"}`);
  console.log(`   Mode: ${getScheduleDescription(config)}`);
  if (config.selectedModels.length > 0) {
    console.log(`   Models: ${config.selectedModels.join(", ")}`);
  } else {
    console.log("   Models: None selected");
  }
  console.log(`   Accounts: ${getAccountResolutionStatus(config.selectedAccounts)}`);
  if (!config.wakeOnReset && config.enabled) {
    const cronStatus = await getCronStatus();
    if (cronStatus.installed) {
      console.log(`   Cron: \u2705 Installed (${cronStatus.cronExpression})`);
      if (cronStatus.nextRun) {
        console.log(`   Next run: ${cronStatus.nextRun}`);
      }
    } else {
      console.log("   Cron: \u274C Not installed");
      console.log("         Run: agy-usage wakeup install");
    }
  }
  const lastTrigger = getLastTrigger();
  if (lastTrigger) {
    const ago = getTimeAgo(new Date(lastTrigger.timestamp));
    const status = lastTrigger.success ? "\u2705 success" : `\u274C ${lastTrigger.error?.substring(0, 30) || "failed"}`;
    console.log(`   Last trigger: ${ago} (${status})`);
  } else {
    console.log("   Last trigger: Never");
  }
  console.log("");
}
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1e3);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// src/index.ts
var program = new Command();
program.name("agy-usage").description("CLI tool to check Antigravity model quota via Google Cloud Code API (agy-usage)").version(version).option("--debug", "Enable debug mode").hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.debug) {
    setDebugMode(true);
  }
});
program.command("login").description("Authenticate with Google (adds a new account)").option("--no-browser", "Do not open browser, print URL instead").option("--manual", "Manual login flow (copy-paste URL)").option("-p, --port <port>", "Port for OAuth callback server", parseInt).action(loginCommand);
program.command("logout [email]").description("Remove stored credentials").option("--all", "Logout from all accounts").action((email, options) => logoutCommand(options, email));
program.command("status").description("Show current authentication status").option("--all", "Show status for all accounts").option("-a, --account <email>", "Show status for specific account").action(statusCommand);
program.command("quota", { isDefault: true }).alias("usage").description("Fetch and display quota information").option("--json", "Output as JSON").option("-m, --method <method>", "Method to use: auto (default), local, or google", "auto").option("--all", "Show quota for all accounts").option("-a, --account <email>", "Show quota for specific account").option("--refresh", "Force refresh (ignore cache)").option("--all-models", "Include autocomplete models (Gemini 2.5) in quota display").action(quotaCommand);
var accountsCmd = program.command("accounts").description("Manage multiple accounts");
accountsCmd.command("list").description("List all accounts").option("--refresh", "Show refresh tip").action((options) => accountsCommand("list", [], options));
accountsCmd.command("add").description("Add a new account (triggers OAuth login)").action(() => accountsCommand("add", [], {}));
accountsCmd.command("switch <email>").description("Switch to a different account").action((email) => accountsCommand("switch", [email], {}));
accountsCmd.command("remove <email>").description("Remove an account").option("--force", "Skip confirmation").action((email, options) => accountsCommand("remove", [email], options));
accountsCmd.command("current").description("Show current active account").action(() => accountsCommand("current", [], {}));
accountsCmd.command("refresh [email]").description("Refresh account tokens").option("--all", "Refresh all accounts").action((email, options) => accountsCommand("refresh", email ? [email] : [], options));
accountsCmd.action(() => accountsCommand("list", [], {}));
program.command("doctor").description("Run diagnostics and show configuration").action(doctorCommand);
var wakeupCmd = program.command("wakeup").description("Auto wake-up and warm up AI models");
wakeupCmd.command("config").description("Configure auto wake-up schedule").action(() => wakeupCommand("config", [], {}));
wakeupCmd.command("trigger").description("Execute one trigger cycle (called by cron)").option("--scheduled", "Mark as scheduled trigger").action((options) => wakeupCommand("trigger", [], options));
wakeupCmd.command("install").description("Install wake-up schedule to system cron").action(() => wakeupCommand("install", [], {}));
wakeupCmd.command("uninstall").description("Remove wake-up schedule from system cron").action(() => wakeupCommand("uninstall", [], {}));
wakeupCmd.command("test").description("Test trigger manually").option("-e, --email <email>", "Account email to use for testing").option("-m, --model <model>", "Model ID to test").option("-p, --prompt <prompt>", "Test prompt to send", "hi").action((options) => wakeupCommand("test", [], options));
wakeupCmd.command("history").description("View trigger history").option("--limit <n>", "Number of records to show", "10").option("--json", "Output as JSON").action((options) => wakeupCommand("history", [], options));
wakeupCmd.command("status").description("Show wake-up status and configuration").action(() => wakeupCommand("status", [], {}));
wakeupCmd.action(() => wakeupCommand("status", [], {}));
program.parse();
//# sourceMappingURL=index.js.map