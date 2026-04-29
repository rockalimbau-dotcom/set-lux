import { expect, test } from '@playwright/test';

test('reproduce dietas antiguas persistiendo por key extra', async ({ page }) => {
  await page.goto('https://demo.setlux.app/');

  await page.locator('input[placeholder*="usuario" i]').fill('admin');
  await page.locator('input[type="password"]').fill('1234');
  await page.locator('button:has-text("Iniciar sesión")').click();
  await page.waitForLoadState('networkidle');

  const seeded = await page.evaluate(() => {
    const projectId = crypto.randomUUID();
    const projectName = `E2E stale dietas ${Date.now().toString().slice(-5)}`;
    const project = {
      id: projectId,
      nombre: projectName,
      estado: 'Activo',
      conditions: { tipo: 'semanal' },
      team: {},
    };

    const projectsRaw = localStorage.getItem('projects_v1');
    const projects = projectsRaw ? JSON.parse(projectsRaw) : [];
    projects.push(project);
    localStorage.setItem('projects_v1', JSON.stringify(projects));

    const gName = 'Gaffer Stale';
    const bbName = 'BestBoy Stale';
    const g = { id: crypto.randomUUID(), personId: crypto.randomUUID(), role: 'G', roleId: 'g_default', name: gName, gender: 'neutral', seq: 1 };
    const bb = { id: crypto.randomUUID(), personId: crypto.randomUUID(), role: 'BB', roleId: 'bb_default', name: bbName, gender: 'neutral', seq: 2 };
    localStorage.setItem(`team_${projectId}`, JSON.stringify({ base: [g, bb], reinforcements: [] }));

    const weekDays = ['2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26', '2026-04-27'];
    const reportKey = `reportes_${projectId}_${weekDays.join('_')}`;
    const gKey = `${g.roleId}__${g.name}`;
    const bbBaseKey = `${bb.roleId}__${bb.name}`;
    const bbExtraKey = `${bb.roleId}.extra:0__${bb.name}`;

    const empty = Object.fromEntries(weekDays.map(d => [d, '']));
    const reportData: any = {
      [gKey]: { 'Dietas': { ...empty } },
      [bbBaseKey]: { 'Dietas': { ...empty } },
      [bbExtraKey]: { 'Dietas': { ...empty } },
    };

    // historical old dieta in extra block (what should not linger)
    reportData[bbExtraKey]['Dietas']['2026-04-22'] = 'Comida';
    // newly added dieta in base (user later removes this one)
    reportData[bbBaseKey]['Dietas']['2026-04-21'] = 'Gastos de bolsillo';
    localStorage.setItem(reportKey, JSON.stringify(reportData));

    // Simulate removing the newly added one only.
    reportData[bbBaseKey]['Dietas']['2026-04-21'] = '';
    localStorage.setItem(reportKey, JSON.stringify(reportData));

    return { projectId, reportKey, bbBaseKey, bbExtraKey };
  });

  const state = await page.evaluate(({ reportKey, bbBaseKey, bbExtraKey }) => {
    const raw = localStorage.getItem(reportKey);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      baseAfterClear: obj?.[bbBaseKey]?.['Dietas']?.['2026-04-21'] ?? null,
      extraOldStillThere: obj?.[bbExtraKey]?.['Dietas']?.['2026-04-22'] ?? null,
    };
  }, seeded);

  expect(state.baseAfterClear).toBe('');
  // Repro assertion: old extra dieta survives and can leak into payroll.
  expect(state.extraOldStillThere).toBe('Comida');
});

test('expected: limpiar dietas nuevas tambien limpia residuales extra', async ({ page }) => {
  await page.goto('https://demo.setlux.app/');

  await page.locator('input[placeholder*="usuario" i]').fill('admin');
  await page.locator('input[type="password"]').fill('1234');
  await page.locator('button:has-text("Iniciar sesión")').click();
  await page.waitForLoadState('networkidle');

  const seeded = await page.evaluate(() => {
    const projectId = crypto.randomUUID();
    const projectName = `E2E expected dietas ${Date.now().toString().slice(-5)}`;
    const project = {
      id: projectId,
      nombre: projectName,
      estado: 'Activo',
      conditions: { tipo: 'semanal' },
      team: {},
    };

    const projectsRaw = localStorage.getItem('projects_v1');
    const projects = projectsRaw ? JSON.parse(projectsRaw) : [];
    projects.push(project);
    localStorage.setItem('projects_v1', JSON.stringify(projects));

    const gName = 'Gaffer Expected';
    const bbName = 'BestBoy Expected';
    const g = { id: crypto.randomUUID(), personId: crypto.randomUUID(), role: 'G', roleId: 'g_default', name: gName, gender: 'neutral', seq: 1 };
    const bb = { id: crypto.randomUUID(), personId: crypto.randomUUID(), role: 'BB', roleId: 'bb_default', name: bbName, gender: 'neutral', seq: 2 };
    localStorage.setItem(`team_${projectId}`, JSON.stringify({ base: [g, bb], reinforcements: [] }));

    const weekDays = ['2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26', '2026-04-27'];
    const reportKey = `reportes_${projectId}_${weekDays.join('_')}`;
    const bbBaseKey = `${bb.roleId}__${bb.name}`;
    const bbExtraKey = `${bb.roleId}.extra:0__${bb.name}`;
    const empty = Object.fromEntries(weekDays.map(d => [d, '']));
    const reportData: any = {
      [bbBaseKey]: { 'Dietas': { ...empty } },
      [bbExtraKey]: { 'Dietas': { ...empty } },
    };

    reportData[bbExtraKey]['Dietas']['2026-04-22'] = 'Comida';
    reportData[bbBaseKey]['Dietas']['2026-04-21'] = 'Gastos de bolsillo';
    localStorage.setItem(reportKey, JSON.stringify(reportData));

    // user clears latest entry; expected behavior is no stale leftovers anywhere
    reportData[bbBaseKey]['Dietas']['2026-04-21'] = '';
    localStorage.setItem(reportKey, JSON.stringify(reportData));

    return { reportKey, bbExtraKey };
  });

  const state = await page.evaluate(({ reportKey, bbExtraKey }) => {
    const raw = localStorage.getItem(reportKey);
    const obj = raw ? JSON.parse(raw) : {};
    return obj?.[bbExtraKey]?.['Dietas']?.['2026-04-22'] ?? null;
  }, seeded);

  // Expected target behavior: no stale extra dieta remains.
  expect(state).toBe('');
});

