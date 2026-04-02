import { useState } from 'react';
import { ProjectTab } from './ProjectDetailTypes';
import { TeamNameValidationIssue } from './ProjectDetailUtils';

interface UseProjectModalsReturn {
  showStatusModal: { isClosing: boolean } | null;
  setShowStatusModal: (modal: { isClosing: boolean } | null) => void;
  showNameValidationModal: { targetTab: ProjectTab | null; roleWithoutName: TeamNameValidationIssue } | null;
  setShowNameValidationModal: (modal: { targetTab: ProjectTab | null; roleWithoutName: TeamNameValidationIssue } | null) => void;
}

/**
 * Hook to manage project modals state
 */
export function useProjectModals(): UseProjectModalsReturn {
  const [showStatusModal, setShowStatusModal] = useState<{ isClosing: boolean } | null>(null);
  const [showNameValidationModal, setShowNameValidationModal] = useState<{ targetTab: ProjectTab | null; roleWithoutName: TeamNameValidationIssue } | null>(null);

  return {
    showStatusModal,
    setShowStatusModal,
    showNameValidationModal,
    setShowNameValidationModal,
  };
}
