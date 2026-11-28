import {
	Suspense,
	type ComponentType,
	type LazyExoticComponent,
	type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { LocalizedLink } from '../LocalizedLink'
import { DEMO_SIZE } from './demoSize'
import { ShowcaseBadge, type ShowcaseTone } from './ShowcaseBadge'
import { SECTION_TITLE_CLASS } from './styles'
import { useNearViewport } from './useNearViewport'

interface ModeShowcaseProps {
	id: string
	copyKey: 'nameIt' | 'recallSprint' | 'routes'
	eyebrow: string
	to: string
	Demo: LazyExoticComponent<ComponentType<{ active: boolean }>>
	demoSide: 'left' | 'right'
	accent: ShowcaseTone
	badgeIcon?: ReactNode
}

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
	eyebrow,
	to,
	Demo,
	demoSide,
	accent,
	badgeIcon,
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
				<ShowcaseBadge tone={accent}>
					{badgeIcon}
					{eyebrow}
				</ShowcaseBadge>
				<h2 id={`${id}-title`} className={SECTION_TITLE_CLASS}>
					{t(`landing.${copyKey}.title`)}
				</h2>
				<p className='max-w-xl text-lg font-medium text-on-sky-soft sm:text-xl'>
					{t(`landing.${copyKey}.text`)}
				</p>
				<Button asChild size='lg' variant={accent} className='mt-2'>
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
