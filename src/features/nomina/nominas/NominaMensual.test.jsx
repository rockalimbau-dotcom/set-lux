import React from 'react'
import { render, screen } from '@testing-library/react'
import NominaMensual from './NominaMensual.tsx'

describe('NominaMensual (smoke)', () => {
	it('renderiza mensaje cuando no hay semanas', () => {
		render(<NominaMensual project={{ id: 'p1', nombre: 'Demo' }} />)
		expect(
			screen.getByText(/no hay semanas en planificación/i)
		).toBeInTheDocument()
	})
})
