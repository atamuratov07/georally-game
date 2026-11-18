import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { optimize } from 'svgo'
import { isRefreshRequested } from './lib/cache.mjs'
import { readCountries } from './lib/countries.mjs'
import {
	ensureDir,
	parseOutDir,
	resolvePackagePath,
} from './lib/output-paths.mjs'

const MAX_FLAG_BYTES = 300 * 1024
const FORBIDDEN_ELEMENTS = new Set(['script', 'foreignObject'])

const FLAGS_JSON = resolvePackagePath('build', 'flags.json')
const cacheDir = resolvePackagePath('build', 'cache', 'flags')
const outDir = parseOutDir('flags')

const countries = readCountries()

async function readSource(country) {
	const cachePath = path.join(cacheDir, `${country.id}.svg`)
	const cached = fs.existsSync(cachePath)
	if (cached && !isRefreshRequested()) {
		return fs.readFileSync(cachePath, 'utf8')
	}

	try {
		const response = await fetch(country.flagUrl)
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}
		const text = await response.text()
		fs.writeFileSync(cachePath, text, 'utf8')
		return text
	} catch (error) {
		if (!cached) {
			throw new Error(
				`Flag of ${country.a3} (${country.flagUrl}) failed: ${error.message}. No cached copy exists at ${cachePath}.`,
			)
		}
		console.warn(
			`Flag of ${country.a3}: ${error.message}; using the cached copy.`,
		)
		return fs.readFileSync(cachePath, 'utf8')
	}
}

function validationPlugin(problems) {
	return {
		name: 'validateFlag',
		fn: () => ({
			element: {
				enter(node, parent) {
					if (parent.type === 'root' && node.name !== 'svg') {
						problems.push(`root element is <${node.name}>`)
					}
					if (FORBIDDEN_ELEMENTS.has(node.name)) {
						problems.push(`contains <${node.name}>`)
					}
					for (const [name, value] of Object.entries(node.attributes)) {
						if (/^on/i.test(name)) {
							problems.push(`<${node.name}> has ${name}`)
						}
						if (/(^|:)href$/.test(name) && !value.startsWith('#')) {
							problems.push(`<${node.name}> references ${value}`)
						}
					}
				},
			},
		}),
	}
}

function checkFlag(country, source) {
	const problems = []
	optimize(source, { plugins: [validationPlugin(problems)] })
	if (Buffer.byteLength(source) > MAX_FLAG_BYTES) {
		problems.push(`is ${Buffer.byteLength(source)} bytes`)
	}
	if (problems.length > 0) {
		throw new Error(`Flag of ${country.a3}: ${problems.join('; ')}`)
	}
	return source
}

ensureDir(cacheDir)
fs.rmSync(outDir, { recursive: true, force: true })
ensureDir(outDir)

const flagUrls = {}
const sizes = []
for (const country of countries) {
	const data = checkFlag(country, await readSource(country))
	fs.writeFileSync(path.join(outDir, `${country.id}.svg`), data, 'utf8')

	const hash = crypto.createHash('sha256').update(data).digest('hex')
	flagUrls[country.id] = `/flags/${country.id}.svg?v=${hash.slice(0, 8)}`
	sizes.push({
		a3: country.a3,
		bytes: Buffer.byteLength(data),
		gzip: gzipSync(data).length,
	})
}

fs.writeFileSync(FLAGS_JSON, JSON.stringify(flagUrls, null, 2), 'utf8')

const kb = bytes => `${(bytes / 1024).toFixed(0)} KB`
const total = key => sizes.reduce((sum, size) => sum + size[key], 0)
const largest = sizes.toSorted((a, b) => b.bytes - a.bytes).slice(0, 5)
console.log(
	`Wrote ${sizes.length} flags to ${outDir}: ${kb(total('bytes'))}, ${kb(total('gzip'))} gzipped.`,
)
console.log(
	`Largest: ${largest.map(size => `${size.a3} ${kb(size.bytes)}`).join(', ')}`,
)
