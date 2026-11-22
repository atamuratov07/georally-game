import { motion } from 'motion/react'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	type MouseEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from '@/app/LocalizedLink'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { useLocalizedSearchParams } from '@/app/useLocalizedSearchParams'
import { cn } from '@/shared/utils'
import { SINGLEPLAYER_MODES } from '../../modes'
import { singleplayerPaths, type SingleplayerModeId } from '../../paths'
import { MODE_TONES } from './modeTones'

const SHARED_PARAMS = ['regions', 'scope', 'difficulty']
const SETTLE_MS = 120
const TAB_CELL = 'grid shrink-0 basis-[44vw] snap-center sm:basis-auto'

function centredLeft(nav: HTMLElement, cell: HTMLElement): number {
	return cell.offsetLeft - (nav.clientWidth - cell.offsetWidth) / 2
}

function isCarousel(nav: HTMLElement): boolean {
	return nav.scrollWidth > nav.clientWidth
}

export function ModeTabs({ current }: { current: SingleplayerModeId }) {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [searchParams] = useLocalizedSearchParams()
	const shared = new URLSearchParams(
		SHARED_PARAMS.flatMap(key => {
			const value = searchParams.get(key)
			return value === null ? [] : [[key, value]]
		}),
	).toString()
	const search = shared ? `?${shared}` : ''
	const navRef = useRef<HTMLElement>(null)
	const switchingRef = useRef<SingleplayerModeId | null>(null)

	const goTo = useCallback(
		(mode: SingleplayerModeId) => {
			if (mode === current || switchingRef.current === mode) return
			switchingRef.current = mode
			navigate({ pathname: singleplayerPaths(mode).setup, search })
		},
		[current, navigate, search],
	)

	useLayoutEffect(() => {
		const nav = navRef.current
		const index = SINGLEPLAYER_MODES.findIndex(mode => mode.id === current)
		const cell = nav?.children[index]
		if (nav && cell instanceof HTMLElement && isCarousel(nav)) {
			nav.scrollLeft = centredLeft(nav, cell)
		}
	}, [current])

	useEffect(() => {
		const nav = navRef.current
		if (!nav) return
		let timer: number | undefined

		const settle = () => {
			if (!isCarousel(nav)) return
			const centre = nav.scrollLeft + nav.clientWidth / 2
			const cells = Array.from(nav.children) as HTMLElement[]
			const distances = cells.map(cell =>
				Math.abs(cell.offsetLeft + cell.offsetWidth / 2 - centre),
			)
			const mode =
				SINGLEPLAYER_MODES[distances.indexOf(Math.min(...distances))]
			if (mode) goTo(mode.id)
		}
		const handleScroll = () => {
			clearTimeout(timer)
			timer = window.setTimeout(settle, SETTLE_MS)
		}
		const event = 'onscrollend' in nav ? 'scrollend' : 'scroll'
		const listener = event === 'scrollend' ? settle : handleScroll

		nav.addEventListener(event, listener, { passive: true })
		return () => {
			clearTimeout(timer)
			nav.removeEventListener(event, listener)
		}
	}, [goTo])

	function handleTabClick(
		event: MouseEvent<HTMLAnchorElement>,
		mode: SingleplayerModeId,
	) {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return
		}
		event.preventDefault()
		const nav = navRef.current
		const cell = event.currentTarget.closest<HTMLElement>('[data-mode-tab]')
		if (nav && cell && isCarousel(nav)) {
			nav.scrollTo({ left: centredLeft(nav, cell), behavior: 'smooth' })
		} else {
			goTo(mode)
		}
	}

	return (
		<nav
			ref={navRef}
			aria-label={t('singleplayer.modes.label')}
			className={cn(
				'sticky top-0 z-20 -mx-2.5 mb-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-[28vw] pt-2 pb-3',
				'[mask-image:linear-gradient(to_right,rgb(0_0_0/0.15),#000_27%,#000_73%,rgb(0_0_0/0.15))] sm:[mask-image:none]',
				'[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
				'sm:static sm:mx-0 sm:mb-6 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:p-0',
			)}
		>
			{SINGLEPLAYER_MODES.map(mode => {
				const active = mode.id === current
				const tone = MODE_TONES[mode.tone]
				const link = (
					<LocalizedLink
						to={{ pathname: singleplayerPaths(mode.id).setup, search }}
						aria-current={active ? 'page' : undefined}
						onClick={
							active
								? undefined
								: event => handleTabClick(event, mode.id)
						}
						className={cn(
							'grid h-11 min-w-0 place-items-center rounded-control border-2 px-2 text-base font-black whitespace-nowrap sm:h-14 sm:text-lg',
							active
								? cn('raised [--edge-size:5px]', tone.fill)
								: cn(
										'pressable border-white bg-white [--edge-size:4px]',
										tone.idle,
									),
						)}
					>
						{t(mode.titleKey)}
					</LocalizedLink>
				)

				return (
					<div key={mode.id} data-mode-tab className={TAB_CELL}>
						{active ? (
							<motion.div
								initial={{ y: 0, scale: 0.94 }}
								animate={{ y: -4, scale: 1 }}
								transition={{
									type: 'spring',
									stiffness: 520,
									damping: 22,
								}}
								className='grid'
							>
								{link}
							</motion.div>
						) : (
							link
						)}
					</div>
				)
			})}
		</nav>
	)
}
