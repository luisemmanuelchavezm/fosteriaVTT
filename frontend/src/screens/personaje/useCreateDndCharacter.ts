import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchClassSkills,
  fetchDndBackgroundDetail,
  fetchDndBackgroundSummaries,
  fetchDndClassDetail,
  fetchDndClassSummaries,
  type ClassSkillGroup,
} from "./utils/dndApi";
import type {
  DndBackgroundDetail,
  DndBackgroundSummary,
  DndClassDetail,
  DndClassSummary,
} from "./types";

export function useCreateDndCharacter() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [name, setName] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [availableClasses, setAvailableClasses] = useState<DndClassSummary[]>(
    [],
  );
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
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
  const [availableBackgrounds, setAvailableBackgrounds] = useState<
    DndBackgroundSummary[]
  >([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState("");
  const [selectedBackgroundDetail, setSelectedBackgroundDetail] =
    useState<DndBackgroundDetail | null>(null);
  const [
    isLoadingSelectedBackgroundDetail,
    setIsLoadingSelectedBackgroundDetail,
  ] = useState(false);
  const [selectedBackgroundDetailError, setSelectedBackgroundDetailError] =
    useState<string | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredClasses = useMemo(() => {
    const normalizedQuery = classSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableClasses;
    }

    return availableClasses.filter((item) =>
      item.nombre.toLowerCase().includes(normalizedQuery),
    );
  }, [availableClasses, classSearch]);

  const selectedBackgroundName = useMemo(() => {
    if (selectedBackgroundDetail) {
      return selectedBackgroundDetail.nombre;
    }

    return (
      availableBackgrounds.find(
        (background) => background.id === selectedBackgroundId,
      )?.nombre ?? selectedBackgroundId
    );
  }, [availableBackgrounds, selectedBackgroundDetail, selectedBackgroundId]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setAvailableClasses([]);
      setClassesError("No se pudo autenticar la carga de clases.");
      setAvailableBackgrounds([]);
      setBackgroundsError("No se pudo autenticar la carga de trasfondos.");
      return;
    }

    const abortController = new AbortController();

    const loadDndInfo = async () => {
      try {
        setIsLoadingClasses(true);
        setClassesError(null);
        setIsLoadingBackgrounds(true);
        setBackgroundsError(null);

        const [classes, backgrounds] = await Promise.all([
          fetchDndClassSummaries(token, abortController.signal),
          fetchDndBackgroundSummaries(token, abortController.signal),
        ]);

        setAvailableClasses(classes);
        setAvailableBackgrounds(backgrounds);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAvailableClasses([]);
          setClassesError("No se pudo cargar la lista de clases.");
          setAvailableBackgrounds([]);
          setBackgroundsError("No se pudo cargar la lista de trasfondos.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingClasses(false);
          setIsLoadingBackgrounds(false);
        }
      }
    };

    void loadDndInfo();

    return () => abortController.abort();
  }, []);

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
            "No se pudo cargar la informacion de la clase.",
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
            "No se pudo cargar la informacion de la clase seleccionada.",
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
    if (!selectedBackgroundId) {
      setSelectedBackgroundDetail(null);
      setSelectedBackgroundDetailError(null);
      setIsLoadingSelectedBackgroundDetail(false);
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSelectedBackgroundDetail(null);
      setSelectedBackgroundDetailError(
        "No se pudo autenticar la carga del trasfondo.",
      );
      return;
    }

    const abortController = new AbortController();

    const loadSelectedBackgroundDetail = async () => {
      try {
        setIsLoadingSelectedBackgroundDetail(true);
        setSelectedBackgroundDetailError(null);
        const data = await fetchDndBackgroundDetail(
          token,
          selectedBackgroundId,
          abortController.signal,
        );
        setSelectedBackgroundDetail(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSelectedBackgroundDetail(null);
          setSelectedBackgroundDetailError(
            "No se pudo cargar la informacion del trasfondo.",
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingSelectedBackgroundDetail(false);
        }
      }
    };

    void loadSelectedBackgroundDetail();

    return () => abortController.abort();
  }, [selectedBackgroundId]);

  const handlePortraitSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPortraitFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPortraitPreview(
        typeof reader.result === "string" ? reader.result : null,
      );
    };
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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
    if (!previewClass) {
      return;
    }

    setSelectedClass(previewClass);
    setSelectedClassDetail(previewClassDetail);
    setSelectedClassDetailError(null);
    setIsClassModalOpen(false);
    setPreviewClass(null);
  };

  return {
    activePhaseIndex,
    setActivePhaseIndex,
    name,
    setName,
    classSearch,
    setClassSearch,
    portraitFile,
    portraitPreview,
    filteredClasses,
    availableBackgrounds,
    isLoadingClasses,
    classesError,
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
    isLoadingBackgrounds,
    backgroundsError,
    selectedBackgroundId,
    setSelectedBackgroundId,
    selectedBackgroundDetail,
    isLoadingSelectedBackgroundDetail,
    selectedBackgroundDetailError,
    selectedBackgroundName,
    isClassModalOpen,
    fileInputRef,
    handlePortraitSelection,
    openFilePicker,
    openClassModal,
    closeClassModal,
    selectPreviewClass,
  };
}
