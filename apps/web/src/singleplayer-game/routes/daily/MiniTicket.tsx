import { Lock, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { cn } from '@/shared/utils'
import { clock } from './clock'
import type { StubAction, StubContent } from './stubContent'
import './ticket.css'

// Dynamic, so the home page doesn't pull the catalog in.
const prefetchGame = () => {
	void import('./DailyGamePage')
	void import('@/shared/map/prefetchMap').then(map => map.prefetchMap())
}

function TicketLink({
	content,
	titled = false,
	className,
	children,
}: {
	content: StubContent
	titled?: boolean
	className?: string
	children: ReactNode
}) {
	const { t } = useTranslation()
	const prefetch = content.action.kind === 'result' ? undefined : prefetchGame

	return (
		<LocalizedLink
			to={content.to}
			onClick={content.onOpen}
			onPointerEnter={prefetch}
			onFocus={prefetch}
			className={cn(
				'group block rounded-2xl transition-transform duration-200 outline-offset-4 hover:-translate-y-0.5 hover:rotate-1 active:translate-y-0.5',
				className,
			)}
		>
			{titled ? null : <span className='sr-only'>{t('daily.title')} </span>}
			{children}
		</LocalizedLink>
	)
}

const TICKET_SHADOW =
	'[filter:drop-shadow(0_5px_0_var(--color-grass-800))_drop-shadow(0_14px_14px_rgb(24_34_61/0.18))]'

function TicketNumber({ value }: { value: number }) {
	return (
		<span className='text-3xl leading-none font-black tracking-tight'>
			<span className='text-sunflower-300'>#</span>
			{value}
		</span>
	)
}

function Eyebrow({ children }: { children: ReactNode }) {
	return (
		<span className='truncate text-xs font-extrabold tracking-wide text-sunflower-200 uppercase'>
			{children}
		</span>
	)
}

export function MiniTicket({
	content,
	flame,
	className,
}: {
	content: StubContent
	flame?: ReactNode
	className?: string
}) {
	return (
		<TicketLink content={content} className={className}>
			<span className={cn('flex h-[4.5rem]', TICKET_SHADOW)}>
				<span className='daily-mini-left flex min-w-0 flex-1 items-center gap-3 rounded-l-2xl bg-grass-500 px-4 text-white'>
					{flame}
					<span className='flex min-w-0 flex-col gap-0.5'>
						<Eyebrow>{content.eyebrow}</Eyebrow>
						<TicketNumber value={content.number} />
					</span>
				</span>
				<span className='daily-mini-right flex shrink-0 items-center gap-2 rounded-r-2xl border-l-2 border-dashed border-white/35 bg-grass-600 px-5 font-black text-white'>
					<TicketAction action={content.action} align='end' />
				</span>
			</span>
		</TicketLink>
	)
}

export function PortraitTicket({
	content,
	className,
}: {
	content: StubContent
	className?: string
}) {
	const { t } = useTranslation()

	return (
		<TicketLink
			content={content}
			titled={!content.carried}
			className={cn('h-full', className)}
		>
			<span className={cn('flex h-full flex-col', TICKET_SHADOW)}>
				<span className='daily-ticket-top [--notch:11px] flex flex-1 flex-col items-center justify-center gap-1 rounded-t-2xl bg-grass-500 px-3 pt-4 pb-3 text-center text-white'>
					<Eyebrow>
						{content.carried ? content.eyebrow : t('daily.title')}
					</Eyebrow>
					<span className='text-[2.75rem] leading-none font-black tracking-tight'>
						<span className='text-sunflower-300'>#</span>
						{content.number}
					</span>
				</span>
				<span className='daily-ticket-stub [--notch:11px] flex min-h-[4.25rem] items-center justify-center gap-2 rounded-b-2xl border-t-2 border-dashed border-white/35 bg-grass-600 px-3 py-3 font-black text-white'>
					<TicketAction action={content.action} align='center' />
				</span>
			</span>
		</TicketLink>
	)
}

function TicketAction({
	action,
	align,
}: {
	action: StubAction
	align: 'end' | 'center'
}) {
	const { t } = useTranslation()

	switch (action.kind) {
		case 'opens':
			return (
				<>
					<Lock aria-hidden='true' className='size-5 text-sunflower-200' />
					<Timer label={t('daily.opensIn')} ms={action.ms} align={align} />
				</>
			)
		case 'result':
			return (
				<span
					className={cn(
						'flex flex-col gap-1',
						align === 'end' ? 'items-end' : 'items-center',
					)}
				>
					<span className='text-2xl leading-none'>{action.score}</span>
					<Timer label={t('daily.nextIn')} ms={action.ms} align={align} />
				</span>
			)
		default:
			return (
				<>
					<Play
						aria-hidden='true'
						fill='currentColor'
						className='size-5 text-sunflower-300 transition-transform group-hover:translate-x-0.5'
					/>
					<span className='text-lg'>
						{t(
							action.kind === 'continue'
								? 'daily.continue'
								: 'daily.play',
						)}
					</span>
				</>
			)
	}
}

function Timer({
	label,
	ms,
	align,
}: {
	label: string
	ms: number
	align: 'end' | 'center'
}) {
	return (
		<span
			className={cn(
				'flex flex-col leading-tight',
				align === 'end'
					? 'items-end text-right'
					: 'items-center text-center',
			)}
		>
			<span className='text-[0.625rem] font-extrabold tracking-wide text-sunflower-200 uppercase'>
				{label}
			</span>
			<span className='text-sm tabular-nums'>{clock(ms)}</span>
		</span>
	)
}
