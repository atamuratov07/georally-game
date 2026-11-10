import {
	Suspense,
	type ComponentType,
	type LazyExoticComponent,
	type ReactNode,
} from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { LocalizedLink } from '../LocalizedLink'
import { DEMO_SIZE } from './demoSize'
import { HIGHLIGHT_CLASS, SECTION_TITLE_CLASS } from './styles'
import { useNearViewport } from './useNearViewport'

interface ModeShowcaseProps {
	id: string
	copyKey: 'nameIt' | 'recallSprint'
	to: string
	Demo: LazyExoticComponent<ComponentType<{ active: boolean }>>
	demoSide: 'left' | 'right'
	accent: keyof typeof ACCENTS
	badgeIcon?: ReactNode
	text?: string
}

const ACCENTS = {
	ocean: {
		badge: 'border-ocean-600 bg-ocean-500 [--edge:var(--color-ocean-700)]',
		button: 'ocean',
	},
	coral: {
		badge: 'border-coral-600 bg-coral-500 [--edge:var(--color-coral-700)]',
		button: 'coral',
	},
} as const

function DemoPlaceholder() {
	return (
		<div
			className='mx-auto w-full max-w-xl rounded-[28px] bg-ocean-100'
			style={{ aspectRatio: `${DEMO_SIZE.width} / ${DEMO_SIZE.height}` }}
		/>
	)
}

export function ModeShowcase({
	id,
	copyKey,
	to,
	Demo,
	demoSide,
	accent,
	badgeIcon,
	text,
}: ModeShowcaseProps) {
	const { t } = useTranslation()
	const { ref, near } = useNearViewport<HTMLDivElement>()

	return (
		<section
			id={id}
			aria-labelledby={`${id}-title`}
			className='grid scroll-mt-8 items-center gap-10 lg:grid-cols-2 lg:gap-14'
		>
			<div
				className={cn(
					'flex flex-col items-center gap-5 text-center lg:items-start lg:text-left',
					demoSide === 'left' && 'lg:order-2',
				)}
			>
				<span
					className={cn(
						'raised inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 px-3.5 py-1 text-sm font-black tracking-wide text-white uppercase [--edge-size:3px]',
						ACCENTS[accent].badge,
					)}
				>
					{badgeIcon}
					{t(`landing.${copyKey}.eyebrow`)}
				</span>
				<h2 id={`${id}-title`} className={SECTION_TITLE_CLASS}>
					<Trans
						i18nKey={`landing.${copyKey}.title`}
						components={{ hl: <span className={HIGHLIGHT_CLASS} /> }}
					/>
				</h2>
				{text ? (
					<p className='max-w-xl text-lg font-medium text-muted sm:text-xl'>
						{text}
					</p>
				) : null}
				<Button
					asChild
					size='lg'
					variant={ACCENTS[accent].button}
					className='mt-2'
				>
					<LocalizedLink to={to}>
						{t(`landing.${copyKey}.cta`)}
					</LocalizedLink>
				</Button>
			</div>

			<div ref={ref} className={cn(demoSide === 'left' && 'lg:order-1')}>
				{near ? (
					<Suspense fallback={<DemoPlaceholder />}>
						<Demo active={near} />
					</Suspense>
				) : (
					<DemoPlaceholder />
				)}
			</div>
		</section>
	)
}
