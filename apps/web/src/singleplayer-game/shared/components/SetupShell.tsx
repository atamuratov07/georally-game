import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BackLink, PageShell } from '@/shared/layout'
import type { SingleplayerModeId } from '../../paths'
import { ModeTabs } from './ModeTabs'

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
			{children}
		</PageShell>
	)
}
