import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { AnyRecord } from '@shared/types/common';
import { parseYYYYMMDD, addDays, toYYYYMMDD, formatDDMMYYYY } from '@shared/utils/date';
import { roleLabelFromCode, stripRefuerzoSuffix, stripRoleSuffix } from '@shared/constants/roles';
import { usePlanWeeks } from '@features/reportes/pages/ReportesTab/usePlanWeeks';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

type TimesheetTabProps = {
  project?: AnyRecord;
  readOnly?: boolean;
};

type Worker = {
  key: string;
  stableKey: string;
  name: string;
  role: string;
};

type WorkerProfile = {
  dni?: string;
  ss?: string;
  department?: string;
};

type CompanyInfo = {
  companyName?: string;
  companyAddress?: string;
  companyCif?: string;
  companySs?: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const normalizeRole = (role: string): string => {
  const raw = String(role || '').toUpperCase();
  if (!raw) return '';
  if (raw.startsWith('REF')) return stripRefuerzoSuffix(raw);
  return stripRoleSuffix(raw);
};

const stableWorkerKey = (role: string, name: string): string => `${normalizeRole(role)}__${String(name || '').trim()}`;

const personMatches = (member: AnyRecord, worker: Worker): boolean => {
  const memberName = String(member?.name || '').trim().toLowerCase();
  const workerName = String(worker.name || '').trim().toLowerCase();
  if (!memberName || !workerName || memberName !== workerName) return false;

  const memberRole = normalizeRole(String(member?.role || ''));
  const workerRole = normalizeRole(worker.role);
  return !memberRole || !workerRole || memberRole === workerRole;
};

const parseMinutes = (hhmm: string): number => {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return 0;
  return h * 60 + min;
};

const diffMinutes = (from: string, to: string): number => {
  const start = parseMinutes(from);
  const end = parseMinutes(to);
  if (!start || !end) return 0;
  if (end >= start) return end - start;
  return (24 * 60 - start) + end;
};

const formatDuration = (minutes: number): string => {
  const safe = Math.max(0, Math.floor(minutes || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

const getProjectBase = (project?: AnyRecord): string => String(project?.id || project?.nombre || 'tmp');
const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function buildWeekIsoDays(week: AnyRecord): string[] {
  const monday = parseYYYYMMDD(String(week?.startDate || ''));
  if (!monday) return [];
  return Array.from({ length: 7 }, (_, i) => toYYYYMMDD(addDays(monday, i)));
}

function StyledDropdown({
  value,
  options,
  onChange,
  disabled = false,
  buttonClassName = '',
  menuClassName = '',
  optionClassName = '',
}: {
  value: string;
  options: SelectOption[];
  onChange: (next: string) => void;
  disabled?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        setTheme((document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light');
      }
    };
    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className='relative w-full' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(v => !v)}
        onMouseEnter={() => !disabled && setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        onBlur={() => setIsButtonHovered(false)}
        disabled={disabled}
        className={`w-full px-2 py-1.5 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-xs sm:text-sm text-left transition-colors ${
          theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        style={{
          borderWidth: isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor:
            isButtonHovered && theme === 'light'
              ? '#0476D9'
              : isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1 3.5h8z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.6rem center',
          paddingRight: '1.75rem',
        }}
      >
        {selected?.label || ''}
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-40 sm:max-h-48 md:max-h-60 ${
            theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
          } ${menuClassName}`}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type='button'
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
                setHoveredOption(null);
              }}
              onMouseEnter={() => setHoveredOption(opt.value)}
              onMouseLeave={() => setHoveredOption(null)}
              className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
                theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
              } ${optionClassName}`}
              style={{
                backgroundColor: hoveredOption === opt.value ? (theme === 'light' ? '#A0D3F2' : '#f59e0b') : 'transparent',
                color: hoveredOption === opt.value ? (theme === 'light' ? '#111827' : 'white') : 'inherit',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function extractWorkersFromWeek(week: AnyRecord): Worker[] {
  const out = new Map<string, Worker>();
  const days = Array.isArray(week?.days) ? week.days : [];
  for (const day of days) {
    const sources: Array<AnyRecord[]> = [
      Array.isArray(day?.team) ? day.team : [],
      Array.isArray(day?.prelight) ? day.prelight : [],
      Array.isArray(day?.pickup) ? day.pickup : [],
      Array.isArray(day?.refList) ? day.refList : [],
    ];
    for (const list of sources) {
      for (const m of list) {
        const role = String(m?.role || '').toUpperCase();
        const name = String(m?.name || '').trim();
        if (!role || !name) continue;
        const key = `${role}__${name}`;
        if (!out.has(key)) {
          out.set(key, { key, stableKey: stableWorkerKey(role, name), role, name });
        }
      }
    }
  }
  return Array.from(out.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function getWorkBlockForDay(day: AnyRecord, worker: Worker): 'base' | 'pre' | 'pick' | 'ref' | null {
  const inBase = (Array.isArray(day?.team) ? day.team : []).some((m: AnyRecord) => personMatches(m, worker));
  if (inBase) return 'base';
  const inPre = (Array.isArray(day?.prelight) ? day.prelight : []).some((m: AnyRecord) => personMatches(m, worker));
  if (inPre) return 'pre';
  const inPick = (Array.isArray(day?.pickup) ? day.pickup : []).some((m: AnyRecord) => personMatches(m, worker));
  if (inPick) return 'pick';
  const inRef = (Array.isArray(day?.refList) ? day.refList : []).some((m: AnyRecord) => personMatches(m, worker));
  if (inRef) return 'ref';
  return null;
}

function getTimesForBlock(day: AnyRecord, block: 'base' | 'pre' | 'pick' | 'ref' | null): { from: string; to: string } {
  if (!block) return { from: '', to: '' };
  if (block === 'pre') return { from: String(day?.preStart || day?.start || ''), to: String(day?.preEnd || day?.end || '') };
  if (block === 'pick') return { from: String(day?.pickStart || day?.start || ''), to: String(day?.pickEnd || day?.end || '') };
  if (block === 'ref') return { from: String(day?.refStart || day?.start || ''), to: String(day?.refEnd || day?.end || '') };
  return { from: String(day?.start || ''), to: String(day?.end || '') };
}

function hasDietasForDay(reportData: AnyRecord, worker: Worker, block: 'base' | 'pre' | 'pick' | 'ref' | null, iso: string): boolean {
  if (!block || !reportData) return false;
  const name = worker.name;
  const roleRaw = worker.role;
  const roleBase = normalizeRole(roleRaw);
  const roleRef = stripRefuerzoSuffix(roleRaw);
  const candidates = new Set<string>([
    `${roleRaw}__${name}`,
    `${roleBase}__${name}`,
    `${roleRef}__${name}`,
    `REF__${name}`,
  ]);
  if (block === 'pre') {
    candidates.add(`${roleRaw}.pre__${name}`);
    candidates.add(`${roleBase}.pre__${name}`);
    candidates.add(`${roleRef}.pre__${name}`);
    candidates.add(`REF.pre__${name}`);
  }
  if (block === 'pick') {
    candidates.add(`${roleRaw}.pick__${name}`);
    candidates.add(`${roleBase}.pick__${name}`);
    candidates.add(`${roleRef}.pick__${name}`);
    candidates.add(`REF.pick__${name}`);
  }
  if (block === 'ref') {
    candidates.add(`REF__${name}`);
    candidates.add(`REF.pre__${name}`);
    candidates.add(`REF.pick__${name}`);
  }
  for (const key of candidates) {
    const v = reportData?.[key]?.['Dietas']?.[iso];
    if (String(v || '').trim() !== '') return true;
  }
  return false;
}

function renderPrintHTML(params: {
  projectName: string;
  worker: Worker;
  weekLabel: string;
  roleLabel: string;
  department: string;
  profile: WorkerProfile;
  companyInfo: CompanyInfo;
  rows: Array<{ dayName: string; date: string; from: string; to: string; total: string; catering: string; city: string; note: string }>;
  total: string;
  t: (key: string) => string;
}): string {
  const { projectName, worker, weekLabel, roleLabel, department, profile, companyInfo, rows, total, t } = params;
  const e = escapeHtml;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${e(t('timesheet.title'))} - ${e(worker.name)}</title>
    <style>
      @page { size: A4 landscape; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
        background: white;
        color: #1e293b;
        line-height: 1.3;
        font-size: 12px;
      }
      .container-pdf {
        width: 1123px;
        height: 794px;
        background: white;
        display: flex;
        flex-direction: column;
      }
      .header { background: white; color: #0f172a; flex-shrink: 0; }
      .title-bar {
        background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
        color: #ffffff;
        padding: 10px 20px;
        text-align: center;
      }
      .title-text {
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.2px;
      }
      .content {
        padding: 12px 20px 8px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .info-panel {
        background: #f1f5f9;
        margin: 4px 0 2px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px 12px;
      }
      .meta-row {
        font-size: 10px;
        color: #334155;
        min-height: 36px;
      }
      .meta-row strong {
        display: block;
        margin-bottom: 4px;
        font-size: 10px;
        color: #1f2937;
        font-weight: 700;
      }
      .meta-row span {
        font-size: 12px;
        color: #0f172a;
        font-weight: 600;
      }
      .table-wrap {
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #1e3a8a; }
      th {
        background: #1e3a8a;
        color: white;
        padding: 6px 6px;
        text-align: left;
        font-weight: 600;
        font-size: 9px;
        text-transform: uppercase;
        border: 1px solid white;
      }
      td {
        padding: 6px 6px;
        border: 1px solid #e2e8f0;
        background: white;
        vertical-align: top;
        color: #1e293b;
      }
      .total-row td { font-weight: 700; background: #f8fafc; }
      .signatures-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin-top: 6px;
      }
      .sign-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        min-height: 86px;
        overflow: hidden;
      }
      .sign-card-title {
        padding: 6px 8px;
        font-size: 10px;
        font-size: 10px;
        font-weight: 700;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .sign-card-space {
        height: 58px;
      }
      .legal-box {
        margin-top: 6px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        padding: 8px 10px;
        font-size: 8px;
        line-height: 1.35;
        color: #334155;
        white-space: pre-line;
      }
      .company-box {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        padding: 8px;
      }
      .company-box { font-size: 11px; line-height: 1.35; color: #334155; }
      .company-line { font-weight: 700; }
      .company-ss { margin-top: 6px; font-weight: 700; }
      .footer {
        text-align: center;
        padding: 7px 0 8px;
        color: #64748b;
        font-size: 8px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
      }
      .setlux-logo { font-weight: 700; }
      .setlux-logo .set { color: #f97316; }
      .setlux-logo .lux { color: #3b82f6; }
      .footer-dot { font-weight: 700; }
      .footer-domain { color: #1e293b; font-weight: 600; }
      .spacer { flex: 1; min-height: 0; }
      .meta-row.wide { grid-column: span 2; }
      @media print {
        .container-pdf { width: 1123px !important; height: 794px !important; }
      }
    </style>
  </head>
  <body>
    <div class="container-pdf">
      <div class="header">
        <div class="title-bar">
          <div class="title-text">${e(t('timesheet.pdfTitle'))}</div>
        </div>
      </div>
      <div class="content">
        <div class="info-panel">
          <div class="meta">
            <div class="meta-row"><strong>${e(t('timesheet.department'))}</strong><span>${e(department)}</span></div>
            <div class="meta-row"><strong>${e(t('timesheet.weekEnding'))}</strong><span>${e(weekLabel)}</span></div>
            <div class="meta-row"><strong>${e(t('timesheet.worker'))}</strong><span>${e(worker.name)}</span></div>
            <div class="meta-row"><strong>${e(t('timesheet.role'))}</strong><span>${e(roleLabel)}</span></div>
            <div class="meta-row"><strong>${e(t('timesheet.dni'))}</strong><span>${e(profile?.dni || '')}</span></div>
            <div class="meta-row"><strong>${e(t('timesheet.ss'))}</strong><span>${e(profile?.ss || '')}</span></div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${e(t('timesheet.day'))}</th>
                <th>${e(t('timesheet.date'))}</th>
                <th>${e(t('timesheet.from'))}</th>
                <th>${e(t('timesheet.to'))}</th>
                <th>${e(t('timesheet.totalHours'))}</th>
                <th>${e(t('timesheet.catering'))}</th>
                <th>${e(t('timesheet.city'))}</th>
                <th>${e(t('timesheet.notes'))}</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr><td>${e(r.dayName)}</td><td>${e(r.date)}</td><td>${e(r.from)}</td><td>${e(r.to)}</td><td>${e(r.total)}</td><td>${e(r.catering)}</td><td>${e(r.city)}</td><td>${e(r.note)}</td></tr>`).join('')}
              <tr class="total-row">
                <td colspan="4">${e(t('timesheet.total'))}</td>
                <td>${e(total)}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="signatures-row">
          <div class="sign-card">
            <div class="sign-card-title">${e(t('timesheet.signatureProductionManager'))}</div>
            <div class="sign-card-space"></div>
          </div>
          <div class="sign-card">
            <div class="sign-card-title">${e(t('timesheet.signatureProductionCoordinator'))}</div>
            <div class="sign-card-space"></div>
          </div>
          <div class="sign-card">
            <div class="sign-card-title">${e(t('timesheet.employeeSignature'))}</div>
            <div class="sign-card-space"></div>
          </div>
        </div>
        <div class="company-box">
          <div class="company-line">${e(companyInfo.companyName || projectName)}</div>
          <div>${e(companyInfo.companyAddress || '')}</div>
          <div>${e(companyInfo.companyCif || '')}</div>
          ${String(companyInfo.companySs || '').trim() ? `<div class="company-ss">${e(t('timesheet.companySsLabel'))}: ${e(companyInfo.companySs || '')}</div>` : ''}
        </div>
        <div class="legal-box">${e(t('timesheet.legalNotice'))}</div>
        <div class="spacer"></div>
      </div>
      <div class="footer">
        <span>${e(t('pdf.generatedWith') || 'Generado con')}</span>
        <span class="setlux-logo"><span class="set">Set</span><span class="lux">Lux</span></span>
        <span class="footer-dot">·</span>
        <span class="footer-domain">setlux.app</span>
      </div>
    </div>
  </body>
</html>`;
}

export default function TimesheetTab({ project, readOnly = false }: TimesheetTabProps) {
  const { t } = useTranslation();
  const { pre, pro } = usePlanWeeks(project);
  const allWeeks = useMemo(() => [...pre, ...pro], [pre, pro]);
  const weeksWithPeople = useMemo(
    () => allWeeks.filter((w: AnyRecord) => extractWorkersFromWeek(w).length > 0),
    [allWeeks]
  );
  const baseId = getProjectBase(project);

  const [selectedWeekId, setSelectedWeekId] = useLocalStorage<string>(`timesheet_${baseId}_selectedWeek`, '');
  const selectedWeek = useMemo(
    () => weeksWithPeople.find((w: AnyRecord) => String(w?.id) === selectedWeekId) || weeksWithPeople[0] || null,
    [weeksWithPeople, selectedWeekId]
  );

  useEffect(() => {
    if (selectedWeek && selectedWeekId !== String(selectedWeek.id)) {
      setSelectedWeekId(String(selectedWeek.id));
    }
  }, [selectedWeek, selectedWeekId, setSelectedWeekId]);

  const workers = useMemo(() => (selectedWeek ? extractWorkersFromWeek(selectedWeek) : []), [selectedWeek]);

  const [selectedWorkerKey, setSelectedWorkerKey] = useLocalStorage<string>(`timesheet_${baseId}_selectedWorker`, '');
  const selectedWorker = useMemo(
    () => workers.find(w => w.key === selectedWorkerKey) || workers[0] || null,
    [workers, selectedWorkerKey]
  );

  useEffect(() => {
    if (selectedWorker && selectedWorkerKey !== selectedWorker.key) {
      setSelectedWorkerKey(selectedWorker.key);
    }
  }, [selectedWorker, selectedWorkerKey, setSelectedWorkerKey]);

  const weekIsoDays = useMemo(() => (selectedWeek ? buildWeekIsoDays(selectedWeek) : []), [selectedWeek]);
  const reportStorageKey = useMemo(() => `reportes_${baseId}_${weekIsoDays.join('_')}`, [baseId, weekIsoDays]);
  const [reportData] = useLocalStorage<AnyRecord>(reportStorageKey, {});

  const [profiles, setProfiles] = useLocalStorage<Record<string, WorkerProfile>>(`timesheet_profile_${baseId}`, {});
  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>(`timesheet_company_${baseId}`, {
    companyName: String(project?.productora || project?.nombre || ''),
    companyAddress: '',
    companyCif: '',
    companySs: '',
  });
  const notesKey = useMemo(() => `timesheet_notes_${baseId}_${selectedWeek?.id || 'none'}`, [baseId, selectedWeek?.id]);
  const [weekNotes, setWeekNotes] = useLocalStorage<Record<string, Record<string, string>>>(notesKey, {});
  const cateringKey = useMemo(() => `timesheet_catering_${baseId}_${selectedWeek?.id || 'none'}`, [baseId, selectedWeek?.id]);
  const [weekCatering, setWeekCatering] = useLocalStorage<Record<string, Record<string, string>>>(cateringKey, {});

  const dayNames = useMemo(
    () => DAY_KEYS.map(day => t(`reports.dayNames.${day}`)),
    [t]
  );

  const tableRows = useMemo(() => {
    if (!selectedWeek || !selectedWorker) return [];
    const days = Array.isArray(selectedWeek.days) ? selectedWeek.days : [];
    return weekIsoDays.map((iso, idx) => {
      const day = (days[idx] || {}) as AnyRecord;
      const block = getWorkBlockForDay(day, selectedWorker);
      const { from, to } = getTimesForBlock(day, block);
      const minutes = diffMinutes(from, to);
      const hasDietas = hasDietasForDay(reportData || {}, selectedWorker, block, iso);
      const note = weekNotes?.[selectedWorker.stableKey]?.[iso] || '';
      const autoCatering = block ? (hasDietas ? t('common.no') : t('common.yes')) : '';
      const manualCatering = weekCatering?.[selectedWorker.stableKey]?.[iso] || '';
      return {
        iso,
        dayName: dayNames[idx] || '',
        date: formatDDMMYYYY(parseYYYYMMDD(iso)),
        from,
        to,
        total: minutes > 0 ? formatDuration(minutes) : '',
        totalMinutes: minutes,
        catering: manualCatering || autoCatering,
        city: block ? String(day?.loc || '') : '',
        note,
      };
    });
  }, [selectedWeek, selectedWorker, weekIsoDays, reportData, weekNotes, weekCatering, dayNames, t]);

  const totalWeekMinutes = useMemo(
    () => tableRows.reduce((acc, row) => acc + (row.totalMinutes || 0), 0),
    [tableRows]
  );

  const selectedProfile = selectedWorker ? (profiles[selectedWorker.stableKey] || {}) : {};
  const departmentValue = t('timesheet.lightingDepartmentShort').trim();
  const roleLabel = selectedWorker ? roleLabelFromCode(normalizeRole(selectedWorker.role).replace(/^REF/, '') || selectedWorker.role) : '';
  const weekLabel = weekIsoDays.length > 0 ? formatDDMMYYYY(parseYYYYMMDD(weekIsoDays[weekIsoDays.length - 1])) : '';
  const weekOptions = useMemo(
    () =>
      weeksWithPeople.map((w: AnyRecord) => ({
        value: String(w.id),
        label: String(w.label || w.startDate || w.id),
      })),
    [weeksWithPeople]
  );
  const workerOptions = useMemo(
    () =>
      workers.map(w => ({
        value: w.key,
        label: `${w.name} - ${roleLabelFromCode(normalizeRole(w.role).replace(/^REF/, '') || w.role)}`,
      })),
    [workers]
  );
  const updateProfile = (field: keyof WorkerProfile, value: string) => {
    if (!selectedWorker || readOnly) return;
    setProfiles(prev => ({
      ...prev,
      [selectedWorker.stableKey]: {
        ...(prev[selectedWorker.stableKey] || {}),
        [field]: value,
      },
    }));
  };

  const updateNote = (iso: string, value: string) => {
    if (!selectedWorker || readOnly) return;
    setWeekNotes(prev => ({
      ...prev,
      [selectedWorker.stableKey]: {
        ...(prev[selectedWorker.stableKey] || {}),
        [iso]: value,
      },
    }));
  };

  const updateCatering = (iso: string, value: string) => {
    if (!selectedWorker || readOnly) return;
    setWeekCatering(prev => ({
      ...prev,
      [selectedWorker.stableKey]: {
        ...(prev[selectedWorker.stableKey] || {}),
        [iso]: value,
      },
    }));
  };

  const handleExportPDF = useCallback(async () => {
    if (!selectedWorker || !selectedWeek) return;
    const html = renderPrintHTML({
      projectName: String(project?.productora || project?.nombre || 'SetLux'),
      worker: selectedWorker,
      weekLabel,
      roleLabel,
      department: departmentValue,
      profile: selectedProfile,
      companyInfo,
      rows: tableRows,
      total: formatDuration(totalWeekMinutes),
      t: (key: string) => t(key),
    });
    try {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '297mm';
      tempContainer.style.height = '210mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 120));

      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        windowWidth: 1123,
        windowHeight: 794,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(tempContainer);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      const sanitizePart = (value: string, fallback: string) => {
        const clean = String(value || '')
          .replace(/[\\/:*?"<>|]+/g, '-')
          .replace(/\s+/g, '')
          .trim();
        return clean || fallback;
      };
      const safeProject = sanitizePart(String(project?.nombre || 'Proyecto'), 'Proyecto');
      const safeWorker = sanitizePart(String(selectedWorker.name || 'Trabajador'), 'Trabajador');
      const weekRaw = String(selectedWeek?.label || selectedWeek?.startDate || '');
      const weekNumber = weekRaw.match(/\d+/)?.[0] || '';
      const weekTag = `semana${weekNumber || 'X'}`;
      const filename = `${safeProject}_Timesheet_${safeWorker}_${weekTag}.pdf`;
      await shareOrSavePDF(pdf, filename, t('timesheet.title'));
    } catch (error) {
      console.error('Error exporting timesheet PDF:', error);
    }
  }, [project?.nombre, project?.productora, roleLabel, selectedProfile, companyInfo, selectedWeek, selectedWorker, t, tableRows, totalWeekMinutes, weekLabel]);

  const updateCompanyInfo = (field: keyof CompanyInfo, value: string) => {
    if (readOnly) return;
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (weeksWithPeople.length === 0) {
    return (
      <div className='rounded-xl border border-neutral-border bg-neutral-panel/80 p-4 text-sm text-neutral-500'>
        {t('timesheet.emptyState')}
      </div>
    );
  }

  return (
    <div className='space-y-4' data-tutorial='phase-timesheet'>
      <div className='rounded-xl border border-neutral-border bg-neutral-panel/80 p-4' data-tutorial='timesheet-top'>
        <div className='grid gap-3 md:grid-cols-4'>
          <label className='text-xs sm:text-sm'>
            <span className='mb-1 block font-semibold'>{t('timesheet.week')}</span>
            <StyledDropdown
              value={selectedWeek?.id || ''}
              options={weekOptions}
              onChange={setSelectedWeekId}
            />
          </label>

          <label className='text-xs sm:text-sm md:col-span-2'>
            <span className='mb-1 block font-semibold'>{t('timesheet.worker')}</span>
            <StyledDropdown
              value={selectedWorker?.key || ''}
              options={workerOptions}
              onChange={setSelectedWorkerKey}
            />
          </label>

          <div className='flex items-end justify-end'>
            <button
              type='button'
              onClick={handleExportPDF}
              className='ml-auto px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf'
              style={{ background: '#0476D9', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              PDF
            </button>
          </div>
        </div>

        {selectedWorker && (
          <div className='mt-4 grid gap-2 sm:grid-cols-2'>
            <label className='rounded-md border border-neutral-border p-2 text-xs min-w-0'>
              <strong>{t('timesheet.dni')}:</strong>
              <input
                type='text'
                value={selectedProfile?.dni || ''}
                onChange={e => updateProfile('dni', e.target.value)}
                disabled={readOnly}
                className='mt-1 block w-full min-w-0 rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
              />
            </label>
            <label className='rounded-md border border-neutral-border p-2 text-xs min-w-0'>
              <strong>{t('timesheet.ss')}:</strong>
              <input
                type='text'
                value={selectedProfile?.ss || ''}
                onChange={e => updateProfile('ss', e.target.value)}
                disabled={readOnly}
                className='mt-1 block w-full min-w-0 rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
              />
            </label>
          </div>
        )}

        <div className='mt-3 grid gap-2 grid-cols-1 lg:grid-cols-4'>
          <label className='rounded-md border border-neutral-border p-2 text-xs'>
            <strong>{t('timesheet.companyName')}:</strong>
            <input
              type='text'
              value={companyInfo?.companyName || ''}
              onChange={e => updateCompanyInfo('companyName', e.target.value)}
              disabled={readOnly}
              className='mt-1 block w-full rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
            />
          </label>
          <label className='rounded-md border border-neutral-border p-2 text-xs'>
            <strong>{t('timesheet.companyAddress')}:</strong>
            <input
              type='text'
              value={companyInfo?.companyAddress || ''}
              onChange={e => updateCompanyInfo('companyAddress', e.target.value)}
              disabled={readOnly}
              className='mt-1 block w-full rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
            />
          </label>
          <label className='rounded-md border border-neutral-border p-2 text-xs'>
            <strong>{t('timesheet.companyCif')}:</strong>
            <input
              type='text'
              value={companyInfo?.companyCif || ''}
              onChange={e => updateCompanyInfo('companyCif', e.target.value)}
              disabled={readOnly}
              className='mt-1 block w-full rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
            />
          </label>
          <label className='rounded-md border border-neutral-border p-2 text-xs'>
            <strong>{t('timesheet.companySsLabel')}:</strong>
            <input
              type='text'
              value={companyInfo?.companySs || ''}
              onChange={e => updateCompanyInfo('companySs', e.target.value)}
              disabled={readOnly}
              className='mt-1 block w-full rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
            />
          </label>
        </div>
      </div>

      <div className='overflow-x-auto rounded-xl border border-neutral-border bg-neutral-panel/80' data-tutorial='timesheet-table'>
        <table className='min-w-[980px] w-full border-collapse text-xs'>
          <thead>
            <tr>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.day')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.date')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.from')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.to')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.totalHours')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.catering')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.city')}</th>
              <th className='border border-neutral-border bg-blue-100/60 px-2 py-2 text-left'>{t('timesheet.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row.iso}>
                <td className='border border-neutral-border px-2 py-1.5 font-semibold'>{row.dayName}</td>
                <td className='border border-neutral-border px-2 py-1.5'>{row.date}</td>
                <td className='border border-neutral-border px-2 py-1.5'>{row.from}</td>
                <td className='border border-neutral-border px-2 py-1.5'>{row.to}</td>
                <td className='border border-neutral-border px-2 py-1.5'>{row.total}</td>
                <td className='border border-neutral-border px-2 py-1.5'>
                  <StyledDropdown
                    value={row.catering}
                    onChange={value => updateCatering(row.iso, value)}
                    disabled={readOnly}
                    options={[
                      { value: '', label: '' },
                      { value: t('common.yes'), label: t('common.yes') },
                      { value: t('common.no'), label: t('common.no') },
                    ]}
                    buttonClassName='h-[28px] py-1 px-1.5 text-[10px] sm:text-xs'
                    menuClassName='max-h-28'
                    optionClassName='text-[10px] sm:text-xs'
                  />
                </td>
                <td className='border border-neutral-border px-2 py-1.5'>{row.city}</td>
                <td className='border border-neutral-border px-2 py-1.5'>
                  <input
                    type='text'
                    value={row.note}
                    onChange={e => updateNote(row.iso, e.target.value)}
                    disabled={readOnly}
                    className='w-full rounded border border-neutral-border bg-transparent px-1.5 py-1 disabled:opacity-60'
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td className='border border-neutral-border px-2 py-1.5 font-semibold' colSpan={4}>
                {t('timesheet.total')}
              </td>
              <td className='border border-neutral-border px-2 py-1.5 font-semibold'>
                {formatDuration(totalWeekMinutes)}
              </td>
              <td className='border border-neutral-border px-2 py-1.5' colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
