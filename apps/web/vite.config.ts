import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import { resolve } from 'path'
import { regionMap } from './vite/regionMap'

function pbfHeaders(): Plugin {
	const isTilePbf = (urlPath: string) =>
		urlPath.endsWith('.pbf') && urlPath.includes('/map/tiles/')
	const isFontPbf = (urlPath: string) =>
		urlPath.endsWith('.pbf') && urlPath.includes('/map/fonts/')

	const applyHeaders = (req: any, res: any, next: () => void) => {
		const urlPath = req.url?.split('?')[0] ?? ''

		if (isTilePbf(urlPath)) {
			// tippecanoe export is gzip-compressed; MapLibre needs this header.
			res.setHeader('Content-Encoding', 'gzip')
			res.setHeader('Content-Type', 'application/x-protobuf')
			res.setHeader('Cache-Control', 'no-store')
		} else if (isFontPbf(urlPath)) {
			res.removeHeader('Content-Encoding')
			res.setHeader('Content-Type', 'application/x-protobuf')
			res.setHeader('Cache-Control', 'no-store')
		}
		next()
	}

	return {
		name: 'pbf-headers',
		configureServer(server) {
			server.middlewares.use(applyHeaders)
		},
		configurePreviewServer(server) {
			server.middlewares.use(applyHeaders)
		},
	}
}

const getLocaleInputs = () => {
	const localesDir = resolve(__dirname, 'locales')
	const files = fs.readdirSync(localesDir)
	const inputs: Record<string, string> = {}

	files.forEach(file => {
		if (file.endsWith('.html')) {
			const name = file.replace('.html', '')
			inputs[name] = resolve(localesDir, file)
		}
	})

	inputs['main'] = resolve(__dirname, 'index.html')
	return inputs
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), pbfHeaders(), regionMap()],
	base: '/',
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	optimizeDeps: {
		exclude: ['maplibre-gl'],
	},
	build: {
		rollupOptions: {
			input: getLocaleInputs(),
			treeshake: {
				// The UI primitives are pure component modules. Without this, the
				// top-level `cva()` calls keep every primitive re-exported from the
				// `shared/ui` barrel in the chunk of whichever page imports it.
				moduleSideEffects: (id, external) =>
					external || !id.includes('/src/shared/ui/'),
			},
		},
	},
})
