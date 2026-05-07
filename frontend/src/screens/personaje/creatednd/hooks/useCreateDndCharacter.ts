import { useState } from "react";
import { useCreateDndBackgroundState } from "./useCreateDndBackgroundState";
import { useCreateDndCatalogs } from "./useCreateDndCatalogs";
import { useCreateDndClassState } from "./useCreateDndClassState";
import { usePortraitSelection } from "./usePortraitSelection";

export function useCreateDndCharacter() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [name, setName] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const portrait = usePortraitSelection();
  const catalogs = useCreateDndCatalogs(classSearch);
  const classState = useCreateDndClassState();
  const backgroundState = useCreateDndBackgroundState(
    catalogs.availableBackgrounds,
  );

  const clearSelectedClass = () => {
    classState.clearSelectedClass();
    setClassSearch("");
  };

  return {
    activePhaseIndex,
    setActivePhaseIndex,
    name,
    setName,
    classSearch,
    setClassSearch,
    portraitFile: portrait.portraitFile,
    portraitPreview: portrait.portraitPreview,
    fileInputRef: portrait.fileInputRef,
    handlePortraitSelection: portrait.handlePortraitSelection,
    openFilePicker: portrait.openFilePicker,
    filteredClasses: catalogs.filteredClasses,
    availableBackgrounds: catalogs.availableBackgrounds,
    isLoadingClasses: catalogs.isLoadingClasses,
    classesError: catalogs.classesError,
    isLoadingBackgrounds: catalogs.isLoadingBackgrounds,
    backgroundsError: catalogs.backgroundsError,
    selectedClass: classState.selectedClass,
    previewClass: classState.previewClass,
    previewClassDetail: classState.previewClassDetail,
    isLoadingPreviewClassDetail: classState.isLoadingPreviewClassDetail,
    previewClassDetailError: classState.previewClassDetailError,
    selectedClassDetail: classState.selectedClassDetail,
    isLoadingSelectedClassDetail: classState.isLoadingSelectedClassDetail,
    selectedClassDetailError: classState.selectedClassDetailError,
    selectedSubclassId: classState.selectedSubclassId,
    setSelectedSubclassId: classState.setSelectedSubclassId,
    selectedSubclass: classState.selectedSubclass,
    subclassSkills: classState.subclassSkills,
    isLoadingSubclassSkills: classState.isLoadingSubclassSkills,
    subclassSkillsError: classState.subclassSkillsError,
    classSkills: classState.classSkills,
    isLoadingClassSkills: classState.isLoadingClassSkills,
    classSkillsError: classState.classSkillsError,
    isClassModalOpen: classState.isClassModalOpen,
    openClassModal: classState.openClassModal,
    closeClassModal: classState.closeClassModal,
    selectPreviewClass: classState.selectPreviewClass,
    clearSelectedClass,
    selectedBackgroundId: backgroundState.selectedBackgroundId,
    setSelectedBackgroundId: backgroundState.setSelectedBackgroundId,
    selectedBackgroundDetail: backgroundState.selectedBackgroundDetail,
    isLoadingSelectedBackgroundDetail:
      backgroundState.isLoadingSelectedBackgroundDetail,
    selectedBackgroundDetailError:
      backgroundState.selectedBackgroundDetailError,
    selectedBackgroundName: backgroundState.selectedBackgroundName,
  };
}
