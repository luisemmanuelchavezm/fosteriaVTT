import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import HomeNavbar, { type NavTab } from "../../components/HomeNavbar";
import LogoLayout from "../../components/LogoLayout";
import UserMenu from "../../components/UserMenu";
import {
  fetchDndCharacterDetail,
  type DndCharacterDetailResponse,
} from "./utils/dndApi";
import IdentitySection from "./sheet/components/IdentitySection";
import StatisticsSection from "./sheet/components/StatisticsSection";
import ResourcesSection from "./sheet/components/ResourcesSection";
import ChecksSection from "./sheet/components/ChecksSection";
import DetailTabsSection from "./sheet/components/DetailTabsSection";
import { type DetailTab } from "./sheet/data";
import { applyDamage, getStatValue } from "./sheet/utils";

interface DndCharacterSheetScreenProps {
  username: string;
  avatarUrl: string;
  characterId: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
}

const HEALTH_TOTAL_STAT = "Puntos de vida";
const HEALTH_CURRENT_STAT = "Vida actual";
const HEALTH_TEMP_STAT = "Vida temporal";
const MOVEMENT_STAT = "Movimiento";

export default function DndCharacterSheetScreen({
  username,
  avatarUrl,
  characterId,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
}: DndCharacterSheetScreenProps) {
  const [character, setCharacter] = useState<DndCharacterDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hpDelta, setHpDelta] = useState("0");
  const [currentHp, setCurrentHp] = useState(0);
  const [tempHp, setTempHp] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("actions");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setCharacter(null);
      setLoadError("No se pudo autenticar la hoja del personaje.");
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadCharacter = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchDndCharacterDetail(
          token,
          characterId,
          abortController.signal,
        );
        setCharacter(data);
        setCurrentHp(data.estadisticas[HEALTH_CURRENT_STAT] ?? 0);
        setTempHp(data.estadisticas[HEALTH_TEMP_STAT] ?? 0);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setCharacter(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la hoja del personaje.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCharacter();

    return () => {
      abortController.abort();
    };
  }, [characterId]);

  const totalHp = useMemo(
    () => getStatValue(character, HEALTH_TOTAL_STAT),
    [character],
  );
  const movement = useMemo(
    () => getStatValue(character, MOVEMENT_STAT),
    [character],
  );
  const dexterityScore = useMemo(
    () => getStatValue(character, "Destreza"),
    [character],
  );
  const initiative = useMemo(
    () => Math.floor((dexterityScore - 10) / 2),
    [dexterityScore],
  );

  const parsedHpDelta = Number.parseInt(hpDelta, 10);
  const hpStepValue = Number.isNaN(parsedHpDelta) ? 0 : parsedHpDelta;

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

  const handleHeal = () => {
    if (hpStepValue <= 0) {
      return;
    }

    setCurrentHp((current) => Math.min(totalHp, current + hpStepValue));
  };

  const handleDamage = () => {
    if (hpStepValue <= 0) {
      return;
    }

    const nextValues = applyDamage(currentHp, tempHp, hpStepValue);
    setCurrentHp(nextValues.currentHp);
    setTempHp(nextValues.tempHp);
  };

  return (
    <LogoLayout onLogoClick={onGoHome} fullWidth>
      <>
        <UserMenu
          username={username}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />

        <div className="relative z-10 w-full px-4 pt-28 pb-32 md:px-8 md:pb-36">
          <div className="relative overflow-hidden rounded-[32px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.96)_0%,rgba(28,25,23,0.92)_48%,rgba(10,10,10,0.98)_100%)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <div className="pointer-events-none absolute -top-20 right-[-50px] h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[-30px] h-64 w-64 rounded-full bg-stone-300/10 blur-3xl" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-200/80">
                  Dungeons and Dragons
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                  Hoja de personaje
                </h1>
              </div>

              <button
                type="button"
                onClick={onGoCharacters}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300/15 bg-stone-950/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-amber-300/25 hover:bg-stone-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a personajes
              </button>
            </div>

            {isLoading ? (
              <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-stone-300">
                Cargando hoja del personaje...
              </div>
            ) : null}

            {!isLoading && loadError ? (
              <div className="mt-8 rounded-[26px] border border-rose-400/35 bg-rose-950/25 px-6 py-5 text-sm font-medium text-rose-100">
                {loadError}
              </div>
            ) : null}

            {!isLoading && !loadError && character ? (
              <div className="mt-8 space-y-8">
                <IdentitySection character={character} />
                <StatisticsSection
                  character={character}
                  hpDelta={hpDelta}
                  currentHp={currentHp}
                  tempHp={tempHp}
                  totalHp={totalHp}
                  onHpDeltaChange={setHpDelta}
                  onHeal={handleHeal}
                  onDamage={handleDamage}
                />
                <ResourcesSection
                  character={character}
                  movement={movement}
                  initiative={initiative}
                />
                <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)] xl:items-start">
                  <ChecksSection character={character} />
                  <DetailTabsSection
                    character={character}
                    activeTab={activeDetailTab}
                    onTabChange={setActiveDetailTab}
                  />
                </section>
              </div>
            ) : null}
          </div>
        </div>

        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      </>
    </LogoLayout>
  );
}
