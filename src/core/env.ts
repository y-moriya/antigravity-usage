/**
 * Environment and platform utilities
 */

import { homedir, platform } from 'node:os'
import { join } from 'node:path'

export type Platform = 'windows' | 'macos' | 'linux'

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const p = platform()
  if (p === 'win32') return 'windows'
  if (p === 'darwin') return 'macos'
  return 'linux'
}

import { existsSync } from 'node:fs'

/**
 * Get the config directory for this application
 * - Windows: %APPDATA%/agy-usage (or agy-usage)
 * - macOS: ~/Library/Application Support/agy-usage (or agy-usage)
 * - Linux: ~/.config/agy-usage (or agy-usage)
 */
export function getConfigDir(): string {
  const p = getPlatform()
  const home = homedir()
  
  const getPath = (name: string) => {
    switch (p) {
      case 'windows':
        return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), name)
      case 'macos':
        return join(home, 'Library', 'Application Support', name)
      case 'linux':
      default:
        return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), name)
    }
  }

  const oldPath = getPath('agy-usage')
  const newPath = getPath('agy-usage')

  // If old config path exists, keep using it for seamless migration
  if (existsSync(oldPath)) {
    return oldPath
  }

  return newPath
}

/**
 * Get the path to the tokens file (legacy - single account)
 */
export function getTokensPath(): string {
  return join(getConfigDir(), 'tokens.json')
}

/**
 * Get the accounts directory
 */
export function getAccountsDir(): string {
  return join(getConfigDir(), 'accounts')
}

/**
 * Get the directory for a specific account
 * @param email Account email address
 */
export function getAccountDir(email: string): string {
  // Sanitize email for filesystem (replace special chars)
  const safeName = email.replace(/[^a-zA-Z0-9@._-]/g, '_')
  return join(getAccountsDir(), safeName)
}

/**
 * Get the path to global config file
 */
export function getGlobalConfigPath(): string {
  return join(getConfigDir(), 'config.json')
}
