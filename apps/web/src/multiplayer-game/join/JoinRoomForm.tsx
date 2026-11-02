import { useId, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import {
	Button,
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	Label,
} from '@/shared/ui'

const ROOM_CODE_LENGTH = 6

export function JoinRoomForm() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const inputId = useId()
	const [roomCode, setRoomCode] = useState('')
	const isComplete = roomCode.length === ROOM_CODE_LENGTH

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (isComplete) {
			navigate(`/multiplayer/room/${roomCode}`)
		}
	}

	return (
		<form
			className='flex flex-col items-center gap-6'
			onSubmit={handleSubmit}
		>
			<div className='flex flex-col items-center gap-3'>
				<Label htmlFor={inputId}>{t('multiplayer.join.roomCode')}</Label>
				<InputOTP
					id={inputId}
					autoFocus
					maxLength={ROOM_CODE_LENGTH}
					pattern='^[A-Za-z0-9]*$'
					inputMode='text'
					autoCapitalize='characters'
					autoComplete='off'
					spellCheck={false}
					value={roomCode}
					onChange={value => setRoomCode(value.toUpperCase())}
				>
					<InputOTPGroup>
						{Array.from({ length: ROOM_CODE_LENGTH }, (_, index) => (
							<InputOTPSlot key={index} index={index} />
						))}
					</InputOTPGroup>
				</InputOTP>
				<p className='text-center text-sm font-medium text-muted'>
					{t('multiplayer.join.description')}
				</p>
			</div>

			<Button
				type='submit'
				variant='grape'
				size='lg'
				className='w-full'
				disabled={!isComplete}
			>
				{t('multiplayer.join.submit')}
			</Button>
		</form>
	)
}
