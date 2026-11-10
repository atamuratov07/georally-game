import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from '@/app/LocaleContext'
import { defaultSpeechLanguage } from '@/shared/answers/speechLanguage'
import {
	REVEALED_FILL,
	SELECTION_EDGE,
	SELECTION_FILL,
} from '@/shared/map/map-styles'
import { ScoreBanner } from '@/shared/widgets/ScoreBanner'
import { MicButton } from '@/singleplayer-game/shared/components/MicButton'
import {
	NextButton,
	ProgressChip,
} from '@/singleplayer-game/name-it/components/RoundButtons'
import { DemoField } from './DemoField'
import { DemoMap } from './DemoMap'
import { DemoScreen } from './DemoScreen'
import { DemoStrip } from './DemoStrip'
import { cameraFor, DEMO_COUNTRIES } from './demoWorld'
import { demoName } from './demoNames'
import { useDemoTicks } from './useDemoTicks'

const ROUNDS = [
	{ id: '380', points: 94, voice: false },
	{ id: '392', points: 88, voice: true },
	{ id: '036', points: 91, voice: false },
	{ id: '076', points: 83, voice: true },
	{ id: '356', points: 97, voice: false },
	{ id: '826', points: 86, voice: true },
] as const

const FLY_TICKS = 14
const LISTEN_TICKS = 14
const REVEAL_TICKS = 26
const QUESTION_COUNT = 10
const INSETS = { top: 170, bottom: 120, side: 120 }
const CAMERAS = ROUNDS.map(round => cameraFor(round.id, INSETS))
const SHAPES = ROUNDS.map(
	round => DEMO_COUNTRIES.find(country => country.id === round.id)?.d ?? '',
)
const TOTALS = ROUNDS.map((_, index) =>
	ROUNDS.slice(0, index + 1).reduce((sum, round) => sum + round.points, 0),
)

export default function NameItDemo({ active }: { active: boolean }) {
	const { t } = useTranslation()
	const locale = useCurrentLocale()
	const voiceOn = defaultSpeechLanguage(locale) !== null
	const names = useMemo(
		() => ROUNDS.map(round => demoName(round.id, locale)),
		[locale],
	)
	const answerTicks = ROUNDS.map(
		(round, index) =>
			FLY_TICKS +
			(round.voice && voiceOn ? LISTEN_TICKS : names[index].length + 4),
	)
	const {
		cycle,
		step: index,
		at,
	} = useDemoTicks(
		answerTicks.map(ticks => ticks + REVEAL_TICKS),
		answerTicks[0],
		active,
	)

	const round = ROUNDS[index]
	const answering = at < answerTicks[index]
	const settled = at >= FLY_TICKS
	const byVoice = round.voice && voiceOn
	const listening = byVoice && answering && settled
	const typed = byVoice ? '' : names[index].slice(0, at - FLY_TICKS)
	const timeLeft = settled
		? 1 -
			((Math.min(at, answerTicks[index]) - FLY_TICKS) /
				(answerTicks[index] - FLY_TICKS)) *
				0.6
		: 1

	return (
		<DemoScreen>
			<DemoMap camera={CAMERAS[index]} fillOf={(_, base) => base}>
				<path
					d={SHAPES[index]}
					fill={answering ? SELECTION_FILL : REVEALED_FILL}
					stroke={answering ? SELECTION_EDGE : '#2a7a16'}
					strokeWidth={2}
					strokeLinejoin='round'
					vectorEffect='non-scaling-stroke'
					className='transition-[fill,stroke] duration-300'
				/>
			</DemoMap>

			<div className='absolute inset-x-0 top-0'>
				<DemoStrip fraction={timeLeft} frozen={!answering} />
			</div>
			<ProgressChip
				current={index + 1}
				total={QUESTION_COUNT}
				className='absolute top-5 right-4'
			/>
			<div className='absolute inset-x-0 top-0 h-0 origin-top scale-75'>
				<ScoreBanner
					className='top-6'
					triggerKey={answering ? null : `${cycle}:${index}`}
					isCorrect
					totalScore={TOTALS[index]}
					awardedScore={round.points}
					durationMs={REVEAL_TICKS * 80}
				/>
			</div>

			<DemoField
				text={answering ? typed : names[index]}
				placeholder={
					listening ? t('voice.listening') : t('nameIt.placeholder')
				}
				listening={listening}
				correct={!answering}
				trailingWidth='button'
				trailing={
					!answering ? (
						<NextButton size='inline' onNext={() => {}} />
					) : voiceOn && settled ? (
						<MicButton listening={listening} onPress={() => {}} />
					) : null
				}
			/>
		</DemoScreen>
	)
}
