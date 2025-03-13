// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'

// Only import Node.js modules if we're not in a browser
let fs, mkdir, join;
if (!isBrowser) {
  // Dynamic imports for Node.js environment
  const promises = await import('fs').then(module => module.promises);
  const fsPromises = await import('node:fs/promises');
  const path = await import('path');
  
  fs = promises;
  mkdir = fsPromises.mkdir;
  join = path.join;
}

// Node.js implementation
const nodeConfigPath = (path) => join(path, 'config.json')

const nodeSaveConfig = async ({ path, config }) => {
  await mkdir(path, { recursive: true })
  const configFilePath = nodeConfigPath(path)
  const data = JSON.stringify(config)

  await fs.writeFile(configFilePath, data, { flags: 'w' })
}

const nodeLoadConfig = async ({ path }) => {
  const configFilePath = nodeConfigPath(path)
  const config = JSON.parse(await fs.readFile(configFilePath))
  return config
}

// Browser implementation
const browserConfigKey = (path) => `orbit-db-config:${path}`

const browserSaveConfig = async ({ path, config }) => {
  const key = browserConfigKey(path)
  const data = JSON.stringify(config)
  localStorage.setItem(key, data)
}

const browserLoadConfig = async ({ path }) => {
  const key = browserConfigKey(path)
  const data = localStorage.getItem(key)
  
  if (!data) {
    throw new Error(`No configuration found at ${path}`)
  }
  
  return JSON.parse(data)
}

// Export the appropriate implementation based on environment
export const saveConfig = isBrowser ? browserSaveConfig : nodeSaveConfig
export const loadConfig = isBrowser ? browserLoadConfig : nodeLoadConfig
