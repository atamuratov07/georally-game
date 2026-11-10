import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import { HitRing } from '@/shared/map/HitRing'
import { FoundCounter } from '@/singleplayer-game/recall-sprint/components/FoundCounter'
import { MicButton } from '@/singleplayer-game/shared/components/MicButton'
import { DemoField } from './DemoField'
import { DemoMap } from './DemoMap'
import { DemoScreen } from './DemoScreen'
import { DemoStrip } from './DemoStrip'
import { cameraFor, labelPoint, onScreen } from './demoWorld'
import { demoName } from './demoNames'
import { useDemoTicks } from './useDemoTicks'

const EUROPE = new Set(
	'008 040 056 070 100 112 191 203 208 233 246 250 276 300 348 352 372 380 428 440 442 498 499 528 578 616 620 642 643 688 703 705 724 752 756 804 807 826'.split(
		' ',
	),
)
const EUROPE_TOTAL = 44

const FINDS = [
	{ voice: false, countries: ['250'] },
	{
		voice: true,
		countries: ['724', '300'],
	},
	{
		voice: true,
		countries: ['276', '616'],
	},
	{ voice: false, countries: ['380'] },
	{
		voice: true,
		countries: ['752', '578', '246'],
	},
	{ voice: false, countries: ['804'] },
] as const

const LISTEN_TICKS = 16
const AFTER_TICKS = 14
const END_TICKS = 40
const CAMERA = cameraFor([-11, 35, 40, 70], { top: 30, bottom: 110, side: 40 })
const REGION_FILL = '#c5ccd6'
const OUTSIDE_FILL = '#e4e8ed'
const LABEL_HALO = '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff'

export default function SprintDemo({ active }: { active: boolean }) {
	const { t } = useTranslation()
	const locale = useCurrentLocale()
	const voiceOn = defaultSpeechLanguage(locale) !== null
	const finds = useMemo(
		() =>
			FINDS.map(find => ({
				voice: find.voice && voiceOn,
				countries: find.countries.map(id => ({
					id,
					name: demoName(id, locale),
				})),
			})),
		[locale, voiceOn],
	)
	const answerTicks = finds.map(find =>
		find.voice ? LISTEN_TICKS : find.countries[0].name.length + 4,
	)
	const steps = [...answerTicks.map(ticks => ticks + AFTER_TICKS), END_TICKS]
	const cycleTicks = steps.reduce((sum, ticks) => sum + ticks, 0)
	const { cycle, step, at, still } = useDemoTicks(
		steps,
		cycleTicks - 1,
		active,
	)
	const doneSteps =
		step + (step < finds.length && at >= answerTicks[step] ? 1 : 0)
	const found = finds.slice(0, doneSteps).flatMap(find => find.countries)
	const foundIds = new Set<string>(found.map(country => country.id))
	const latest = !still && doneSteps > step ? finds[step].countries : []

	const current = finds[step]
	const answering = current !== undefined && at < answerTicks[step]
	const listening = Boolean(current?.voice)
	const typed =
		answering && !current.voice ? current.countries[0].name.slice(0, at) : ''
	const elapsed =
		steps.slice(0, step).reduce((sum, ticks) => sum + ticks, 0) + at
	const timeLeft = 1 - (elapsed / cycleTicks) * 0.7

	return (
		<DemoScreen>
			<DemoMap
				camera={CAMERA}
				fillOf={(id, base) =>
					foundIds.has(id)
						? base
						: EUROPE.has(id)
							? REGION_FILL
							: OUTSIDE_FILL
				}
			/>
			{found.map(({ id, name }) => {
				const [x, y] = onScreen(labelPoint(id), CAMERA)
				return (
					<span
						key={id}
						className='absolute -translate-x-1/2 -translate-y-1/2 animate-pop-in text-[13px] font-extrabold whitespace-nowrap text-ink'
						style={{ left: x, top: y, textShadow: LABEL_HALO }}
					>
						{name}
					</span>
				)
			})}
			{latest.map(({ id }) => {
				const [x, y] = onScreen(labelPoint(id), CAMERA)
				return (
					<span
						key={`${cycle}:${id}`}
						className='absolute -translate-x-1/2 -translate-y-1/2'
						style={{ left: x, top: y }}
					>
						<HitRing />
					</span>
				)
			})}

			<div className='absolute inset-x-0 top-0'>
				<DemoStrip fraction={timeLeft} frozen={false} />
			</div>

			<DemoField
				text={typed}
				placeholder={
					listening ? t('voice.listening') : t('recallSprint.placeholder')
				}
				listening={listening}
				correct={false}
				trailingWidth='counter'
				trailing={
					<>
						<FoundCounter
							key={cycle}
							found={found.length}
							total={EUROPE_TOTAL}
							chipFrom='above'
						/>
						{voiceOn ? (
							<MicButton listening={listening} onPress={() => {}} />
						) : null}
					</>
				}
			/>
		</DemoScreen>
	)
}
