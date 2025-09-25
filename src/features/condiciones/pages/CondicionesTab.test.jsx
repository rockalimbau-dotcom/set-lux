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
	it('renderiza semanal y botón Exportar', () => {
		renderTab('semanal')
		expect(screen.getByRole('button', { name: /exportar semanal/i })).toBeInTheDocument()
	})

	it('renderiza mensual y botón Exportar', () => {
		renderTab('mensual')
		expect(screen.getByRole('button', { name: /exportar mensual/i })).toBeInTheDocument()
	})

	it('renderiza publicidad y botón Exportar', () => {
		renderTab('publicidad')
		expect(screen.getByRole('button', { name: /exportar publicidad/i })).toBeInTheDocument()
	})

	it('permite click en Exportar sin crash', async () => {
		renderTab('semanal')
		await userEvent.click(screen.getByRole('button', { name: /exportar semanal/i }))
		// No assert de efecto: es smoke para que no explote
	})
})
