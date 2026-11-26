import type { CountryInfo } from '@georally/country-catalog'
import type { SkillId } from '@georally/mastery'
import type { TFunction } from 'i18next'
import type { ComponentType } from 'react'
import { getCountryName, type AppLanguage } from '@/shared/i18n'
import { LocateCard } from './LocateCard'
import { NameCard } from './NameCard'
import type { ReviewCardProps } from './types'

export interface SkillCard {
	Card: ComponentType<ReviewCardProps>
	// The HUD's question; it never gives the answer away.
	ask: (
		info: CountryInfo,
		t: TFunction,
		language: AppLanguage,
	) => { text: string; flagUrl?: string }
}

export const SKILL_CARDS: Record<SkillId, SkillCard> = {
	locate: {
		Card: LocateCard,
		ask: (info, _, language) => ({
			text: getCountryName(info, language),
			flagUrl: info.flagUrl,
		}),
	},
	name: {
		Card: NameCard,
		ask: (_, t) => ({ text: t('review.namePrompt') }),
	},
}
