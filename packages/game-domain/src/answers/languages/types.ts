export interface LanguageRules {
	dropLeadingWords: readonly string[]
	rewriteWords: Readonly<Record<string, string>>
	foldInput?: (raw: string) => string
}
