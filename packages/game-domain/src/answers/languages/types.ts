export interface LanguageRules {
	dropLeadingWords: readonly string[]
	rewriteWords: Readonly<Record<string, string>>
	voiceFillers: readonly string[]
	foldInput?: (raw: string) => string
}
