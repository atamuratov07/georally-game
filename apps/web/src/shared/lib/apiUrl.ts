export function buildApiUrl(path: string): string {
	const envUrl = import.meta.env.VITE_GAME_SERVER_ORIGIN?.trim()
	const origin = envUrl ? envUrl.replace(/\/$/, '') : ''
	return `${origin}/api${path}`
}
