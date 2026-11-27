import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils'
import { useInstallApp } from './useInstallApp'

export function InstallAppButton({ className }: { className?: string }) {
	const { t } = useTranslation()
	const { available, install, help } = useInstallApp()

	if (!available) return null

	return (
		<>
			<button
				type='button'
				onClick={install}
				className={cn(
					'inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-on-sky transition-colors hover:bg-on-sky/10',
					className,
				)}
			>
				<Download aria-hidden='true' className='size-5' strokeWidth={2.5} />
				{t('pwa.install')}
			</button>
			{help}
		</>
	)
}
