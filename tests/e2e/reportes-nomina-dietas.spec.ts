import { expect, test, type Page } from '@playwright/test';

async function clickFirstVisible(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    const locator = page.locator(sel).first();
    if (await locator.count()) {
      await locator.click();
      return true;
    }
  }
  return false;
}

async function fillFirstVisible(page: Page, selectors: string[], value: string) {
  for (const sel of selectors) {
    const locator = page.locator(sel).first();
    if (await locator.count()) {
      await locator.fill(value);
      return true;
    }
  }
  return false;
}

test('investigacion reportes a nomina dietas', async ({ page }) => {
  const projectName = `E2E Dietas ${Date.now().toString().slice(-5)}`;
  const gafferName = `Gaffer ${Date.now().toString().slice(-4)}`;
  const bbName = `BestBoy ${Date.now().toString().slice(-4)}`;

  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('debug', 'dietas'));
  const dietasConsoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[dietas]')) dietasConsoleLogs.push(text);
  });

  await fillFirstVisible(page, [
    'input[placeholder*="usuario" i]',
    'input[placeholder*="email" i]',
    'input[aria-label*="usuario" i]',
    'input[name="username"]',
    'input[name="email"]',
  ], 'admin');
  await fillFirstVisible(page, [
    'input[placeholder*="contrase" i]',
    'input[placeholder*="password" i]',
    'input[type="password"]',
    'input[name="password"]',
  ], '1234');
  await clickFirstVisible(page, [
    'button:has-text("Iniciar sesión")',
    'button:has-text("Iniciar sesion")',
    'button:has-text("Login")',
    'button[type="submit"]',
  ]);

  await page.waitForLoadState('networkidle');

  await clickFirstVisible(page, [
    'button:has-text("Omitir")',
    'button:has-text("Saltar")',
    'button:has-text("Cerrar")',
    'button:has-text("Ahora no")',
    'button:has-text("No volver a mostrar")',
    'button:has-text("No, gracias")',
  ]);

  // Ensure we are inside a project first.
  await clickFirstVisible(page, [
    'button:has-text("Nuevo proyecto")',
    'button:has-text("New project")',
  ]);
  await page.locator('input[data-field="proyecto"]').first().fill(projectName);
  await clickFirstVisible(page, [
    'button:has-text("Crear")',
    'button:has-text("Create")',
  ]);
  await page.waitForLoadState('networkidle');
  await page.getByText(projectName).first().click();
  await page.waitForLoadState('networkidle');

  await clickFirstVisible(page, [
    'a:has-text("Equipo")',
    'button:has-text("Equipo")',
  ]);

  await clickFirstVisible(page, [
    'button:has-text("Añadir persona")',
    'button:has-text("Agregar persona")',
    'button:has-text("Add person")',
    'button[aria-label*="Añadir miembro a Equipo base"]',
    'button:has-text("+ Añadir")',
  ]);
  await fillFirstVisible(page, [
    'input[aria-label*="Nombre" i]',
    'input[placeholder*="Nombre" i]',
    'input[placeholder*="name" i]',
  ], gafferName);
  await clickFirstVisible(page, [
    'button[aria-label*="Cargo"]',
    'button:has-text("Gaffer")',
    '[role="option"]:has-text("Gaffer")',
  ]);
  await clickFirstVisible(page, [
    'button:has-text("Guardar")',
    'button:has-text("Crear")',
    'button:has-text("Save")',
  ]);

  await clickFirstVisible(page, [
    'button:has-text("Añadir persona")',
    'button:has-text("Agregar persona")',
    'button:has-text("Add person")',
    'button[aria-label*="Añadir miembro a Equipo base"]',
    'button:has-text("+ Añadir")',
  ]);
  await fillFirstVisible(page, [
    'input[aria-label*="Nombre" i]',
    'input[placeholder*="Nombre" i]',
    'input[placeholder*="name" i]',
  ], bbName);
  await clickFirstVisible(page, [
    'button[aria-label*="Cargo"]',
    'button:has-text("Best Boy")',
    '[role="option"]:has-text("Best Boy")',
  ]);
  await clickFirstVisible(page, [
    'button:has-text("Guardar")',
    'button:has-text("Crear")',
    'button:has-text("Save")',
  ]);

  const scenarioSeed = await page.evaluate(({ gafferName, bbName }) => {
    const pathMatch = window.location.pathname.match(/\/project\/([^/]+)/);
    const projectId = pathMatch?.[1] || '';
    const teamKey = `team_${projectId}`;
    const teamRaw = localStorage.getItem(teamKey);
    const team = teamRaw ? JSON.parse(teamRaw) : { base: [] };
    const base = Array.isArray(team?.base) ? team.base : [];
    let gMember = base.find((m: any) => String(m?.name || '').toLowerCase().includes(gafferName.toLowerCase()));
    let bbMember = base.find((m: any) => String(m?.name || '').toLowerCase().includes(bbName.toLowerCase()));
    if (!gMember || !bbMember) {
      gMember = {
        id: crypto.randomUUID(),
        personId: crypto.randomUUID(),
        role: 'G',
        roleId: 'g_default',
        name: gafferName,
        gender: 'neutral',
        seq: 1,
      };
      bbMember = {
        id: crypto.randomUUID(),
        personId: crypto.randomUUID(),
        role: 'BB',
        roleId: 'bb_default',
        name: bbName,
        gender: 'neutral',
        seq: 2,
      };
      localStorage.setItem(teamKey, JSON.stringify({ ...(team || {}), base: [gMember, bbMember], reinforcements: [] }));
    }

    const isoDays = (startIso: string) => {
      const start = new Date(`${startIso}T00:00:00`);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
    };

    const mkMember = (m: any) => ({
      role: String(m?.role || '').toUpperCase(),
      roleId: m?.roleId,
      roleLabel: m?.roleLabel,
      name: m?.name,
      personId: m?.personId,
      gender: m?.gender || 'neutral',
      source: 'base',
    });
    const g = mkMember(gMember);
    const bb = mkMember(bbMember);

    const week1Start = '2026-04-20';
    const week2Start = '2026-04-27';
    const week1Days = isoDays(week1Start);
    const week2Days = isoDays(week2Start);

    const mkDay = () => ({
      crewTipo: 'Rodaje',
      crewList: [g, bb],
      preList: [],
      pickList: [],
      refBlocks: [],
      crewStart: '08:00',
      crewEnd: '18:00',
    });

    const week1 = { id: 'w1', startDate: week1Start, days: Array.from({ length: 7 }, () => mkDay()) };
    const week2 = { id: 'w2', startDate: week2Start, days: Array.from({ length: 7 }, () => mkDay()) };
    week1.days[1] = {
      ...mkDay(),
      crewTipo: 'Oficina',
      crewList: [g],
      refBlocks: [{ tipo: 'Oficina', list: [bb], start: '09:00', end: '18:00' }],
    };

    localStorage.setItem(`needs_${projectId}`, JSON.stringify({ pre: [], pro: [week1, week2] }));

    const baseKey = (m: any) => (m.roleId ? `${m.roleId}__${m.name}` : `${m.role}__${m.name}`);
    const extraKey = (m: any, idx: number) => (m.roleId ? `${m.roleId}.extra:${idx}__${m.name}` : `${m.role}.extra:${idx}__${m.name}`);
    const gKey = baseKey(g);
    const bbBaseKey = baseKey(bb);
    const bbExtraKey = extraKey(bb, 0);

    const seedReport = (days: string[]) => {
      const emptyConceptMap = Object.fromEntries(days.map(d => [d, '']));
      const mkPerson = () => ({
        'Horas extra': { ...emptyConceptMap },
        'Turn Around': { ...emptyConceptMap },
        'Nocturnidad': { ...emptyConceptMap },
        'Dietas': { ...emptyConceptMap },
      });
      const obj: any = {
        [gKey]: mkPerson(),
        [bbBaseKey]: mkPerson(),
        [bbExtraKey]: mkPerson(),
      };
      obj[gKey]['Horas extra'][days[0]] = '2';
      obj[gKey]['Turn Around'][days[0]] = '1';
      obj[gKey]['Nocturnidad'][days[0]] = 'Sí';
      obj[gKey]['Dietas'][days[0]] = 'Comida';

      obj[bbExtraKey]['Horas extra'][days[1]] = '3';
      obj[bbExtraKey]['Turn Around'][days[1]] = '1';
      obj[bbExtraKey]['Nocturnidad'][days[1]] = 'Sí';
      obj[bbExtraKey]['Dietas'][days[1]] = 'Comida + Gastos de bolsillo';

      obj[bbBaseKey]['Horas extra'][days[0]] = '1';
      obj[bbBaseKey]['Nocturnidad'][days[0]] = 'Sí';
      obj[bbBaseKey]['Dietas'][days[0]] = 'Comida';
      return obj;
    };

    const reportKey1 = `reportes_${projectId}_${week1Days.join('_')}`;
    const reportKey2 = `reportes_${projectId}_${week2Days.join('_')}`;
    localStorage.setItem(reportKey1, JSON.stringify(seedReport(week1Days)));
    localStorage.setItem(reportKey2, JSON.stringify(seedReport(week2Days)));

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('setlux:storage-change', { detail: { key: 'e2e-seed', value: '1', storageArea: 'localStorage' } }));
    return { projectId, ok: true, reportKey1, reportKey2, gKey, bbBaseKey, bbExtraKey, week1Days, week2Days };
  }, { gafferName, bbName });
  expect(scenarioSeed.ok).toBeTruthy();

  await clickFirstVisible(page, [
    'a:has-text("Reportes")',
    'button:has-text("Reportes")',
  ]);

  await expect(page.locator('main')).toContainText(/reportes|informe/i);

  const injected = await page.evaluate(({ gafferName, bbName }) => {
    const pathMatch = window.location.pathname.match(/\/project\/([^/]+)/);
    const projectId = pathMatch?.[1] || '';
    const reportKeys = Object.keys(localStorage).filter(k => k.startsWith(`reportes_${projectId}_`));
    const updates: Array<{ key: string; gKey?: string; bbKey?: string; date?: string }> = [];

    for (const k of reportKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let obj: any;
      try {
        obj = JSON.parse(raw);
      } catch {
        continue;
      }
      const personaKeys = Object.keys(obj || {}).filter(x => !x.startsWith('__'));
      const gKey = personaKeys.find(x => x.toLowerCase().includes(gafferName.toLowerCase()));
      const bbKey = personaKeys.find(x => x.toLowerCase().includes(bbName.toLowerCase()));
      const targetDate =
        Object.keys(obj?.[gKey || bbKey || '']?.['Dietas'] || {})[0] ||
        Object.keys(obj?.[gKey || bbKey || '']?.['Horas extra'] || {})[0];
      if (!targetDate) continue;

      const apply = (pk?: string, extras = '2') => {
        if (!pk || !obj[pk]) return;
        obj[pk]['Horas extra'] = { ...(obj[pk]['Horas extra'] || {}), [targetDate]: extras };
        obj[pk]['Turn Around'] = { ...(obj[pk]['Turn Around'] || {}), [targetDate]: '1' };
        obj[pk]['Nocturnidad'] = { ...(obj[pk]['Nocturnidad'] || {}), [targetDate]: 'Sí' };
        obj[pk]['Dietas'] = { ...(obj[pk]['Dietas'] || {}), [targetDate]: 'Comida + Gastos de bolsillo' };
      };

      apply(gKey, '2');
      apply(bbKey, '3');

      localStorage.setItem(k, JSON.stringify(obj));
      updates.push({ key: k, gKey, bbKey, date: targetDate });
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('setlux:storage-change', { detail: { key: 'manual-e2e', value: '1', storageArea: 'localStorage' } }));
    return { projectId, reportKeysCount: reportKeys.length, updates };
  }, { gafferName, bbName });

  const storageBeforeNomina = await page.evaluate(() => {
    const pathMatch = window.location.pathname.match(/\/project\/([^/]+)/);
    const projectId = pathMatch?.[1] || '';
    const reportKeys = Object.keys(localStorage).filter(k => k.startsWith(`reportes_${projectId}_`));
    const dump: any[] = [];
    for (const k of reportKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let obj: any;
      try {
        obj = JSON.parse(raw);
      } catch {
        continue;
      }
      const personKeys = Object.keys(obj || {}).filter(pk => !pk.startsWith('__'));
      const tracked = personKeys
        .filter(pk => pk.includes('__'))
        .map(pk => ({
          pk,
          dietas: obj?.[pk]?.['Dietas'] || {},
        }));
      dump.push({ key: k, tracked });
    }
    return dump;
  });

  await clickFirstVisible(page, [
    'a:has-text("Nómina")',
    'a:has-text("Nómina")',
    'button:has-text("Nómina")',
    'a:has-text("Nomina")',
    'button:has-text("Nomina")',
  ]);
  await page.waitForLoadState('networkidle');
  const nominaBefore = await page.locator('main').innerText();

  await clickFirstVisible(page, [
    'a:has-text("Reportes")',
    'button:has-text("Reportes")',
  ]);
  await page.waitForLoadState('networkidle');

  const cleared = await page.evaluate(({ gafferName, bbName }) => {
    const pathMatch = window.location.pathname.match(/\/project\/([^/]+)/);
    const projectId = pathMatch?.[1] || '';
    const reportKeys = Object.keys(localStorage).filter(k => k.startsWith(`reportes_${projectId}_`));
    const clearOps: Array<{ key: string; gKey?: string; bbKey?: string; clearedDates: string[] }> = [];

    for (const k of reportKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let obj: any;
      try {
        obj = JSON.parse(raw);
      } catch {
        continue;
      }
      const personaKeys = Object.keys(obj || {}).filter(x => !x.startsWith('__'));
      const gKey = personaKeys.find(x => x.toLowerCase().includes(gafferName.toLowerCase()));
      const bbKey = personaKeys.find(x => x.toLowerCase().includes(bbName.toLowerCase()));
      const dates = new Set<string>();
      for (const pk of [gKey, bbKey]) {
        if (!pk || !obj[pk]) continue;
        for (const d of Object.keys(obj[pk]['Dietas'] || {})) {
          obj[pk]['Dietas'][d] = '';
          dates.add(d);
        }
      }
      localStorage.setItem(k, JSON.stringify(obj));
      clearOps.push({ key: k, gKey, bbKey, clearedDates: Array.from(dates) });
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('setlux:storage-change', { detail: { key: 'manual-e2e-clear', value: '1', storageArea: 'localStorage' } }));
    return { projectId, clearOps };
  }, { gafferName, bbName });

  const storageAfterClear = await page.evaluate(() => {
    const pathMatch = window.location.pathname.match(/\/project\/([^/]+)/);
    const projectId = pathMatch?.[1] || '';
    const reportKeys = Object.keys(localStorage).filter(k => k.startsWith(`reportes_${projectId}_`));
    const dump: any[] = [];
    for (const k of reportKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      let obj: any;
      try {
        obj = JSON.parse(raw);
      } catch {
        continue;
      }
      const personKeys = Object.keys(obj || {}).filter(pk => !pk.startsWith('__'));
      const tracked = personKeys
        .filter(pk => pk.includes('__'))
        .map(pk => ({
          pk,
          dietas: obj?.[pk]?.['Dietas'] || {},
        }));
      dump.push({ key: k, tracked });
    }
    return dump;
  });

  await clickFirstVisible(page, [
    'a:has-text("Nómina")',
    'button:has-text("Nómina")',
    'a:has-text("Nomina")',
    'button:has-text("Nomina")',
  ]);
  await page.waitForLoadState('networkidle');
  const nominaAfter = await page.locator('main').innerText();

  const report = {
    injected,
    cleared,
    storageBeforeNomina,
    storageAfterClear,
    dietasConsoleLogs: dietasConsoleLogs.slice(-120),
    containsBefore: {
      gaffer: nominaBefore.toLowerCase().includes(gafferName.toLowerCase()),
      bestBoy: nominaBefore.toLowerCase().includes(bbName.toLowerCase()),
      comida: nominaBefore.toLowerCase().includes('comida'),
      bolsillo: nominaBefore.toLowerCase().includes('bolsillo'),
    },
    containsAfter: {
      gaffer: nominaAfter.toLowerCase().includes(gafferName.toLowerCase()),
      bestBoy: nominaAfter.toLowerCase().includes(bbName.toLowerCase()),
      comida: nominaAfter.toLowerCase().includes('comida'),
      bolsillo: nominaAfter.toLowerCase().includes('bolsillo'),
    },
  };
  // eslint-disable-next-line no-console
  console.log('[e2e-investigation-report]', JSON.stringify(report));
  await test.info().attach('investigation-report.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
});
