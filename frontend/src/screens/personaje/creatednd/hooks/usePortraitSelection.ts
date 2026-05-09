import { useRef, useState } from "react";

export function usePortraitSelection() {
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return {
    portraitFile,
    portraitPreview,
    fileInputRef,
    handlePortraitSelection,
    openFilePicker,
  };
}
