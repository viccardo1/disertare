#!/usr/bin/env node
/**
 * Script de Disertare para:
 * 1) Aplicar la firma oficial en archivos .ts/.vue/.md indicados por 26.0.
 * 2) Actualizar campos de licencia y disertareBrand en todos los package.json.
 * 3) Detectar (y opcionalmente borrar) directorios de artefactos (node_modules, dist, etc.)
 *    que son borrables en F0.
 */

import { promises as fs } from 'fs'
import path from 'path'

const repoRoot = process.cwd()

// ──────────────────────────────────────────────────────────────
// Configuración de firma y licencia
// ──────────────────────────────────────────────────────────────

const HEADER_TS = `/**
* ╔══════════════════════════════════════════════════════════════════╗
* ║  D  DISERTARE                                                    ║
* ║  Plataforma avanzada de edición técnica, científica y            ║
* ║  multidisciplinaria.                                             ║
* ║                                                                  ║
* ║  © 2025 Disertare Project — Licencia Privativa.                  ║
* ║  Todos los derechos reservados.                                  ║
* ╚══════════════════════════════════════════════════════════════════╝
*/
`

// Para Markdown usamos comentario HTML, para no ensuciar el contenido:
const HEADER_MD = `<!--
╔══════════════════════════════════════════════════════════════════╗
║  D  DISERTARE                                                    ║
║  Plataforma avanzada de edición técnica, científica y            ║
║  multidisciplinaria.                                             ║
║                                                                  ║
║  © 2025 Disertare Project — Licencia Privativa.                  ║
║  Todos los derechos reservados.                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->
`

const BRAND_BLOCK = {
  author: 'Disertare Project',
  license: 'UNLICENSED',
  private: true,
    disertareBrand: {
      copyright: '© 2025 Disertare Project',
      licenseType: 'Licencia Privativa',
      url: 'https://disertare.app',
    },
}

// Directorios que NUNCA vamos a recorrer por dentro
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.vite',
  '.pnpm',
  'dist',
  '.cache',
])

// Directorios que consideramos “artefactos borrables”
const CLEANABLE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.vite',
  '.pnpm',
  'coverage',
  '.cache',
])

// ──────────────────────────────────────────────────────────────
// Utilidades
// ──────────────────────────────────────────────────────────────

function isMdGenerated(filePath) {
  // Si quieres excluir MD generados, nómbralos *.generated.md
  return filePath.endsWith('.generated.md')
}

/**
 * Decide si un archivo debe llevar cabecera, según las reglas de 26.0.
 */
function shouldAddHeader(absPath) {
  const rel = path.relative(repoRoot, absPath).replace(/\\/g, '/')

  // Nunca en node_modules, dist, public, assets
  if (
    rel.startsWith('node_modules/') ||
    rel.startsWith('dist/') ||
    rel.startsWith('public/') ||
    rel.startsWith('assets/')
  ) {
    return false
  }

  // TS / Vue del frontend y demás apps
  if (
    rel.startsWith('apps/frontend/src/') ||
    rel.startsWith('apps/admin/src/') ||
    rel.startsWith('apps/viewer/src/')
  ) {
    if (rel.endsWith('.ts') || rel.endsWith('.vue')) return true
  }

  // Paquetes de editor / dominio
  if (rel.startsWith('packages/') && rel.includes('/src/')) {
    if (rel.endsWith('.ts') || rel.endsWith('.vue')) return true
  }

  // Archivos de configuración raíz importantes
  const importantConfigFiles = [
    'vite.config.ts',
    'vite.config.js',
    'serverless.yml',
  ]
  if (importantConfigFiles.some((f) => rel === f || rel.endsWith('/' + f))) {
    return true
  }

  // Documentación interna principal
  if (rel === 'Disertare.md' || rel === 'docs/Disertare.md') return true
    if (rel.startsWith('docs/') && rel.endsWith('.md') && !isMdGenerated(rel)) {
      return true
    }

    return false
}

/**
 * Devuelve el header correcto según extensión.
 */
function getHeaderForFile(filePath) {
  if (filePath.endsWith('.md')) return HEADER_MD + '\n'
    return HEADER_TS + '\n'
}

/**
 * Aplica el header al archivo si todavía no lo tiene.
 */
async function ensureHeader(absPath) {
  const content = await fs.readFile(absPath, 'utf8')

  if (content.includes('D  DISERTARE')) {
    // Ya tiene la firma
    return false
  }

  const header = getHeaderForFile(absPath)
  const newContent = header + content
  await fs.writeFile(absPath, newContent, 'utf8')
  return true
}

/**
 * Actualiza package.json con los campos de licencia/brand.
 */
async function updatePackageJson(absPath) {
  const raw = await fs.readFile(absPath, 'utf8')
  let json
  try {
    json = JSON.parse(raw)
  } catch (err) {
    console.error(`No se pudo parsear JSON en: ${absPath}`, err)
    return false
  }

  let changed = false

  if (json.author !== BRAND_BLOCK.author) {
    json.author = BRAND_BLOCK.author
    changed = true
  }
  if (json.license !== BRAND_BLOCK.license) {
    json.license = BRAND_BLOCK.license
    changed = true
  }
  if (json.private !== true) {
    json.private = true
    changed = true
  }
  if (
    !json.disertareBrand ||
    JSON.stringify(json.disertareBrand) !==
    JSON.stringify(BRAND_BLOCK.disertareBrand)
  ) {
    json.disertareBrand = BRAND_BLOCK.disertareBrand
    changed = true
  }

  if (!changed) return false

    const formatted = JSON.stringify(json, null, 2) + '\n'
    await fs.writeFile(absPath, formatted, 'utf8')
    return true
}

/**
 * Recorrido del árbol: recoge tareas y directorios limpiables.
 */
async function walk(dir, cleanableDirs, tasks) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        // Anotamos el directorio como potencialmente limpiable si corresponde
        if (CLEANABLE_DIR_NAMES.has(entry.name)) {
          cleanableDirs.add(absPath)
        }
        continue
      }

      await walk(absPath, cleanableDirs, tasks)
    } else if (entry.isFile()) {
      if (entry.name === 'package.json') {
        tasks.push(updatePackageJson(absPath))
      }

      if (shouldAddHeader(absPath)) {
        tasks.push(ensureHeader(absPath))
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Limpieza de directorios
// ──────────────────────────────────────────────────────────────

async function cleanDirs(cleanableDirs) {
  let removed = 0
  for (const d of cleanableDirs) {
    try {
      await fs.rm(d, { recursive: true, force: true })
      removed++
      const rel = path.relative(repoRoot, d) || '.'
      console.log(`  ✔ Eliminado: ${rel}`)
    } catch (err) {
      const rel = path.relative(repoRoot, d) || '.'
      console.error(`  ✖ Error eliminando ${rel}:`, err.message)
    }
  }
  return removed
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const doClean = args.includes('--clean')

  console.log('Aplicando licencia Disertare y firma oficial...\n')

  const cleanableDirs = new Set()
  const tasks = []

  await walk(repoRoot, cleanableDirs, tasks)
  const results = await Promise.all(tasks)

  const modifiedCount = results.filter(Boolean).length

  console.log(`Archivos modificados (paquetes + cabecera): ${modifiedCount}`)

  if (cleanableDirs.size > 0) {
    console.log('\nDirectorios de artefactos detectados (borrables en F0):')
    for (const d of cleanableDirs) {
      const rel = path.relative(repoRoot, d) || '.'
      console.log(`  - ${rel}`)
    }

    if (doClean) {
      console.log('\nLimpieza automática habilitada (--clean).')
      const removed = await cleanDirs(cleanableDirs)
      console.log(`\nDirectorios eliminados: ${removed}`)
    } else {
      console.log('\nPuedes limpiarlos manualmente, por ejemplo:')
      console.log('  rm -rf node_modules dist .turbo .vite .pnpm coverage .cache')
      console.log('\nO ejecuta de nuevo el script con:')
      console.log('  node scripts/apply-disertare-license.mjs --clean')
    }
  } else {
    console.log('\nNo se detectaron directorios de artefactos para limpiar.')
  }

  console.log('\nListo.')
}

main().catch((err) => {
  console.error('Error ejecutando apply-disertare-license:', err)
  process.exit(1)
})
