import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { cn } from '@/shared/utils'
import { SINGLEPLAYER_MODES } from '../../modes'
import { singleplayerPaths, type SingleplayerModeId } from '../../paths'

const SHARED_PARAMS = ['scope', 'difficulty']

export function ModeTabs({ current }: { current: SingleplayerModeId }) {
	const { t } = useTranslation()
	const [searchParams] = useLocalizedSearchParams()
	const shared = new URLSearchParams(
		SHARED_PARAMS.flatMap(key => {
			const value = searchParams.get(key)
			return value === null ? [] : [[key, value]]
		}),
	).toString()

	return (
		<nav
			aria-label={t('singleplayer.modes.label')}
			className='mb-5 flex gap-1 rounded-control bg-paper-deep p-1 pb-1.5 shadow-[inset_0_2px_0_0_var(--color-line)]'
		>
			{SINGLEPLAYER_MODES.map(mode => {
				const active = mode.id === current
				return (
					<LocalizedLink
						key={mode.id}
						to={{
							pathname: singleplayerPaths(mode.id).setup,
							search: shared ? `?${shared}` : '',
						}}
						aria-current={active ? 'page' : undefined}
						className={cn(
							'grid h-11 min-w-0 flex-1 place-items-center rounded-[10px] px-2 text-sm font-extrabold whitespace-nowrap transition-colors duration-150 sm:text-base',
							active
								? 'border-2 border-ocean-600 bg-ocean-500 text-white shadow-[0_3px_0_0_var(--color-ocean-700)]'
								: 'text-muted hover:text-ink',
						)}
					>
						{t(mode.titleKey)}
					</LocalizedLink>
				)
			})}
		</nav>
	)
}
