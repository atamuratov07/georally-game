import { Component, type ReactNode } from 'react'

interface GameErrorBoundaryProps {
	children: ReactNode
	fallback: ReactNode
	onError: () => void
}

export class GameErrorBoundary extends Component<
	GameErrorBoundaryProps,
	{ failed: boolean }
> {
	state = { failed: false }

	static getDerivedStateFromError() {
		return { failed: true }
	}

	componentDidCatch() {
		this.props.onError()
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children
	}
}
