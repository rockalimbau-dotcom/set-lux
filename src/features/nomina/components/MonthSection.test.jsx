import React from 'react'
import { render, screen } from '@testing-library/react'
import MonthSection from './MonthSection.tsx'

const dummyRolePrices = {
	getForRole: () => ({
		jornada: 100,
		travelDay: 50,
		horaExtra: 10,
		transporte: 1,
		km: 0.2,
		dietas: {
			Comida: 10,
			Cena: 12,
			'Dieta sin pernoctar': 20,
			'Dieta completa + desayuno': 30,
			'Gastos de bolsillo': 5,
		},
	}),
}

const utils = {
	buildRefuerzoIndex: () => new Set(),
	stripPR: (r) => String(r).replace(/[PR]$/, ''),
	calcWorkedBreakdown: () => ({ workedDays: 0, travelDays: 0, workedBase: 0, workedPre: 0, workedPick: 0 }),
	monthLabelEs: (k) => k,
	ROLE_COLORS: {},
	roleLabelFromCode: (c) => c,
}

describe('MonthSection (smoke)', () => {
	it('renderiza cabecera y botón Exportar', () => {
		render(
			<MonthSection
				monthKey="2025-01"
				rows={[]}
				weeksForMonth={[]}
				filterISO={() => true}
				rolePrices={dummyRolePrices}
				defaultOpen={true}
				persistKeyBase="test"
				onExport={() => {}}
				windowOverrideMap={null}
				{...utils}
			/>
		)
		expect(screen.getByText(/nómina 2025-01/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
		// Mensaje vacío
		expect(screen.getByText(/no hay datos en este mes/i)).toBeInTheDocument()
	})
})
