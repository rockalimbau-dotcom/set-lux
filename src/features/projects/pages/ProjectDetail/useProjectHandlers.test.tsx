import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useProjectHandlers } from './useProjectHandlers';

describe('useProjectHandlers', () => {
  it('persists roleCatalog changes through onUpdateProject', async () => {
    const setProj = vi.fn((updater: any) =>
      updater({
        id: 'p1',
        nombre: 'Demo',
        estado: 'Activo',
        roleCatalog: { version: 1, roles: [] },
      })
    );
    const onUpdateProject = vi.fn();

    const { result } = renderHook(() =>
      useProjectHandlers({
        proj: {
          id: 'p1',
          nombre: 'Demo',
          estado: 'Activo',
          roleCatalog: { version: 1, roles: [] },
          team: { base: [], reinforcements: [], prelight: [], pickup: [], enabledGroups: { prelight: false, pickup: false } },
        } as any,
        isActive: true,
        activeTab: 'equipo',
        setProj,
        setActiveTab: vi.fn(),
        setShowNameValidationModal: vi.fn(),
        onUpdateProject,
        navigate: vi.fn(),
        pid: 'p1',
        isNavigatingRef: { current: false },
      })
    );

    const nextRoleCatalog = {
      version: 1,
      roles: [{ id: 'electric_x', label: 'Eléctrico X', sortOrder: 20, active: true }],
    };

    act(() => {
      result.current.handleRoleCatalogChange(nextRoleCatalog);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(setProj).toHaveBeenCalled();
    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        roleCatalog: nextRoleCatalog,
      })
    );
  });

  it('persists conditions changes through onUpdateProject', async () => {
    const setProj = vi.fn((updater: any) =>
      updater({
        id: 'p1',
        nombre: 'Demo',
        estado: 'Activo',
        conditions: { tipo: 'semanal', semanal: { roles: ['electric_default'] } },
      })
    );
    const onUpdateProject = vi.fn();

    const { result } = renderHook(() =>
      useProjectHandlers({
        proj: {
          id: 'p1',
          nombre: 'Demo',
          estado: 'Activo',
          conditions: { tipo: 'semanal', semanal: { roles: ['electric_default'] } },
          team: { base: [], reinforcements: [], prelight: [], pickup: [], enabledGroups: { prelight: false, pickup: false } },
        } as any,
        isActive: true,
        activeTab: 'condiciones',
        setProj,
        setActiveTab: vi.fn(),
        setShowNameValidationModal: vi.fn(),
        onUpdateProject,
        navigate: vi.fn(),
        pid: 'p1',
        isNavigatingRef: { current: false },
      })
    );

    const patch = {
      semanal: {
        roles: ['electric_default', 'electric_x'],
        prices: {
          electric_default: { 'Precio semanal': '200' },
          electric_x: { 'Precio semanal': '300' },
        },
      },
      tipo: 'semanal',
    };

    act(() => {
      result.current.handleConditionsChange(patch);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(setProj).toHaveBeenCalled();
    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.objectContaining({
          tipo: 'semanal',
          semanal: patch.semanal,
        }),
      })
    );
  });
});
