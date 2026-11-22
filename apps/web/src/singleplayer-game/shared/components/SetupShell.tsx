import { useLayoutEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReactionModeParam } from '@/shared/analytics/track'
import { PendingReaction } from '@/shared/feedback'
import { BackLink, PageShell } from '@/shared/layout'
import { AppUpdateNotice } from '@/shared/pwa'
import type { SingleplayerModeId } from '../../paths'
import { setupShown } from '../modeSwitch'
import { ModeTabs } from './ModeTabs'

const REACTION_MODES: Record<SingleplayerModeId, ReactionModeParam> = {
	locate: 'locate',
	'name-it': 'name_it',
	'recall-sprint': 'recall_sprint',
	routes: 'routes',
}

interface SetupShellProps {
	mode: SingleplayerModeId
	children: ReactNode
}

export function SetupShell({ mode, children }: SetupShellProps) {
	const { t } = useTranslation()

	useLayoutEffect(() => setupShown(mode), [mode])

	return (
		<PageShell width='lg' headerTitle={t('singleplayer.title')}>
			<AppUpdateNotice />
			<BackLink to='/'>{t('common.home')}</BackLink>
			<ModeTabs current={mode} />
			<PendingReaction mode={REACTION_MODES[mode]} />
			<div className='[view-transition-name:setup-card]'>{children}</div>
		</PageShell>
	)
}
