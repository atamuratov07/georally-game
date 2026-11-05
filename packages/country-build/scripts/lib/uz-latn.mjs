export function normalizeUzLatn(value) {
	return String(value ?? '')
		.replace(/([OoGg])['‘’`ʼʻ]/g, '$1ʻ')
		.replace(/['‘’`]/g, 'ʼ')
}
