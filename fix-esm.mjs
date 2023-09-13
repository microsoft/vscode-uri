#!/usr/bin/env node
import fs from 'node:fs/promises'

const outDir = new URL('lib/esm/', import.meta.url)
const pkg = {
  type: 'module',
  imports: {
    '#path': {
      browser: './path-browserify.js',
      default: './path.js'
    }
  }
}

await fs.writeFile(
  new URL('package.json', outDir),
  JSON.stringify(pkg, undefined, 2) + '\n'
)
