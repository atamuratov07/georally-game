/** Prints every problem and exits with code 1, before a stage writes anything. */
export function exitOnProblems(problems) {
	if (problems.length === 0) return
	console.error(
		`Build blocked: ${problems.length} problem(s). Nothing was written.`,
	)
	for (const problem of problems) console.error(`  ${problem}`)
	process.exit(1)
}
