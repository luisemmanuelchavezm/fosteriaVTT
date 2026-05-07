import type { DndCharacterDetailResponse } from "../../utils/dndApi";

export interface FeatOption {
  id: string;
  nombre: string;
  descripcion: string;
  descripcionCompleta?: string;
  formula?: string | null;
  requisitos: string[];
  repeatable?: boolean;
  fixedBonuses?: Record<string, number>;
  selectableBonus?: {
    count: number;
    amount: number;
    options: string[];
  };
  selectableCompetencies?: {
    count: number;
    options: string[];
  };
  selectableSkills?: {
    count: number;
    options: string[];
  };
  selectableLanguages?: {
    count: number;
    options: string[];
  };
  spellSelection?: {
    chooseClass?: boolean;
    classOptions?: string[];
    cantrips: number;
    spells: number;
    spellLevel?: number;
    cantripClassOptions?: string[];
  };
  validate: (
    character: DndCharacterDetailResponse,
    classCompetencies: string[],
  ) => boolean;
}
