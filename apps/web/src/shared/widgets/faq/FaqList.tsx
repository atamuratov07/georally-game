import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import './faq-list.css'

export interface FaqEntry {
	id: string
	question: string
	answer: ReactNode
}

export function FaqList({ entries }: { entries: readonly FaqEntry[] }) {
	return (
		<div className='divide-y-2 divide-current/15 border-y-2 border-current/15'>
			{entries.map(entry => (
				<details key={entry.id} className='faq-item group'>
					<summary className='flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-5 text-lg leading-snug font-black outline-offset-4 sm:text-xl [&::-webkit-details-marker]:hidden'>
						{entry.question}
						<Plus
							aria-hidden='true'
							strokeWidth={3}
							className='size-6 shrink-0 transition-transform duration-300 group-open:rotate-45 group-hover:scale-110'
						/>
					</summary>
					<p className='pr-10 pb-5 font-medium opacity-80 sm:text-lg'>
						{entry.answer}
					</p>
				</details>
			))}
		</div>
	)
}
