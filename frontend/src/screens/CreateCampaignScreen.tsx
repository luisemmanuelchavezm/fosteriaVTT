import { ImagePlus, ScrollText } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import {
  CAMPAIGN_CREATION_SYSTEMS,
  type CampaignCreationSystem,
} from "../components/campaignSystem";
import { buildApiUrl } from "../lib/api";

const CAMPAIGN_BACKGROUND_URL =
  "https://res.cloudinary.com/doxqtmi46/image/upload/v1775178243/campa%C3%B1aPlaceHolder_fhrfx2.png";

interface CreateCampaignScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
  initialSystem: CampaignCreationSystem;
  onCampaignCreated?: (campaignId: string) => void;
}

export default function CreateCampaignScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
  initialSystem,
  onCampaignCreated,
}: CreateCampaignScreenProps) {
  const [campaignName, setCampaignName] = useState("");
  const [selectedSystem, setSelectedSystem] =
    useState<CampaignCreationSystem>(initialSystem);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; system?: string }>({});
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submitStatus, setSubmitStatus] = useState<"error" | "success" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedSystem(initialSystem);
  }, [initialSystem]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleCoverSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setCoverFile(file);
    setCoverPreview(objectUrl);
  };

  const validateForm = () => {
    const nextErrors: { name?: string; system?: string } = {};

    if (!campaignName.trim()) {
      nextErrors.name = "El nombre de la campaña es obligatorio";
    }

    if (!selectedSystem.trim()) {
      nextErrors.system = "Debes seleccionar un sistema de juego";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateCampaign = async () => {
    setSubmitMessage("");
    setSubmitStatus(null);

    if (!validateForm()) {
      setSubmitMessage("Rellena los campos obligatorios antes de continuar.");
      setSubmitStatus("error");
      return;
    }

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setSubmitMessage("Tu sesión no es válida. Vuelve a iniciar sesión.");
      setSubmitStatus("error");
      return;
    }

    const formData = new FormData();
    formData.append(
      "payload",
      new Blob(
        [
          JSON.stringify({
            nombre: campaignName.trim(),
            sistemaDeJuego: selectedSystem,
          }),
        ],
        { type: "application/json" },
      ),
    );

    if (coverFile) {
      formData.append("cover", coverFile);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/api/campanas"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let backendMessage = "No se pudo crear la campaña";
        const contentType = response.headers.get("content-type") ?? "";

        try {
          if (contentType.includes("application/json")) {
            const errorBody = (await response.json()) as {
              message?: string;
              detail?: string;
              error?: string;
            };
            backendMessage =
              errorBody.detail ??
              errorBody.message ??
              errorBody.error ??
              backendMessage;
          } else {
            const fallbackText = await response.text();
            if (fallbackText.trim()) {
              backendMessage = fallbackText.trim();
            }
          }
        } catch {
          // Usamos el mensaje por defecto si el cuerpo no se puede interpretar.
        }

        throw new Error(backendMessage);
      }

      const createdCampaign = (await response.json()) as {
        id: number;
      };

      setSubmitMessage("Campaña creada con éxito.");
      setSubmitStatus("success");
      window.setTimeout(() => {
        if (onCampaignCreated) {
          onCampaignCreated(String(createdCampaign.id));
          return;
        }

        onGoCampaigns();
      }, 900);
    } catch (error) {
      setSubmitMessage((error as Error).message);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }

    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }

    onGoCharacters();
  };

  return (
    <LogoLayout
      onLogoClick={onGoHome}
      fullWidth
      backgroundImageUrl={CAMPAIGN_BACKGROUND_URL}
    >
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="overflow-hidden rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <div className="flex min-h-[620px] flex-col">
              <div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  Creación de campaña
                </h1>
              </div>

              <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-2xl rounded-[28px] border border-white/15 bg-stone-950/80 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-7">
                  <div className="grid gap-6">
                    <div className="mx-auto w-full max-w-sm">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-100/85">
                        <ImagePlus className="h-4 w-4" />
                        Portada
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelection}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 flex min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-stone-300/20 bg-[linear-gradient(180deg,rgba(28,25,23,0.65),rgba(12,10,9,0.3))] text-center transition hover:border-amber-300/40 hover:bg-stone-950/55"
                      >
                        {coverPreview ? (
                          <img
                            src={coverPreview}
                            alt="Vista previa de la portada"
                            className="h-[220px] w-full object-cover"
                          />
                        ) : (
                          <>
                            <ImagePlus className="h-10 w-10 text-amber-100" />
                            <span className="mt-3 px-4 text-sm font-semibold text-white">
                              Arrastra una imagen o pulsa para subirla
                            </span>
                            <span className="mt-2 text-xs text-stone-300/80">
                              Portada de la campaña
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mx-auto w-full max-w-xl">
                      <p className="flex items-center gap-2 text-sm font-semibold text-amber-100/85">
                        <ScrollText className="h-4 w-4" />
                        Nombre de la campaña
                      </p>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(event) => {
                          setCampaignName(event.target.value);
                          if (errors.name) {
                            setErrors((current) => ({
                              ...current,
                              name: undefined,
                            }));
                          }
                          setSubmitMessage("");
                          setSubmitStatus(null);
                        }}
                        placeholder="Escribe el nombre de la campaña"
                        className={`mt-3 h-14 w-full rounded-[20px] border bg-black/30 px-5 text-base text-white outline-none transition placeholder:text-stone-400 ${
                          errors.name
                            ? "border-red-500/80 ring-2 ring-red-600/60"
                            : "border-stone-300/15 focus:border-amber-300/50"
                        }`}
                      />
                      {errors.name ? (
                        <p className="mt-2 text-[12px] font-extrabold text-red-800 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse">
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="mx-auto w-full max-w-xl">
                      <p className="text-sm font-semibold text-amber-100/85">
                        Sistema de juego
                      </p>
                      <select
                        value={selectedSystem}
                        onChange={(event) => {
                          setSelectedSystem(
                            event.target.value as CampaignCreationSystem,
                          );
                          if (errors.system) {
                            setErrors((current) => ({
                              ...current,
                              system: undefined,
                            }));
                          }
                          setSubmitMessage("");
                          setSubmitStatus(null);
                        }}
                        className={`mt-3 h-14 w-full rounded-[20px] border bg-black/30 px-5 text-base text-white outline-none transition ${
                          errors.system
                            ? "border-red-500/80 ring-2 ring-red-600/60"
                            : "border-stone-300/15 focus:border-amber-300/50"
                        }`}
                      >
                        {CAMPAIGN_CREATION_SYSTEMS.map((system) => (
                          <option
                            key={system}
                            value={system}
                            className="bg-stone-900"
                          >
                            {system}
                          </option>
                        ))}
                      </select>
                      {errors.system ? (
                        <p className="mt-2 text-[12px] font-extrabold text-red-800 bg-red-100/90 border border-red-400 shadow-md px-3 py-1 rounded-md drop-shadow animate-pulse">
                          {errors.system}
                        </p>
                      ) : null}
                    </div>

                    <div className="mx-auto w-full max-w-xl">
                      <button
                        type="button"
                        onClick={() => {
                          void handleCreateCampaign();
                        }}
                        disabled={isSubmitting}
                        className="h-12 w-full rounded-full border border-amber-200/35 bg-amber-200/10 px-7 text-base font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-200/15 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isSubmitting ? "Creando campaña..." : "Crear campaña"}
                      </button>

                      {submitMessage ? (
                        <p
                          className={`mt-3 text-center text-[12px] font-extrabold border shadow-md px-3 py-1 rounded-md drop-shadow ${
                            submitStatus === "success"
                              ? "text-emerald-900 bg-emerald-100/90 border-emerald-400"
                              : "text-red-800 bg-red-100/90 border-red-400 animate-pulse"
                          }`}
                        >
                          {submitMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HomeNavbar activeTab="campaigns" onTabChange={handleNavChange} />
      </>
    </LogoLayout>
  );
}
