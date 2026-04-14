import { useState } from "react";
import {
  buildEquipmentMeta,
  formatEquipmentOption,
} from "../utils/equipmentUtils";
import type { DndEquipment } from "../types";

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
  onSelectGroupItem,
  onSelectCatalogItem,
}: {
  equipment: DndEquipment;
  originId: string;
  originName: string;
  selectedGroups: SelectedGroupState;
  selectedCatalogByGroup: SelectedCatalogByGroup;
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
        {equipment.fijos.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-white">Recibes</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-200/90">
              {equipment.fijos.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>
                    <span className="block">{formatEquipmentOption(item)}</span>
                    {buildEquipmentMeta(item.objeto).map((meta) => (
                      <span
                        key={`${item.id}-${meta}`}
                        className="block text-xs text-stone-400"
                      >
                        {meta}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {equipment.gruposEleccion.length > 0 ? (
          <div className="mt-5 space-y-4">
            {equipment.gruposEleccion.map((group, groupIndex) => (
              <div
                key={`${originId}-${group.id}`}
                className="rounded-[18px] border border-stone-300/10 bg-black/20 p-4"
              >
                <p className="text-sm font-semibold text-amber-100">
                  {group.etiqueta}
                </p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-stone-200/90">
                  {group.opciones.map((item, optionIndex) => {
                    const selectionKey = buildSelectionKey(originId, group.id);
                    const isSelected =
                      selectedGroups[selectionKey] === optionIndex;
                    const catalogItems = item.opcionesCatalogo ?? [];
                    const selectedCatalogId =
                      selectedCatalogByGroup[selectionKey] ?? null;
                    const selectedCatalogItem =
                      catalogItems.find(
                        (catalogItem) => catalogItem.id === selectedCatalogId,
                      ) ?? null;

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
                                  Escoge la opcion concreta
                                </p>
                                <select
                                  value={selectedCatalogId ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    onSelectCatalogItem(
                                      selectionKey,
                                      value ? Number(value) : null,
                                    );
                                  }}
                                  className="h-11 w-full rounded-[16px] border border-stone-300/15 bg-stone-950/80 px-4 text-sm text-white outline-none transition focus:border-amber-300/45"
                                >
                                  <option
                                    value=""
                                    className="bg-stone-950 text-white"
                                  >
                                    Selecciona una opcion
                                  </option>
                                  {catalogItems.map((catalogItem) => (
                                    <option
                                      key={catalogItem.id}
                                      value={catalogItem.id}
                                      className="bg-stone-950 text-white"
                                    >
                                      {catalogItem.nombre}
                                    </option>
                                  ))}
                                </select>
                                {selectedCatalogItem ? (
                                  <div className="space-y-1 text-xs leading-5 text-stone-300">
                                    {buildEquipmentMeta(
                                      selectedCatalogItem,
                                    ).map((meta) => (
                                      <p
                                        key={`${selectedCatalogItem.id}-${meta}`}
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
                            ) : null}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-stone-400">
                  Grupo {groupIndex + 1}
                </p>
              </div>
            ))}
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
}: EquipmentSelectionSectionProps) {
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroupState>({});
  const [selectedCatalogByGroup, setSelectedCatalogByGroup] =
    useState<SelectedCatalogByGroup>({});

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
    setSelectedCatalogByGroup((current) => ({
      ...current,
      [selectionKey]: null,
    }));
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
      <div className="rounded-[28px] border border-stone-300/10 bg-[linear-gradient(180deg,rgba(12,10,9,0.72),rgba(41,37,36,0.18))] p-6">
        <h2 className="text-2xl font-bold text-white">Equipamiento</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
          Aqui se reune el equipamiento inicial que te aportan la clase y el
          trasfondo elegidos.
        </p>
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
          onSelectGroupItem={handleSelectGroupItem}
          onSelectCatalogItem={handleSelectCatalogItem}
        />
      ) : null}

      {!hasAnySelection ? (
        <div
          className={`${PANEL_CLASSES} border-dashed p-6 text-center text-sm text-stone-300`}
        >
          Selecciona primero una clase o un trasfondo para ver aqui el
          equipamiento inicial.
        </div>
      ) : null}
    </section>
  );
}
