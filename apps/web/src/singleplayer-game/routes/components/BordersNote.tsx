import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	TextButton,
} from '@/shared/ui'
import { cn } from '@/shared/utils'

const CASES = [
	{ key: 'fixedLinks', color: 'text-ink' },
	{ key: 'frenchGuiana', color: 'text-ocean-600' },
	{ key: 'ceutaMelilla', color: 'text-coral-600' },
	{ key: 'kaliningrad', color: 'text-grape-600' },
	{ key: 'cabinda', color: 'text-grass-700' },
	{ key: 'kazungula', color: 'text-sunflower-700' },
	{ key: 'gaps', color: 'text-ink' },
] as const

export function BordersNote() {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)

	return (
		<>
			<TextButton
				type='button'
				className='inline h-auto p-0 align-baseline text-base text-ink underline decoration-2 underline-offset-4'
				onClick={() => setOpen(true)}
			>
				{t('routes.borders.open')}
			</TextButton>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className='max-h-[calc(100%-1rem)] overflow-y-auto'>
					<DialogTitle>{t('routes.borders.title')}</DialogTitle>
					<DialogDescription>{t('routes.borders.rule')}</DialogDescription>
					<ul className='flex flex-col gap-3'>
						{CASES.map(({ key, color }) => (
							<li key={key} className='font-semibold'>
								<Trans
									i18nKey={`routes.borders.${key}`}
									components={{
										b: <span className={cn('font-black', color)} />,
									}}
								/>
							</li>
						))}
					</ul>
					<DialogClose asChild>
						<Button variant='neutral'>{t('routes.borders.done')}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</>
	)
}
