import { useEffect, useMemo, useState } from "react";
import HomeNavbar, { type NavTab } from "../components/HomeNavbar";
import LogoLayout from "../components/LogoLayout";
import UserMenu from "../components/UserMenu";
import { buildApiUrl } from "../lib/api";

interface CharactersScreenProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
  onGoHome: () => void;
  onGoCampaigns: () => void;
  onGoCharacters: () => void;
}

interface CharacterSummary {
  id: string;
  name: string;
  image?: string;
  system: string;
  usedAt: string;
}

const INITIAL_VISIBLE_CHARACTERS = 15;

function formatUsedAt(usedAt: string) {
  const parsedDate = new Date(usedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return usedAt;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export default function CharactersScreen({
  username,
  avatarUrl,
  onLogout,
  onGoHome,
  onGoCampaigns,
  onGoCharacters,
}: CharactersScreenProps) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CHARACTERS);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      setCharacters([]);
      return;
    }

    const abortController = new AbortController();

    const loadCharacters = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/personajes"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los personajes");
        }

        const data = (await response.json()) as Array<{
          id: number;
          nombre: string;
          retrato?: string;
          sistemaDeJuego: string;
          usado: string;
        }>;

        setCharacters(
          data.map((character) => ({
            id: String(character.id),
            name: character.nombre,
            image: character.retrato,
            system: character.sistemaDeJuego,
            usedAt: character.usado,
          })),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCharacters([]);
        }
      }
    };

    loadCharacters();

    return () => {
      abortController.abort();
    };
  }, []);

  const hasMoreCharacters = visibleCount < characters.length;
  const visibleCharacters = useMemo(
    () => characters.slice(0, visibleCount),
    [characters, visibleCount],
  );

  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      onGoHome();
      return;
    }

    if (tab === "campaigns") {
      onGoCampaigns();
      return;
    }

    if (tab === "characters") {
      onGoCharacters();
    }
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
          <div className="rounded-[32px] border border-white/15 bg-stone-950/70 p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Personajes
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleCharacters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    className="grid min-h-[250px] overflow-hidden rounded-[24px] border border-amber-200/35 bg-stone-900 text-left shadow-xl transition duration-300 hover:-translate-y-1 hover:border-amber-200/70"
                  >
                    <div className="grid h-full md:grid-cols-[1fr_1fr]">
                      <div className="relative min-h-[180px] bg-stone-800 md:min-h-full">
                        {character.image ? (
                          <img
                            src={character.image}
                            alt={character.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-5xl text-white/70">
                            ⚔
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between gap-4 p-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">
                            Personaje
                          </p>
                          <h3 className="mt-2 text-2xl font-bold text-white">
                            {character.name}
                          </h3>
                        </div>

                        <div className="space-y-3 text-sm text-stone-300">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              Sistema de juego
                            </p>
                            <p className="mt-1 text-base font-semibold text-stone-100">
                              {character.system}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              Usado por ultima vez
                            </p>
                            <p className="mt-1 text-base font-semibold text-stone-100">
                              {formatUsedAt(character.usedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  aria-label="Crear un nuevo personaje"
                  className="flex min-h-[250px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white shadow-xl transition duration-300 hover:scale-[1.03] hover:shadow-[0_20px_35px_rgba(255,255,255,0.18)]"
                >
                  <span className="text-7xl font-light leading-none text-stone-500">
                    +
                  </span>
                </button>
              </div>

              {hasMoreCharacters ? (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount(
                        (current) => current + INITIAL_VISIBLE_CHARACTERS,
                      )
                    }
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Mostrar mas
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <HomeNavbar activeTab="characters" onTabChange={handleNavChange} />
      </>
    </LogoLayout>
  );
}
