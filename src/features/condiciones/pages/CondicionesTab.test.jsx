import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CondicionesTab from './CondicionesTab.jsx'

function renderTab(mode) {
	const onChange = vi.fn()
	const project = { id: 'p1', nombre: 'Demo', conditions: { tipo: mode } }
	render(<CondicionesTab project={project} mode={mode} onChange={onChange} />)
	return { onChange }
}

describe('CondicionesTab (smoke)', () => {
	it('renderiza semanal y botón PDF', () => {
		renderTab('semanal')
		expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument()
	})

	it('renderiza mensual y botón PDF', () => {
		renderTab('mensual')
		expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument()
	})

	it('renderiza publicidad y botón PDF', () => {
		renderTab('publicidad')
		expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument()
	})

	it('permite click en PDF sin crash', async () => {
		renderTab('semanal')
		await userEvent.click(screen.getByRole('button', { name: /pdf/i }))
		// No assert de efecto: es smoke para que no explote
	})
})
