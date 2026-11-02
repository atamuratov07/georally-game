import type { RoomMode } from '@georally/game-domain/multiplayer'
import type { CreateRoomRequest } from '@georally/game-protocol'
import { Presentation, UsersRound, type LucideIcon } from 'lucide-react'
import { useId, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	Button,
	IconTile,
	Input,
	Label,
	RadioCard,
	RadioGroup,
} from '@/shared/ui'
import { cn } from '@/shared/utils'

const ROOM_MODES: ReadonlyArray<{
	value: RoomMode
	icon: LucideIcon
	tone: 'ocean' | 'grape'
}> = [
	{ value: 'group', icon: UsersRound, tone: 'grape' },
	{ value: 'classroom', icon: Presentation, tone: 'ocean' },
]

const MODE_POINTS = ['point1', 'point2', 'point3'] as const

const BULLET_TONES = {
	ocean: 'bg-ocean-400',
	grape: 'bg-grape-400',
} as const

interface CreateRoomFormProps {
	onSubmit: (values: CreateRoomRequest) => Promise<void> | void
	pending: boolean
	submitError: string | null
}

export function CreateRoomForm({
	onSubmit,
	pending,
	submitError,
}: CreateRoomFormProps) {
	const { t } = useTranslation()
	const nameId = useId()
	const modeLabelId = useId()
	const [hostName, setHostName] = useState('')
	const [roomMode, setRoomMode] = useState<RoomMode>('group')
	const trimmedHostName = hostName.trim()

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (trimmedHostName) {
			void onSubmit({ hostName: trimmedHostName, roomMode })
		}
	}

	return (
		<form className='flex flex-col gap-6' onSubmit={handleSubmit}>
			<div className='flex flex-col gap-2.5'>
				<Label htmlFor={nameId}>{t('multiplayer.create.hostName')}</Label>
				<Input
					id={nameId}
					value={hostName}
					onChange={event => setHostName(event.target.value)}
					maxLength={20}
					autoComplete='nickname'
					placeholder={t('multiplayer.create.hostNamePlaceholder')}
				/>
			</div>

			<div className='flex flex-col gap-2.5'>
				<Label id={modeLabelId} asChild>
					<span>{t('multiplayer.create.roomMode')}</span>
				</Label>
				<RadioGroup
					aria-labelledby={modeLabelId}
					value={roomMode}
					onValueChange={value => setRoomMode(value as RoomMode)}
					className='grid-cols-1 sm:grid-cols-2'
				>
					{ROOM_MODES.map(({ value, icon: Icon, tone }) => (
						<RadioCard key={value} value={value} tone={tone}>
							<IconTile tone={tone} size='sm'>
								<Icon />
							</IconTile>
							<span className='flex flex-col gap-0.5 pr-6'>
								<span className='text-xl font-black'>
									{t(`multiplayer.modes.${value}.title`)}
								</span>
								<span className='text-sm font-semibold text-muted'>
									{t(`multiplayer.modes.${value}.summary`)}
								</span>
							</span>
							<span className='flex flex-col gap-1.5'>
								{MODE_POINTS.map(point => (
									<span
										key={point}
										className='flex items-start gap-2 text-sm font-medium'
									>
										<span
											aria-hidden='true'
											className={cn(
												'mt-1.5 size-2 shrink-0 rounded-full',
												BULLET_TONES[tone],
											)}
										/>
										{t(`multiplayer.modes.${value}.${point}`)}
									</span>
								))}
							</span>
						</RadioCard>
					))}
				</RadioGroup>
			</div>

			{submitError ? <Alert tone='error'>{submitError}</Alert> : null}

			<Button
				type='submit'
				size='lg'
				className='w-full'
				pending={pending}
				disabled={trimmedHostName.length === 0}
			>
				{t('multiplayer.create.submit')}
			</Button>
		</form>
	)
}
