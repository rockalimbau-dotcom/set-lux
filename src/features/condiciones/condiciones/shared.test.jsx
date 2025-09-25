import { renderWithParams, extractFestivosDatesForPlan } from './shared.tsx'

describe('shared.tsx helpers', () => {
	it('renderWithParams reemplaza marcadores simples', () => {
		const tpl = 'TA: {{TA_DIARIO}}h, FINDE: {{TA_FINDE}}h, KMs: {{KM_EURO}}€/km'
		const out = renderWithParams(tpl, { taDiario: '12', taFinde: '48', kilometrajeKm: '0,26' })
		expect(out).toContain('12h')
		expect(out).toContain('48h')
		expect(out).toContain('0,26€/km')
	})

	it('extractFestivosDatesForPlan extrae fechas variadas únicas', () => {
		const txt = 'Días: 1/1, 01-04, 1/01/2025, 1/1, 06-12, 26/12'
		const got = extractFestivosDatesForPlan(txt)
		// Debe normalizar y deduplicar
		expect(got).toEqual(expect.arrayContaining(['01/01', '01/04', '01/01/2025', '06/12', '26/12']))
		// sin duplicados exactos
		const set = new Set(got)
		expect(set.size).toBe(got.length)
	})
})
