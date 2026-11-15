import fs from 'node:fs'
import path from 'node:path'
import { constants, gzipSync } from 'node:zlib'
import type { Plugin } from 'vite'

const TEXT_EXTENSIONS = new Set([
	'.css',
	'.geojson',
	'.html',
	'.js',
	'.json',
	'.mjs',
	'.svg',
	'.txt',
	'.xml',
])
const MIN_BYTES = 1024
const MAX_RATIO = 0.9

function shouldCompress(relativePath: string): boolean {
	const posixPath = relativePath.split(path.sep).join('/')
	if (posixPath.startsWith('map/tiles/')) {
		return false
	}
	const extension = path.extname(posixPath)
	return (
		TEXT_EXTENSIONS.has(extension) ||
		(extension === '.pbf' && posixPath.startsWith('map/fonts/'))
	)
}

/** Writes `<file>.gz` next to compressible build outputs for `gzip_static`. */
export function precompress(): Plugin {
	let outDir = ''

	return {
		name: 'precompress',
		apply: 'build',
		configResolved(config) {
			outDir = path.resolve(config.root, config.build.outDir)
		},
		closeBundle() {
			const files = fs.readdirSync(outDir, {
				recursive: true,
				encoding: 'utf8',
			})
			let written = 0
			for (const relativePath of files) {
				const filePath = path.join(outDir, relativePath)
				if (
					!shouldCompress(relativePath) ||
					!fs.statSync(filePath).isFile()
				) {
					continue
				}
				const source = fs.readFileSync(filePath)
				if (source.length < MIN_BYTES) {
					continue
				}
				const compressed = gzipSync(source, {
					level: constants.Z_BEST_COMPRESSION,
				})
				if (compressed.length <= source.length * MAX_RATIO) {
					fs.writeFileSync(`${filePath}.gz`, compressed)
					written++
				}
			}
			this.info(`wrote ${written} .gz files`)
		},
	}
}
