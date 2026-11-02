import { OTPInput, OTPInputContext } from 'input-otp'
import { useContext, type ComponentProps } from 'react'
import { cn } from '@/shared/utils'

function InputOTP({
	className,
	containerClassName,
	...props
}: ComponentProps<typeof OTPInput> & {
	containerClassName?: string
}) {
	return (
		<OTPInput
			data-slot='input-otp'
			containerClassName={cn(
				'flex items-center gap-2 pb-1 has-disabled:opacity-55',
				containerClassName,
			)}
			className={cn('disabled:cursor-not-allowed', className)}
			{...props}
		/>
	)
}

function InputOTPGroup({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			data-slot='input-otp-group'
			className={cn('flex items-center gap-1.5 sm:gap-2', className)}
			{...props}
		/>
	)
}

function InputOTPSlot({
	index,
	className,
	...props
}: ComponentProps<'div'> & { index: number }) {
	const context = useContext(OTPInputContext)
	const { char, hasFakeCaret, isActive } = context?.slots[index] ?? {}

	return (
		<div
			data-slot='input-otp-slot'
			data-active={isActive}
			data-filled={Boolean(char)}
			className={cn(
				'relative flex size-12 items-center justify-center rounded-control border-2 border-line-strong bg-white text-2xl font-black text-ink uppercase sm:size-14 sm:text-3xl',
				'shadow-[0_4px_0_0_var(--color-line-strong)] transition-[border-color,box-shadow,background-color]',
				'data-[filled=true]:border-ocean-500 data-[filled=true]:bg-ocean-50 data-[filled=true]:shadow-[0_4px_0_0_var(--color-ocean-500)]',
				'data-[active=true]:border-ocean-500 data-[active=true]:ring-4 data-[active=true]:ring-ocean-200',
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret ? (
				<div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
					<div className='h-7 w-0.5 animate-caret-blink rounded-full bg-ink' />
				</div>
			) : null}
		</div>
	)
}

export { InputOTP, InputOTPGroup, InputOTPSlot }
