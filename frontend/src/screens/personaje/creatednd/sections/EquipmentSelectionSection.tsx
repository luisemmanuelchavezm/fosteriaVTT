import { useEffect, useState } from "react";
import ValidationMessage from "./ValidationMessage";
import {
  buildEquipmentCatalogSelections,
  buildEquipmentCatalogSelectionKeys,
  buildEquipmentMeta,
  formatEquipmentOption,
} from "../utils/equipmentUtils";
import type { DndEquipment, EquipmentSelectionSnapshot } from "../types";

const PANEL_CLASSES =
  "rounded-[24px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))]";

interface EquipmentSelectionSectionProps {
  classEquipment: DndEquipment | null;
  backgroundEquipment: DndEquipment | null;
  classEquipmentName: string;
  backgroundEquipmentName: string;
  isLoadingClassEquipment: boolean;
  isLoadingBackgroundEquipment: boolean;
  classEquipmentError: string | null;
  backgroundEquipmentError: string | null;
  onCreateCharacter?: () => void;
  onSelectionChange?: (selection: EquipmentSelectionSnapshot) => void;
  fieldErrors?: Record<string, string>;
  hasError?: boolean;
  isCreating?: boolean;
  isCreateDisabled?: boolean;
}

type SelectedGroupState = Record<string, number | null>;
type SelectedCatalogByGroup = Record<string, number | null>;

function buildSelectionKey(originId: string, groupId: string) {
  return `${originId}:${groupId}`;
}

function EquipmentOriginCard({
  equipment,
  originId,
  originName,
  selectedGroups,
  selectedCatalogByGroup,
  fieldErrors,
  onSelectGroupItem,
  onSelectCatalogItem,
}: {
  equipment: DndEquipment;
  originId: string;
  originName: string;
  selectedGroups: SelectedGroupState;
  selectedCatalogByGroup: SelectedCatalogByGroup;
  fieldErrors: Record<string, string>;
  onSelectGroupItem: (selectionKey: string, optionIndex: number) => void;
  onSelectCatalogItem: (
    selectionKey: string,
    catalogItemId: number | null,
  ) => void;
}) {
  return (
    <details className={`${PANEL_CLASSES} overflow-hidden`} open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            Equipamiento inicial
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">de {originName}</h3>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-black/40 px-3 py-1 text-sm font-semibold text-amber-100">
          {equipment.fijos.length + equipment.gruposEleccion.length} bloques
        </span>
      </summary>

      <div className="border-t border-stone-300/10 px-5 py-5">
        {equipment.gruposEleccion.length > 0 ? (
          <div className="space-y-4">
            {equipment.gruposEleccion.map((group, groupIndex) =>
              (() => {
                const selectionKey = buildSelectionKey(originId, group.id);
                const groupError = fieldErrors[selectionKey];

                return (
                  <div
                    key={`${originId}-${group.id}`}
                    data-validation-error={groupError ? "true" : undefined}
                    className={`rounded-[18px] border bg-black/20 p-4 ${
                      groupError ? "border-rose-400/45" : "border-stone-300/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-amber-100">
                      {group.etiqueta}
                    </p>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-stone-200/90">
                      {group.opciones.map((item, optionIndex) => {
                        const isSelected =
                          selectedGroups[selectionKey] === optionIndex;
                        const catalogItems = item.opcionesCatalogo ?? [];
                        const catalogSelectionKeys =
                          buildEquipmentCatalogSelectionKeys(
                            selectionKey,
                            item,
                          );
                        const catalogSelections =
                          buildEquipmentCatalogSelections(selectionKey, item);
                        const selectedCatalogItems = catalogSelectionKeys
                          .map((catalogSelectionKey) => {
                            const selectedCatalogId =
                              selectedCatalogByGroup[catalogSelectionKey] ??
                              null;
                            return (
                              catalogItems.find(
                                (catalogItem) =>
                                  catalogItem.id === selectedCatalogId,
                              ) ?? null
                            );
                          })
                          .filter((catalogItem) => catalogItem !== null);

                        return (
                          <label
                            key={item.id}
                            className={`block rounded-[18px] border p-4 transition ${
                              isSelected
                                ? "border-amber-300/45 bg-amber-300/10"
                                : "border-stone-300/10 bg-stone-950/35 hover:border-amber-300/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name={selectionKey}
                                checked={isSelected}
                                onChange={() =>
                                  onSelectGroupItem(selectionKey, optionIndex)
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                  isSelected
                                    ? "border-amber-300 bg-amber-300 text-stone-950"
                                    : "border-stone-400/50 bg-stone-950 text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white">
                                  {formatEquipmentOption(item)}
                                </p>
                                {buildEquipmentMeta(item.objeto).map((meta) => (
                                  <p
                                    key={`${item.id}-${meta}`}
                                    className="mt-1 text-xs leading-5 text-stone-400"
                                  >
                                    {meta}
                                  </p>
                                ))}
                                {catalogItems.length > 0 && isSelected ? (
                                  <div className="mt-4 space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/75">
                                      {catalogSelectionKeys.length > 1
                                        ? "Escoge las opciones concretas"
                                        : "Escoge la opción concreta"}
                                    </p>
                                    {catalogSelections.map(
                                      ({
                                        key: catalogSelectionKey,
                                        index: catalogIndex,
                                      }) => {
                                        const selectedCatalogId =
                                          selectedCatalogByGroup[
                                            catalogSelectionKey
                                          ] ?? null;
                                        const catalogError =
                                          fieldErrors[
                                            `${catalogSelectionKey}:catalog`
                                          ];
                                        const selectedCatalogItem =
                                          catalogItems.find(
                                            (catalogItem) =>
                                              catalogItem.id ===
                                              selectedCatalogId,
                                          ) ?? null;

                                        return (
                                          <div
                                            key={catalogSelectionKey}
                                            className="space-y-2"
                                          >
                                            {catalogSelectionKeys.length > 1 ? (
                                              <p className="text-xs font-medium text-stone-300">
                                                Selección {catalogIndex + 1}
                                              </p>
                                            ) : null}
                                            <select
                                              value={selectedCatalogId ?? ""}
                                              onChange={(event) => {
                                                const value =
                                                  event.target.value;
                                                onSelectCatalogItem(
                                                  catalogSelectionKey,
                                                  value ? Number(value) : null,
                                                );
                                              }}
                                              data-validation-error={
                                                catalogError
                                                  ? "true"
                                                  : undefined
                                              }
                                              className={`h-11 w-full rounded-[16px] border bg-stone-950/80 px-4 text-sm text-white outline-none transition ${
                                                catalogError
                                                  ? "border-rose-400/70 focus:border-rose-300"
                                                  : "border-stone-300/15 focus:border-amber-300/45"
                                              }`}
                                            >
                                              <option
                                                value=""
                                                className="bg-stone-950 text-white"
                                              >
                                                Selecciona una opción
                                              </option>
                                              {catalogItems.map(
                                                (catalogItem) => (
                                                  <option
                                                    key={catalogItem.id}
                                                    value={catalogItem.id}
                                                    className="bg-stone-950 text-white"
                                                  >
                                                    {catalogItem.nombre}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                            {catalogError ? (
                                              <ValidationMessage
                                                message={catalogError}
                                                className="mt-0"
                                              />
                                            ) : null}
                                            {selectedCatalogItem ? (
                                              <div className="space-y-1 text-xs leading-5 text-stone-300">
                                                {buildEquipmentMeta(
                                                  selectedCatalogItem,
                                                ).map((meta) => (
                                                  <p
                                                    key={`${catalogSelectionKey}-${selectedCatalogItem.id}-${meta}`}
                                                  >
                                                    {meta}
                                                  </p>
                                                ))}
                                                {selectedCatalogItem.descripcion ? (
                                                  <p>
                                                    {selectedCatalogItem.descripcion.replace(
                                                      /\*\*/g,
                                                      "",
                                                    )}
                                                  </p>
                                                ) : null}
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      },
                                    )}
                                    {catalogSelectionKeys.length > 1 &&
                                    selectedCatalogItems.length ===
                                      catalogSelectionKeys.length ? (
                                      <p className="text-xs text-stone-400">
                                        Has seleccionado{" "}
                                        {selectedCatalogItems.length} armas.
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {groupError ? (
                      <ValidationMessage
                        message={groupError}
                        className="mt-3"
                      />
                    ) : null}
                    <p className="mt-3 text-xs text-stone-400">
                      Grupo {groupIndex + 1}
                    </p>
                  </div>
                );
              })(),
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function EquipmentSelectionSection({
  classEquipment,
  backgroundEquipment,
  classEquipmentName,
  backgroundEquipmentName,
  isLoadingClassEquipment,
  isLoadingBackgroundEquipment,
  classEquipmentError,
  backgroundEquipmentError,
  onCreateCharacter,
  onSelectionChange,
  fieldErrors = {},
  hasError = false,
  isCreating = false,
  isCreateDisabled = false,
}: EquipmentSelectionSectionProps) {
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroupState>({});
  const [selectedCatalogByGroup, setSelectedCatalogByGroup] =
    useState<SelectedCatalogByGroup>({});

  useEffect(() => {
    onSelectionChange?.({
      selectedGroups,
      selectedCatalogByGroup,
    });
  }, [onSelectionChange, selectedCatalogByGroup, selectedGroups]);

  const hasAnySelection =
    classEquipment !== null ||
    backgroundEquipment !== null ||
    isLoadingClassEquipment ||
    isLoadingBackgroundEquipment ||
    Boolean(classEquipmentError) ||
    Boolean(backgroundEquipmentError);

  const handleSelectGroupItem = (selectionKey: string, optionIndex: number) => {
    setSelectedGroups((current) => ({
      ...current,
      [selectionKey]: optionIndex,
    }));
    setSelectedCatalogByGroup((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) =>
            key !== selectionKey && !key.startsWith(`${selectionKey}:`),
        ),
      ),
    );
  };

  const handleSelectCatalogItem = (
    selectionKey: string,
    catalogItemId: number | null,
  ) => {
    setSelectedCatalogByGroup((current) => ({
      ...current,
      [selectionKey]: catalogItemId,
    }));
  };

  return (
    <section className="mt-10 space-y-5">
      <div
        className={`rounded-[28px] border bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6 transition ${
          hasError ? "border-rose-400/45" : "border-stone-300/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Equipamiento</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
              Aquí se reúne el equipamiento inicial que te aportan la clase y el
              trasfondo elegidos.
            </p>
          </div>
          {onCreateCharacter ? (
            <button
              type="button"
              onClick={onCreateCharacter}
              disabled={isCreateDisabled}
              className="inline-flex items-center justify-center rounded-full border border-amber-300/35 bg-[linear-gradient(90deg,rgba(28,25,23,0.92),rgba(245,158,11,0.12))] px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-[linear-gradient(90deg,rgba(41,37,36,0.96),rgba(245,158,11,0.18))]"
            >
              {isCreating ? "Creando personaje..." : "Crear personaje"}
            </button>
          ) : null}
        </div>
      </div>

      {isLoadingClassEquipment ? (
        <div className={`${PANEL_CLASSES} p-5 text-sm text-stone-200`}>
          Cargando equipamiento de clase...
        </div>
      ) : null}

      {!isLoadingClassEquipment && classEquipmentError ? (
        <div
          className={`${PANEL_CLASSES} border-amber-300/20 bg-amber-950/20 p-5 text-sm text-amber-100`}
        >
          {classEquipmentError}
        </div>
      ) : null}

      {!isLoadingClassEquipment && !classEquipmentError && classEquipment ? (
        <EquipmentOriginCard
          equipment={classEquipment}
          originId="class"
          originName={classEquipmentName}
          selectedGroups={selectedGroups}
          selectedCatalogByGroup={selectedCatalogByGroup}
          fieldErrors={fieldErrors}
          onSelectGroupItem={handleSelectGroupItem}
          onSelectCatalogItem={handleSelectCatalogItem}
        />
      ) : null}

      {isLoadingBackgroundEquipment ? (
        <div className={`${PANEL_CLASSES} p-5 text-sm text-stone-200`}>
          Cargando equipamiento de trasfondo...
        </div>
      ) : null}

      {!isLoadingBackgroundEquipment && backgroundEquipmentError ? (
        <div
          className={`${PANEL_CLASSES} border-amber-300/20 bg-amber-950/20 p-5 text-sm text-amber-100`}
        >
          {backgroundEquipmentError}
        </div>
      ) : null}

      {!isLoadingBackgroundEquipment &&
      !backgroundEquipmentError &&
      backgroundEquipment ? (
        <EquipmentOriginCard
          equipment={backgroundEquipment}
          originId="background"
          originName={backgroundEquipmentName}
          selectedGroups={selectedGroups}
          selectedCatalogByGroup={selectedCatalogByGroup}
          fieldErrors={fieldErrors}
          onSelectGroupItem={handleSelectGroupItem}
          onSelectCatalogItem={handleSelectCatalogItem}
        />
      ) : null}

      {!hasAnySelection ? (
        <div
          className={`${PANEL_CLASSES} border-dashed p-6 text-center text-sm text-stone-300`}
        >
          Selecciona primero una clase o un trasfondo para ver aquí el
          equipamiento inicial.
        </div>
      ) : null}
    </section>
  );
}
