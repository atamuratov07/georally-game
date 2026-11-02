import logo from '../assets/logo.png'
import { ScreenShell } from '../shared/ui'
import {
	EyeIcon,
	Gamepad2Icon,
	MousePointerClickIcon,
	MoveRightIcon,
	SwordsIcon,
	UsersRoundIcon,
	ZapIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LocalizedLink } from './LocalizedLink'
import { LanguageSwitcher } from '../shared/i18n'

export default function HomePage() {
	const { t } = useTranslation()

	return (
		<ScreenShell className=''>
			{/* Hero Section */}
			<section className='relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-12 sm:px-8 lg:px-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'>
				{/* Animated background elements */}
				<div className='absolute inset-0 pointer-events-none'>
					<div className='absolute top-10 left-5 w-72 h-72 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-3xl animate-pulse'></div>
					<div
						className='absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-tl from-cyan-400/20 to-transparent blur-3xl animate-pulse'
						style={{ animationDelay: '1s' }}
					></div>
					<div
						className='absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-amber-300/20 to-transparent blur-3xl animate-pulse'
						style={{ animationDelay: '2s' }}
					></div>
				</div>

				<div className='relative z-10 h-full mx-auto max-w-5xl'>
					{/* Logo/Brand */}
					<div className='mb-4 sm:mb-8 flex items-end gap-3  animate-fade-in'>
						{' '}
						<img src={logo} alt={t('app.name')} className='h-10 w-10' />
						<h2 className='text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-lg'>
							{t('app.name')}
						</h2>
					</div>

					{/* Main Headline */}
					<h1 className='mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl'>
						{t('landing.heroTitleLine1')}
						<br />
						<span className='bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-300 bg-clip-text text-transparent'>
							{t('landing.heroTitleLine2')}
						</span>
					</h1>

					{/* Subheading */}
					<p className='mb-6 sm:mb-8 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl'>
						{t('landing.heroSubheading')}
					</p>

					{/* Challenge callout */}
					<div className='mb-8 sm:mb-12 rounded-3xl bg-gradient-to-br from-rose-500/30 to-purple-500/30 border-2 border-rose-400/60 p-5 sm:p-8 space-y-3 backdrop-blur-md shadow-2xl shadow-rose-500/20'>
						<p className='text-sm font-black uppercase tracking-widest text-rose-300'>
							{t('landing.calloutLabel')}
						</p>
						<p className='text-lg font-bold text-white'>
							{t('landing.calloutText')}
						</p>
					</div>

					{/* CTA Buttons - Primary */}
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
						<LocalizedLink
							to='/singleplayer'
							className='group relative inline-flex items-center justify-center px-8 py-4 font-black uppercase tracking-wider text-slate-950 transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-xl hover:shadow-2xl'
						>
							<span className='relative z-10'>
								{t('landing.ctaSolo')}
							</span>
							<div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
						</LocalizedLink>

						<LocalizedLink
							to='/multiplayer'
							className='group relative inline-flex items-center justify-center px-8 py-4 font-black uppercase tracking-wider text-white transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 shadow-xl hover:shadow-2xl'
						>
							<span className='relative z-10'>
								{t('landing.ctaMultiplayer')}
							</span>
							<div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
						</LocalizedLink>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='relative px-4 py-20 sm:px-8 lg:px-12 bg-gradient-to-b from-slate-900/50 to-slate-950'>
				<div className='mx-auto max-w-6xl'>
					<h2 className='mb-12 text-center text-4xl font-black tracking-tight text-white sm:text-5xl'>
						<span className='bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'>
							{t('landing.featuresHeading')}
						</span>
					</h2>

					<div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
						{/* Feature 1 */}
						<div className='group rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 transform hover:-translate-y-2'>
							<MousePointerClickIcon className='mb-4 h-10 w-10 text-purple-500/80' />
							<h3 className='mb-3 text-lg font-black text-white'>
								{t('landing.feature1Title')}
							</h3>
							<p className='text-sm leading-relaxed text-slate-300'>
								{t('landing.feature1Text')}
							</p>
						</div>

						{/* Feature 2 */}
						<div className='group rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-400/30 p-8 backdrop-blur-sm hover:border-cyan-400/60 transition-all duration-300 transform hover:-translate-y-2'>
							<UsersRoundIcon className='mb-4 h-10 w-10 text-cyan-500/80' />
							<h3 className='mb-3 text-lg font-black text-white'>
								{t('landing.feature2Title')}
							</h3>
							<p className='text-sm leading-relaxed text-slate-300'>
								{t('landing.feature2Text')}
							</p>
						</div>

						{/* Feature 3 */}
						<div className='group rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 p-8 backdrop-blur-sm hover:border-amber-400/60 transition-all duration-300 transform hover:-translate-y-2'>
							<EyeIcon className='mb-4 h-10 w-10 text-amber-500/80' />
							<h3 className='mb-3 text-lg font-black text-white'>
								{t('landing.feature3Title')}
							</h3>
							<p className='text-sm leading-relaxed text-slate-300'>
								{t('landing.feature3Text')}
							</p>
						</div>

						{/* Feature 4 */}
						<div className='group rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-400/30 p-8 backdrop-blur-sm hover:border-pink-400/60 transition-all duration-300 transform hover:-translate-y-2'>
							<ZapIcon className='mb-4 h-10 w-10 text-pink-500/80' />
							<h3 className='mb-3 text-lg font-black text-white'>
								{t('landing.feature4Title')}
							</h3>
							<p className='text-sm leading-relaxed text-slate-300'>
								{t('landing.feature4Text')}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Game Modes Section */}
			<section className='relative px-4 py-20 sm:px-8 lg:px-12 bg-gradient-to-b from-slate-950 to-slate-900/80'>
				<div className='mx-auto max-w-6xl'>
					<h2 className='mb-12 text-center text-4xl font-black tracking-tight text-white sm:text-5xl'>
						<span className='bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent'>
							{t('landing.modesHeading')}
						</span>
					</h2>

					<div className='grid gap-8 lg:grid-cols-2'>
						{/* Solo Card */}
						<LocalizedLink
							to='/singleplayer'
							className='group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 border-2 border-amber-400/50 p-12 backdrop-blur-sm transition-all duration-300 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-500/20 active:scale-95'
						>
							<div className='absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
							<div className='relative z-10'>
								<div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-4xl shadow-lg'>
									<Gamepad2Icon className='h-12 w-12 transition-colors text-orange-700 group-hover:text-amber-200' />
								</div>
								<h3 className='mb-3 text-3xl font-black text-white'>
									{t('landing.soloCardTitle')}
								</h3>
								<p className='mb-6 text-base leading-relaxed text-slate-200'>
									{t('landing.soloCardText')}
								</p>
								<ul className='space-y-2 text-sm text-slate-300'>
									<li className='flex items-center gap-2'>
										<span className='text-amber-400'>✓</span>{' '}
										{t('landing.soloBullet1')}
									</li>
									<li className='flex items-center gap-2'>
										<span className='text-amber-400'>✓</span>{' '}
										{t('landing.soloBullet2')}
									</li>
									<li className='flex items-center gap-2'>
										<span className='text-amber-400'>✓</span>{' '}
										{t('landing.soloBullet3')}
									</li>
								</ul>
								<div className='mt-8 inline-flex rounded-xl bg-amber-500 px-6 py-3 group-hover:scale-110 font-black uppercase tracking-wider text-slate-950 shadow-lg group-hover:shadow-xl transition-all'>
									{t('landing.soloCta')}{' '}
									<MoveRightIcon className='w-5 transition-all ml-2 group-hover:ml-4' />
								</div>
							</div>
						</LocalizedLink>

						{/* Multiplayer Card */}
						<LocalizedLink
							to='/multiplayer'
							className='group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border-2 border-cyan-400/50 p-12 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-95'
						>
							<div className='absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
							<div className='relative z-10'>
								<div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 text-4xl shadow-lg'>
									<SwordsIcon className='h-12 w-12 text-indigo-600 group-hover:text-cyan-300' />
								</div>
								<h3 className='mb-3 text-3xl font-black text-white'>
									{t('landing.multiCardTitle')}
								</h3>
								<p className='mb-6 text-base leading-relaxed text-slate-200'>
									{t('landing.multiCardText')}
								</p>
								<ul className='space-y-2 text-sm text-slate-300'>
									<li className='flex items-center gap-2'>
										<span className='text-cyan-400'>✓</span>{' '}
										{t('landing.multiBullet1')}
									</li>
									<li className='flex items-center gap-2'>
										<span className='text-cyan-400'>✓</span>{' '}
										{t('landing.multiBullet2')}
									</li>
									<li className='flex items-center gap-2'>
										<span className='text-cyan-400'>✓</span>{' '}
										{t('landing.multiBullet3')}
									</li>
								</ul>
								<div className='mt-8 inline-flex rounded-xl bg-cyan-500 px-6 py-3 group-hover:scale-110 font-black uppercase tracking-wider text-slate-950 shadow-lg group-hover:shadow-xl transition-all'>
									{t('landing.multiCta')}{' '}
									<MoveRightIcon className='w-5 transition-all ml-2 group-hover:ml-4' />
								</div>
							</div>
						</LocalizedLink>
					</div>
				</div>
			</section>

			{/* For Section */}
			<section className='relative px-4 py-16 sm:px-8 lg:px-12 bg-gradient-to-b from-slate-900/80 to-slate-950'>
				<div className='mx-auto max-w-4xl'>
					<h2 className='mb-12 text-center text-3xl font-black tracking-tight text-white sm:text-4xl'>
						<span className='bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
							{t('landing.forHeading')}
						</span>
					</h2>

					<div className='grid gap-8 sm:grid-cols-2'>
						<div className='rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm'>
							<h3 className='mb-4 text-2xl font-black text-white'>
								{t('landing.studentsTitle')}
							</h3>
							<ul className='space-y-3 text-slate-300'>
								<li className='flex items-start gap-3'>
									<span className='text-cyan-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.studentsBullet1')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-cyan-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.studentsBullet2')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-cyan-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.studentsBullet3')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-cyan-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.studentsBullet4')}</span>
								</li>
							</ul>
						</div>

						<div className='rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm'>
							<h3 className='mb-4 text-2xl font-black text-white'>
								{t('landing.teachersTitle')}
							</h3>
							<ul className='space-y-3 text-slate-300'>
								<li className='flex items-start gap-3'>
									<span className='text-amber-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.teachersBullet1')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-amber-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.teachersBullet2')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-amber-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.teachersBullet3')}</span>
								</li>
								<li className='flex items-start gap-3'>
									<span className='text-amber-400 font-black mt-1'>
										→
									</span>
									<span>{t('landing.teachersBullet4')}</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Footer CTA */}
			<section className='relative px-4 py-16 sm:px-8 lg:px-12 bg-slate-950 border-t border-white/10'>
				<div className='mx-auto max-w-4xl text-center'>
					<h2 className='mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl'>
						{t('landing.footerHeading')}
					</h2>
					<p className='mb-10 text-lg text-slate-300'>
						{t('landing.footerText')}
					</p>

					<div className='flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center'>
						<LocalizedLink
							to='/singleplayer'
							className='inline-block px-8 py-4 font-black uppercase tracking-wider text-slate-950 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
						>
							{t('landing.footerCtaSolo')}
						</LocalizedLink>
						<LocalizedLink
							to='/multiplayer'
							className='inline-block px-8 py-4 font-black uppercase tracking-wider text-white rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
						>
							{t('landing.footerCtaMulti')}
						</LocalizedLink>
					</div>
				</div>
			</section>

			<LanguageSwitcher
				tone='dark'
				className='fixed z-100 top-5 sm:top-10 right-5 sm:right-10'
			/>
		</ScreenShell>
	)
}
