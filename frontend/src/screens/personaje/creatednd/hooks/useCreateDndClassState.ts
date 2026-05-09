import { useEffect, useMemo, useState } from "react";
import {
  fetchClassSkills,
  fetchClassSubclassSkills,
  fetchDndClassDetail,
  type ClassSkillGroup,
} from "../../utils/dndApi";
import type {
  DndClassDetail,
  DndClassSummary,
  DndSubclassDetail,
} from "../../types";

export function useCreateDndClassState() {
  const [selectedClass, setSelectedClass] = useState<DndClassSummary | null>(
    null,
  );
  const [previewClass, setPreviewClass] = useState<DndClassSummary | null>(
    null,
  );
  const [previewClassDetail, setPreviewClassDetail] =
    useState<DndClassDetail | null>(null);
  const [isLoadingPreviewClassDetail, setIsLoadingPreviewClassDetail] =
    useState(false);
  const [previewClassDetailError, setPreviewClassDetailError] = useState<
    string | null
  >(null);
  const [selectedClassDetail, setSelectedClassDetail] =
    useState<DndClassDetail | null>(null);
  const [isLoadingSelectedClassDetail, setIsLoadingSelectedClassDetail] =
    useState(false);
  const [selectedClassDetailError, setSelectedClassDetailError] = useState<
    string | null
  >(null);
  const [classSkills, setClassSkills] = useState<ClassSkillGroup[]>([]);
  const [isLoadingClassSkills, setIsLoadingClassSkills] = useState(false);
  const [classSkillsError, setClassSkillsError] = useState<string | null>(null);
  const [selectedSubclassId, setSelectedSubclassId] = useState("");
  const [subclassSkills, setSubclassSkills] = useState<ClassSkillGroup[]>([]);
  const [isLoadingSubclassSkills, setIsLoadingSubclassSkills] = useState(false);
  const [subclassSkillsError, setSubclassSkillsError] = useState<string | null>(
    null,
  );
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  const selectedSubclass = useMemo<DndSubclassDetail | null>(() => {
    if (!selectedSubclassId || !selectedClassDetail) {
      return null;
    }

    return (
      selectedClassDetail.subclases.find(
        (item) => item.id === selectedSubclassId,
      ) ?? null
    );
  }, [selectedClassDetail, selectedSubclassId]);

  useEffect(() => {
    if (!previewClass) {
      setPreviewClassDetail(null);
      setPreviewClassDetailError(null);
      setIsLoadingPreviewClassDetail(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setPreviewClassDetail(null);
      setPreviewClassDetailError("No se pudo autenticar la carga de la clase.");
      return;
    }

    const abortController = new AbortController();

    const loadPreviewClassDetail = async () => {
      try {
        setIsLoadingPreviewClassDetail(true);
        setPreviewClassDetailError(null);
        const data = await fetchDndClassDetail(
          token,
          previewClass.id,
          abortController.signal,
        );
        setPreviewClassDetail(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setPreviewClassDetail(null);
          setPreviewClassDetailError(
            "No se pudo cargar la información de la clase.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingPreviewClassDetail(false);
        }
      }
    };

    void loadPreviewClassDetail();

    return () => abortController.abort();
  }, [previewClass]);

  useEffect(() => {
    if (!previewClass) {
      setClassSkills([]);
      setClassSkillsError(null);
      setIsLoadingClassSkills(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setClassSkills([]);
      setClassSkillsError("No se pudo autenticar la carga de habilidades.");
      return;
    }

    const abortController = new AbortController();

    const loadClassSkills = async () => {
      try {
        setIsLoadingClassSkills(true);
        setClassSkillsError(null);
        const data = await fetchClassSkills(
          token,
          previewClass.id,
          abortController.signal,
        );
        setClassSkills(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setClassSkills([]);
          setClassSkillsError(
            "No se pudieron cargar las habilidades de la clase.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingClassSkills(false);
        }
      }
    };

    void loadClassSkills();

    return () => abortController.abort();
  }, [previewClass]);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedClassDetail(null);
      setSelectedClassDetailError(null);
      setIsLoadingSelectedClassDetail(false);
      setSelectedSubclassId("");
      setSubclassSkills([]);
      setSubclassSkillsError(null);
      setIsLoadingSubclassSkills(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSelectedClassDetail(null);
      setSelectedClassDetailError(
        "No se pudo autenticar la carga de la clase seleccionada.",
      );
      return;
    }

    const abortController = new AbortController();

    const loadSelectedClassDetail = async () => {
      try {
        setIsLoadingSelectedClassDetail(true);
        setSelectedClassDetailError(null);
        const data = await fetchDndClassDetail(
          token,
          selectedClass.id,
          abortController.signal,
        );
        setSelectedClassDetail(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSelectedClassDetail(null);
          setSelectedClassDetailError(
            "No se pudo cargar la información de la clase seleccionada.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingSelectedClassDetail(false);
        }
      }
    };

    void loadSelectedClassDetail();

    return () => abortController.abort();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSubclassId) {
      setSubclassSkills([]);
      setSubclassSkillsError(null);
      setIsLoadingSubclassSkills(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSubclassSkills([]);
      setSubclassSkillsError("No se pudo autenticar la carga de la subclase.");
      return;
    }

    const abortController = new AbortController();

    const loadSubclassSkills = async () => {
      try {
        setIsLoadingSubclassSkills(true);
        setSubclassSkillsError(null);
        const data = await fetchClassSubclassSkills(
          token,
          selectedClass.id,
          selectedSubclassId,
          abortController.signal,
        );
        setSubclassSkills(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSubclassSkills([]);
          setSubclassSkillsError(
            "No se pudieron cargar las habilidades de la subclase.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingSubclassSkills(false);
        }
      }
    };

    void loadSubclassSkills();

    return () => abortController.abort();
  }, [selectedClass, selectedSubclassId]);

  const openClassModal = (item: DndClassSummary) => {
    setPreviewClass(item);
    setIsClassModalOpen(true);
  };

  const closeClassModal = () => {
    setIsClassModalOpen(false);
    setPreviewClass(null);
    setPreviewClassDetail(null);
  };

  const selectPreviewClass = () => {
    if (!previewClass || !previewClassDetail) {
      return;
    }

    setSelectedClass(previewClass);
    setSelectedClassDetail(previewClassDetail);
    setSelectedClassDetailError(null);
    setSelectedSubclassId("");
    setSubclassSkills([]);
    setSubclassSkillsError(null);
    setIsClassModalOpen(false);
    setPreviewClass(null);
  };

  const clearSelectedClass = () => {
    setSelectedClass(null);
    setSelectedClassDetail(null);
    setSelectedClassDetailError(null);
    setSelectedSubclassId("");
    setSubclassSkills([]);
    setSubclassSkillsError(null);
  };

  return {
    selectedClass,
    previewClass,
    previewClassDetail,
    isLoadingPreviewClassDetail,
    previewClassDetailError,
    selectedClassDetail,
    isLoadingSelectedClassDetail,
    selectedClassDetailError,
    classSkills,
    isLoadingClassSkills,
    classSkillsError,
    selectedSubclassId,
    setSelectedSubclassId,
    selectedSubclass,
    subclassSkills,
    isLoadingSubclassSkills,
    subclassSkillsError,
    isClassModalOpen,
    openClassModal,
    closeClassModal,
    selectPreviewClass,
    clearSelectedClass,
  };
}
