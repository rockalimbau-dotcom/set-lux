import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../../i18n/config';
import { baseStyles } from '@features/condiciones/utils/exportPDF/htmlBuilders/styles';
import { generateFooter, generateInfoPanel } from '@features/condiciones/utils/exportPDF/htmlBuilders/contentHelpers';
import { translateRoleLabel } from '@features/equipo/pages/EquipoTab/EquipoTabUtils';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

type TeamGroupKey = 'base' | 'reinforcements' | 'prelight' | 'pickup';

const EXTRA_STYLES = `
  .team-title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #1e3a8a;
  }
  .team-section {
    margin-bottom: 12px;
  }
  .team-section:last-child {
    margin-bottom: 0;
  }
  .team-section h3 {
    margin: 0 0 6px 0;
    font-size: 11px;
    font-weight: 700;
    color: #1e3a8a;
    padding: 0;
  }
  .team-table th {
    text-align: left;
  }
  .team-table td {
    text-align: left;
  }
  .team-table {
    table-layout: fixed;
  }
  .team-table th:first-child,
  .team-table td:first-child {
    width: 40%;
  }
  .team-table th:last-child,
  .team-table td:last-child {
    width: 60%;
  }
`;

const getRoleLabel = (role: string, gender?: 'male' | 'female' | 'neutral', groupKey?: TeamGroupKey) => {
  return translateRoleLabel(role, i18n.t.bind(i18n), groupKey, gender || 'neutral') || role;
};

const buildTeamSection = (
  title: string,
  rows: Array<{ role?: string; name?: string; gender?: 'male' | 'female' | 'neutral' }>,
  groupKey?: TeamGroupKey
) => {
  if (!rows || rows.length === 0) return '';
  const headerRole = i18n.t('team.role');
  const headerName = i18n.t('team.nameAndSurname');
  const body = rows
    .map(row => {
      const role = row?.role || '';
      const name = row?.name || '—';
      const label = getRoleLabel(role, row?.gender, groupKey);
      return `<tr><td>${label}</td><td>${name}</td></tr>`;
    })
    .join('');
  return `
    <div class="table-container team-section">
      <h3>${title}</h3>
      <table class="team-table">
        <thead>
          <tr>
            <th>${headerRole}</th>
            <th>${headerName}</th>
          </tr>
        </thead>
        <tbody>
          ${body}
        </tbody>
      </table>
    </div>
  `;
};

const buildEquipoHTMLForPDF = (project: any, team: any) => {
  const title = i18n.t('pdf.teamTitle');
  const projectName = project?.nombre || i18n.t('pdf.project');
  const sections = [
    buildTeamSection(i18n.t('team.baseTeam'), team?.base || [], 'base'),
    buildTeamSection(i18n.t('team.reinforcements'), team?.reinforcements || [], 'reinforcements'),
    buildTeamSection(i18n.t('team.prelightTeam'), team?.prelight || [], 'prelight'),
    buildTeamSection(i18n.t('team.pickupTeam'), team?.pickup || [], 'pickup'),
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${projectName}</title>
  <style>${baseStyles}${EXTRA_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-bar">
        <div class="title-text">${title}</div>
      </div>
    </div>
    <div class="content">
      ${generateInfoPanel(project, true)}
      ${sections.join('')}
    </div>
    ${generateFooter()}
  </div>
</body>
</html>`;
};

export async function exportEquipoToPDF(project: any, team: any): Promise<void> {
  const html = buildEquipoHTMLForPDF(project, team);
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '794px';
  tempContainer.style.height = '1123px';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.overflow = 'hidden';
  document.body.appendChild(tempContainer);

  await new Promise(resolve => setTimeout(resolve, 100));

  const canvas = await html2canvas(tempContainer, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const footer = clonedDoc.querySelector('.footer') as HTMLElement;
      if (footer) {
        footer.style.position = 'relative';
        footer.style.display = 'flex';
        footer.style.visibility = 'visible';
        footer.style.opacity = '1';
      }
    },
  });

  document.body.removeChild(tempContainer);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgData = canvas.toDataURL('image/png');
  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 1) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const filename = `${i18n.t('team.title')} - ${project?.nombre || i18n.t('common.project')}.pdf`;
  await shareOrSavePDF(pdf, filename, i18n.t('team.title'));
}
