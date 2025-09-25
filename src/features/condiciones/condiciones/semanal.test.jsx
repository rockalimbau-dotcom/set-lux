import React from 'react'
import { render, screen } from '@testing-library/react'
import CondicionesSemanal from './semanal.tsx'

describe('CondicionesSemanal (smoke)', () => {
	it('renderiza sin explotar (muestra parámetros)', () => {
		render(<CondicionesSemanal project={{ id: 'p1', nombre: 'Demo' }} />)
		// Texto común que aparece en la sección de parámetros
		expect(screen.getByText(/parámetros de cálculo/i)).toBeInTheDocument()
	})
})
