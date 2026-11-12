import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReactionModeParam } from '@/shared/analytics/track'
import { PendingReaction } from '@/shared/feedback'
import { BackLink, PageShell } from '@/shared/layout'
import type { SingleplayerModeId } from '../../paths'
import { ModeTabs } from './ModeTabs'

const REACTION_MODES: Record<SingleplayerModeId, ReactionModeParam> = {
	locate: 'locate',
	'name-it': 'name_it',
	'recall-sprint': 'recall_sprint',
}

interface SetupShellProps {
	mode: SingleplayerModeId
	children: ReactNode
}

export function SetupShell({ mode, children }: SetupShellProps) {
	const { t } = useTranslation()

	return (
		<PageShell width='lg'>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<ModeTabs current={mode} />
			<PendingReaction mode={REACTION_MODES[mode]} />
			{children}
		</PageShell>
	)
}
