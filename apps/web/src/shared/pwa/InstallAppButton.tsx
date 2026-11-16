import { Download, Share } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@/shared/ui'
import { cn } from '@/shared/utils'
import { promptInstall, useInstallMethod } from './install'

const IOS_STEPS = [
	{ key: 'iosStep1', color: 'text-ocean-500' },
	{ key: 'iosStep2', color: 'text-grape-500' },
] as const

export function InstallAppButton({ className }: { className?: string }) {
	const { t } = useTranslation()
	const method = useInstallMethod()
	const [iosHelpOpen, setIosHelpOpen] = useState(false)

	if (!method) return null

	return (
		<>
			<button
				type='button'
				onClick={() => {
					if (method === 'prompt') void promptInstall()
					else setIosHelpOpen(true)
				}}
				className={cn(
					'inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-extrabold text-ink transition-colors hover:bg-ink/6 sm:px-3',
					className,
				)}
			>
				<Download aria-hidden='true' className='size-5' strokeWidth={2.5} />
				<span className='max-sm:sr-only'>{t('pwa.install')}</span>
			</button>

			<Dialog open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
				<DialogContent>
					<DialogTitle>{t('pwa.iosTitle')}</DialogTitle>
					<DialogDescription>{t('pwa.iosText')}</DialogDescription>
					<ol className='flex flex-col gap-4'>
						{IOS_STEPS.map(({ key, color }, index) => (
							<li key={key} className='flex items-center gap-4'>
								<span
									aria-hidden='true'
									className={cn(
										'text-5xl leading-none font-black [text-shadow:0_4px_0_var(--color-line-strong)]',
										color,
									)}
								>
									{index + 1}
								</span>
								<p className='text-lg font-bold'>
									<Trans
										i18nKey={`pwa.${key}`}
										components={{
											share: (
												<Share
													aria-label={t('pwa.share')}
													className='mx-0.5 inline size-5 -translate-y-0.5 stroke-[2.5] text-ocean-500'
												/>
											),
											b: <span className='font-black' />,
										}}
									/>
								</p>
							</li>
						))}
					</ol>
					<DialogClose asChild>
						<Button variant='neutral'>{t('pwa.gotIt')}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</>
	)
}
