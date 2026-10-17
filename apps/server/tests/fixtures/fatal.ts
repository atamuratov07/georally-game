import { createLogger } from '../../src/observability/logger'
import { registerFatalHandlers } from '../../src/observability/process'

registerFatalHandlers(createLogger('info'))

const message = `boom ${'x'.repeat(200_000)}`

setTimeout(() => {
	if (process.argv[2] === 'rejection') {
		void Promise.reject(new Error(message))
		return
	}

	throw new Error(message)
}, 0)
