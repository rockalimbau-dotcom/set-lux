import React from 'react'
import { render, screen } from '@testing-library/react'
import DietasSummary from './DietasSummary.tsx'

describe('DietasSummary (smoke)', () => {
	it('muestra conteos y ticket', () => {
		const map = new Map()
		map.set('Comida', 2)
		map.set('Cena', 1)
		render(<DietasSummary dietasCount={map} ticketTotal={12.5} />)
		expect(screen.getByText(/comida x2/i)).toBeInTheDocument()
		expect(screen.getByText(/cena x1/i)).toBeInTheDocument()
		expect(screen.getByText(/ticket €12\.50/i)).toBeInTheDocument()
	})
})
