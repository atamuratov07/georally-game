import { useEffect, useRef, useState } from 'react'
import type { ReactionModeParam } from '@/shared/analytics/track'

const STORAGE_KEY = 'georally.reactionPrompt'
const PROMPT_INTERVAL_MS = 24 * 60 * 60 * 1000
const FIRST_PROMPTED_GAME = 2

interface PromptState {
	finishedGames: number
	lastShownAt: Partial<Record<ReactionModeParam, number>>
}

interface PromptDecision {
	show: boolean
	next: PromptState
}

function readPromptState(): PromptState | null {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (raw === null) return { finishedGames: 0, lastShownAt: {} }
		const parsed: unknown = JSON.parse(raw)
		if (
			parsed &&
			typeof parsed === 'object' &&
			'finishedGames' in parsed &&
			typeof parsed.finishedGames === 'number' &&
			'lastShownAt' in parsed &&
			parsed.lastShownAt &&
			typeof parsed.lastShownAt === 'object'
		) {
			return parsed as PromptState
		}
		return { finishedGames: 0, lastShownAt: {} }
	} catch {
		return null
	}
}

function decidePrompt(mode: ReactionModeParam): PromptDecision | null {
	const state = readPromptState()
	if (state === null) return null

	const now = Date.now()
	const finishedGames = state.finishedGames + 1
	const lastShownAt = state.lastShownAt[mode]
	const show =
		finishedGames >= FIRST_PROMPTED_GAME &&
		(lastShownAt === undefined || now - lastShownAt >= PROMPT_INTERVAL_MS)

	return {
		show,
		next: {
			finishedGames,
			lastShownAt: show
				? { ...state.lastShownAt, [mode]: now }
				: state.lastShownAt,
		},
	}
}

function writePromptState(state: PromptState): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		return
	}
}

export function claimReactionPrompt(mode: ReactionModeParam): boolean {
	const decision = decidePrompt(mode)
	if (!decision) return false
	writePromptState(decision.next)
	return decision.show
}

export function useReactionPrompt(mode: ReactionModeParam): boolean {
	const [decision] = useState(() => decidePrompt(mode))
	const recorded = useRef(false)

	useEffect(() => {
		if (!decision || recorded.current) return
		recorded.current = true
		writePromptState(decision.next)
	}, [decision])

	return decision?.show ?? false
}
