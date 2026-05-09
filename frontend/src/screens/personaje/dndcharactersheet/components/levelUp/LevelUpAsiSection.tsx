import type { CharacterAbilityResponse } from "../../../utils/dndApi";
import {
  ATTRIBUTE_OPTIONS,
  type LevelUpModalController,
} from "../../hooks/useLevelUpModalState";

interface LevelUpAsiSectionProps {
  controller: LevelUpModalController;
}

export default function LevelUpAsiSection({
  controller,
}: LevelUpAsiSectionProps) {
  const {
    asiSectionRef,
    asiMode,
    asiPrimary,
    asiSecondary,
    setAsiMode,
    setAsiPrimary,
    setAsiSecondary,
    featOptions,
    selectedFeat,
    selectedFeatId,
    setSelectedFeatDetail,
    setSelectedFeatId,
    setSelectedFeatStats,
    setSelectedFeatCompetencies,
    setSelectedFeatSkills,
    setSelectedFeatLanguages,
    setSelectedFeatSpellClass,
    setSelectedFeatCantrips,
    setSelectedFeatSpells,
    selectedFeatStats,
    selectedFeatCompetencies,
    selectedFeatSkills,
    selectedFeatLanguages,
    selectedFeatSpellClass,
    selectedFeatCantrips,
    selectedFeatSpells,
    featCantripOptions,
    featSpellOptions,
  } = controller;

  return (
    <section
      ref={asiSectionRef}
      className="rounded-[24px] border border-stone-300/10 bg-black/25 p-5"
    >
      <h4 className="text-xl font-semibold text-white">
        Mejora de característica o dote
      </h4>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setAsiMode("double")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${asiMode === "double" ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-stone-300/10 text-stone-200"}`}
        >
          +1 y +1
        </button>
        <button
          type="button"
          onClick={() => setAsiMode("single")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${asiMode === "single" ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-stone-300/10 text-stone-200"}`}
        >
          +2 a una característica
        </button>
        <button
          type="button"
          onClick={() => setAsiMode("feat")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${asiMode === "feat" ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-stone-300/10 text-stone-200"}`}
        >
          Elegir dote
        </button>
      </div>

      {asiMode !== "feat" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200">
            Característica principal
            <select
              value={asiPrimary}
              onChange={(event) => setAsiPrimary(event.target.value)}
              className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
            >
              {ATTRIBUTE_OPTIONS.map((attribute) => (
                <option key={attribute} value={attribute}>
                  {attribute}
                </option>
              ))}
            </select>
          </label>
          {asiMode === "double" ? (
            <label className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200">
              Característica secundaria
              <select
                value={asiSecondary}
                onChange={(event) => setAsiSecondary(event.target.value)}
                className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
              >
                {ATTRIBUTE_OPTIONS.map((attribute) => (
                  <option key={attribute} value={attribute}>
                    {attribute}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {featOptions.map(({ feat, valid }) => {
              const selected = feat.id === selectedFeatId;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={feat.id}
                  onClick={() => {
                    setSelectedFeatId(feat.id);
                    setSelectedFeatStats([]);
                    setSelectedFeatCompetencies([]);
                    setSelectedFeatSkills([]);
                    setSelectedFeatLanguages([]);
                    setSelectedFeatSpellClass("");
                    setSelectedFeatCantrips([]);
                    setSelectedFeatSpells([]);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedFeatId(feat.id);
                      setSelectedFeatStats([]);
                      setSelectedFeatCompetencies([]);
                      setSelectedFeatSkills([]);
                      setSelectedFeatLanguages([]);
                      setSelectedFeatSpellClass("");
                      setSelectedFeatCantrips([]);
                      setSelectedFeatSpells([]);
                    }
                  }}
                  className={`rounded-[20px] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 ${selected ? "border-sky-300/40 bg-sky-400/10" : "border-stone-300/10 bg-black/20 hover:border-sky-300/25 hover:bg-sky-400/5"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-white">
                      {feat.nombre}
                    </p>
                    <div className="flex items-center gap-2">
                      {!valid ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                          Homebrew
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedFeatDetail(feat);
                        }}
                        className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100"
                      >
                        Info+
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    {feat.descripcion}
                  </p>
                  {feat.requisitos.length > 0 ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-stone-400">
                      Requisitos: {feat.requisitos.join(", ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedFeat?.selectableBonus ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from(
                { length: selectedFeat.selectableBonus.count },
                (_, index) => (
                  <label
                    key={`feat-bonus-${index}`}
                    className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                  >
                    Bonificación {index + 1}
                    <select
                      value={selectedFeatStats[index] ?? ""}
                      onChange={(event) =>
                        setSelectedFeatStats((current: string[]) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                    >
                      <option value="">Elegir</option>
                      {(selectedFeat.selectableBonus?.options ?? []).map(
                        (attribute: string) => (
                          <option key={attribute} value={attribute}>
                            {attribute}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ),
              )}
            </div>
          ) : null}
          {selectedFeat?.selectableCompetencies ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from(
                { length: selectedFeat.selectableCompetencies.count },
                (_, index) => (
                  <label
                    key={`feat-competency-${index}`}
                    className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                  >
                    Arma {index + 1}
                    <select
                      value={selectedFeatCompetencies[index] ?? ""}
                      onChange={(event) =>
                        setSelectedFeatCompetencies((current: string[]) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                    >
                      <option value="">Elegir</option>
                      {(selectedFeat.selectableCompetencies?.options ?? []).map(
                        (competency: string) => (
                          <option
                            key={competency}
                            value={competency}
                            disabled={selectedFeatCompetencies.some(
                              (selectedValue: string, selectedIndex: number) =>
                                selectedIndex !== index &&
                                selectedValue === competency,
                            )}
                          >
                            {competency}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ),
              )}
            </div>
          ) : null}
          {selectedFeat?.selectableSkills ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from(
                { length: selectedFeat.selectableSkills.count },
                (_, index) => (
                  <label
                    key={`feat-skill-${index}`}
                    className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                  >
                    Habilidad {index + 1}
                    <select
                      value={selectedFeatSkills[index] ?? ""}
                      onChange={(event) =>
                        setSelectedFeatSkills((current: string[]) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                    >
                      <option value="">Elegir</option>
                      {(selectedFeat.selectableSkills?.options ?? []).map(
                        (skill: string) => (
                          <option
                            key={skill}
                            value={skill}
                            disabled={selectedFeatSkills.some(
                              (selectedValue: string, selectedIndex: number) =>
                                selectedIndex !== index &&
                                selectedValue === skill,
                            )}
                          >
                            {skill}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ),
              )}
            </div>
          ) : null}
          {selectedFeat?.selectableLanguages ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from(
                { length: selectedFeat.selectableLanguages.count },
                (_, index) => (
                  <label
                    key={`feat-language-${index}`}
                    className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                  >
                    Idioma {index + 1}
                    <select
                      value={selectedFeatLanguages[index] ?? ""}
                      onChange={(event) =>
                        setSelectedFeatLanguages((current: string[]) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                    >
                      <option value="">Elegir</option>
                      {(selectedFeat.selectableLanguages?.options ?? []).map(
                        (language: string) => (
                          <option
                            key={language}
                            value={language}
                            disabled={selectedFeatLanguages.some(
                              (selectedValue: string, selectedIndex: number) =>
                                selectedIndex !== index &&
                                selectedValue === language,
                            )}
                          >
                            {language}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ),
              )}
            </div>
          ) : null}
          {selectedFeat?.spellSelection ? (
            <div className="space-y-4">
              {selectedFeat.spellSelection.chooseClass ? (
                <label className="block rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200">
                  Clase de la dote
                  <select
                    value={selectedFeatSpellClass}
                    onChange={(event) => {
                      setSelectedFeatSpellClass(event.target.value);
                      setSelectedFeatCantrips([]);
                      setSelectedFeatSpells([]);
                    }}
                    className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                  >
                    <option value="">Elegir clase</option>
                    {selectedFeat.spellSelection.classOptions?.map(
                      (classId: string) => (
                        <option key={classId} value={classId}>
                          {classId.charAt(0).toUpperCase() + classId.slice(1)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ) : null}
              {selectedFeat.spellSelection.cantrips > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from(
                    { length: selectedFeat.spellSelection.cantrips },
                    (_, index) => (
                      <label
                        key={`feat-cantrip-${index}`}
                        className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                      >
                        Truco {index + 1}
                        <select
                          value={selectedFeatCantrips[index] ?? ""}
                          onChange={(event) =>
                            setSelectedFeatCantrips((current: string[]) => {
                              const next = [...current];
                              next[index] = event.target.value;
                              return next;
                            })
                          }
                          className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                        >
                          <option value="">Elegir truco</option>
                          {featCantripOptions.map(
                            (spell: CharacterAbilityResponse) => (
                              <option
                                key={spell.id}
                                value={spell.nombre}
                                disabled={selectedFeatCantrips.some(
                                  (
                                    selectedValue: string,
                                    selectedIndex: number,
                                  ) =>
                                    selectedIndex !== index &&
                                    selectedValue === spell.nombre,
                                )}
                              >
                                {spell.nombre}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    ),
                  )}
                </div>
              ) : null}
              {selectedFeat.spellSelection.spells > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from(
                    { length: selectedFeat.spellSelection.spells },
                    (_, index) => (
                      <label
                        key={`feat-spell-${index}`}
                        className="rounded-[20px] border border-stone-300/10 bg-black/20 p-4 text-sm text-stone-200"
                      >
                        Conjuro nivel{" "}
                        {selectedFeat.spellSelection?.spellLevel ?? 1}
                        <select
                          value={selectedFeatSpells[index] ?? ""}
                          onChange={(event) =>
                            setSelectedFeatSpells((current: string[]) => {
                              const next = [...current];
                              next[index] = event.target.value;
                              return next;
                            })
                          }
                          className="mt-3 w-full rounded-[14px] border border-white/10 bg-black/35 px-3 py-3 text-white outline-none"
                        >
                          <option value="">Elegir conjuro</option>
                          {featSpellOptions.map(
                            (spell: CharacterAbilityResponse) => (
                              <option
                                key={spell.id}
                                value={spell.nombre}
                                disabled={selectedFeatSpells.some(
                                  (
                                    selectedValue: string,
                                    selectedIndex: number,
                                  ) =>
                                    selectedIndex !== index &&
                                    selectedValue === spell.nombre,
                                )}
                              >
                                {spell.nombre}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
