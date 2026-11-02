import type { CreateRoomRequest } from '@georally/game-protocol'
import { Crown, LogIn } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useLocalizedNavigate } from '@/app/useLocalizedNavigate'
import { trackRoomCreated } from '@/shared/analytics/track'
import { BackLink, PageShell } from '@/shared/layout'
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
import { formatGatewayErrorMessage } from '../api/errors'
import { createRoom } from '../api/roomsApi'
import { CreateRoomForm } from '../create/CreateRoomForm'
import { JoinRoomForm } from '../join/JoinRoomForm'
import { saveRoomSession } from '../session/sessionStorage'

type MultiplayerTab = 'join' | 'host'

export default function HomePage() {
	const { t } = useTranslation()
	const navigate = useLocalizedNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const [createError, setCreateError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)
	const tab: MultiplayerTab =
		searchParams.get('tab') === 'host' ? 'host' : 'join'

	const handleCreateRoom = useCallback(
		async (values: CreateRoomRequest) => {
			setIsCreating(true)
			setCreateError(null)

			try {
				const response = await createRoom({
					hostName: values.hostName,
					roomMode: values.roomMode,
				})

				saveRoomSession({ ...response, savedAt: Date.now() })
				trackRoomCreated(values.roomMode)
				navigate(`/multiplayer/host/${response.roomCode}`)
			} catch (error) {
				setCreateError(formatGatewayErrorMessage(error))
			} finally {
				setIsCreating(false)
			}
		},
		[navigate],
	)

	return (
		<PageShell width='lg'>
			<BackLink to='/'>{t('common.home')}</BackLink>
			<h1 className='sr-only'>{t('multiplayer.title')}</h1>
			<Tabs
				value={tab}
				onValueChange={value => {
					setSearchParams(value === 'host' ? { tab: 'host' } : {}, {
						replace: true,
					})
				}}
			>
				<TabsList className='mx-auto max-w-md'>
					<TabsTrigger value='join'>
						<LogIn aria-hidden='true' />
						{t('multiplayer.tabs.join')}
					</TabsTrigger>
					<TabsTrigger value='host'>
						<Crown aria-hidden='true' />
						{t('multiplayer.tabs.host')}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='join'>
					<Card className='mx-auto max-w-md animate-pop-in'>
						<JoinRoomForm />
					</Card>
				</TabsContent>
				<TabsContent value='host'>
					<Card className='animate-pop-in'>
						<CreateRoomForm
							onSubmit={handleCreateRoom}
							pending={isCreating}
							submitError={createError}
						/>
					</Card>
				</TabsContent>
			</Tabs>
		</PageShell>
	)
}
