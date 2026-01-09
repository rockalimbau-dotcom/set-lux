import React from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, REGIONS } from '@shared/constants/countries';
import { ProjectForm, ProjectMode, ProjectStatus } from '../../types';
import { FormInput } from '../EditProjectModal/FormInput';
import { FormDropdown } from '../EditProjectModal/FormDropdown';
import {
  getEstadoLabel,
  getCondicionesLabel,
  getPaisLabel,
  getRegionLabel,
} from '../EditProjectModal/EditProjectModalUtils';
import { DropdownState, InputHoverState } from '../EditProjectModal/EditProjectModalTypes';

interface NewProjectModalFormProps {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  theme: 'light' | 'dark';
  estadoDropdown: DropdownState;
  setEstadoDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  condicionesDropdown: DropdownState;
  setCondicionesDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  paisDropdown: DropdownState;
  setPaisDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  regionDropdown: DropdownState;
  setRegionDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
  inputHovered: InputHoverState;
  setInputHovered: React.Dispatch<React.SetStateAction<InputHoverState>>;
  estadoRef: React.RefObject<HTMLDivElement>;
  condicionesRef: React.RefObject<HTMLDivElement>;
  paisRef: React.RefObject<HTMLDivElement>;
  regionRef: React.RefObject<HTMLDivElement>;
}

export function NewProjectModalForm({
  form,
  setForm,
  theme,
  estadoDropdown,
  setEstadoDropdown,
  condicionesDropdown,
  setCondicionesDropdown,
  paisDropdown,
  setPaisDropdown,
  regionDropdown,
  setRegionDropdown,
  inputHovered,
  setInputHovered,
  estadoRef,
  condicionesRef,
  paisRef,
  regionRef,
}: NewProjectModalFormProps) {
  const { t } = useTranslation();

  const estadoLabel = getEstadoLabel(form.estado, t);
  const condicionesLabel = getCondicionesLabel(form.condicionesTipo, t);
  const paisLabel = getPaisLabel(form.country);
  const regionLabel = getRegionLabel(form.country, form.region, t);

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4'>
      <FormInput
        label={t('common.project')}
        value={form.nombre}
        onChange={value => setForm({ ...form, nombre: value })}
        theme={theme}
        isHovered={inputHovered.proyecto}
        onMouseEnter={() => setInputHovered(prev => ({ ...prev, proyecto: true }))}
        onMouseLeave={() => setInputHovered(prev => ({ ...prev, proyecto: false }))}
        onBlur={() => setInputHovered(prev => ({ ...prev, proyecto: false }))}
        fieldKey='proyecto'
      />

      <FormInput
        label={t('common.dop')}
        value={form.dop}
        onChange={value => setForm({ ...form, dop: value })}
        theme={theme}
        isHovered={inputHovered.dop}
        onMouseEnter={() => setInputHovered(prev => ({ ...prev, dop: true }))}
        onMouseLeave={() => setInputHovered(prev => ({ ...prev, dop: false }))}
        onBlur={() => setInputHovered(prev => ({ ...prev, dop: false }))}
        fieldKey='dop'
      />

      <FormInput
        label={t('common.warehouse')}
        value={form.almacen}
        onChange={value => setForm({ ...form, almacen: value })}
        theme={theme}
        isHovered={inputHovered.almacen}
        onMouseEnter={() => setInputHovered(prev => ({ ...prev, almacen: true }))}
        onMouseLeave={() => setInputHovered(prev => ({ ...prev, almacen: false }))}
        onBlur={() => setInputHovered(prev => ({ ...prev, almacen: false }))}
        fieldKey='almacen'
      />

      <FormInput
        label={t('common.production')}
        value={form.productora}
        onChange={value => setForm({ ...form, productora: value })}
        theme={theme}
        isHovered={inputHovered.productora}
        onMouseEnter={() => setInputHovered(prev => ({ ...prev, productora: true }))}
        onMouseLeave={() => setInputHovered(prev => ({ ...prev, productora: false }))}
        onBlur={() => setInputHovered(prev => ({ ...prev, productora: false }))}
        fieldKey='productora'
      />

      <FormDropdown
        label={t('common.status')}
        value={estadoLabel}
        options={[
          { value: 'Activo', label: t('common.active') },
          { value: 'Cerrado', label: t('common.closed') },
        ]}
        onChange={value => setForm({ ...form, estado: value as ProjectStatus })}
        theme={theme}
        dropdownState={estadoDropdown}
        setDropdownState={setEstadoDropdown}
        dropdownRef={estadoRef}
        t={t}
      />

      <FormDropdown
        label={t('navigation.conditions')}
        value={condicionesLabel}
        options={[
          { value: 'mensual', label: t('common.monthly') },
          { value: 'semanal', label: t('common.weekly') },
          { value: 'publicidad', label: t('common.advertising') },
        ]}
        onChange={value => setForm({ ...form, condicionesTipo: value as ProjectMode })}
        theme={theme}
        dropdownState={condicionesDropdown}
        setDropdownState={setCondicionesDropdown}
        dropdownRef={condicionesRef}
        t={t}
      />

      <FormDropdown
        label={t('common.country')}
        value={paisLabel}
        options={COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
        onChange={value => {
          setForm({ ...form, country: value, region: '' });
        }}
        theme={theme}
        dropdownState={paisDropdown}
        setDropdownState={setPaisDropdown}
        dropdownRef={paisRef}
        t={t}
      />

      {REGIONS[form.country as keyof typeof REGIONS] && (
        <FormDropdown
          label={t('common.region')}
          value={regionLabel}
          options={[
            { value: '', label: t('common.noSpecificRegion') },
            ...REGIONS[form.country as keyof typeof REGIONS].map(r => ({
              value: r.code,
              label: r.name,
            })),
          ]}
          onChange={value => setForm({ ...form, region: value })}
          theme={theme}
          dropdownState={regionDropdown}
          setDropdownState={setRegionDropdown}
          dropdownRef={regionRef}
          t={t}
        />
      )}
    </div>
  );
}

