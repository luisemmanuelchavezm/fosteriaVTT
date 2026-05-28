// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import NpcRasgosTab from "../../../screens/personaje/dndcharactersheet/components/npc/NpcRasgosTab";
import type { CharacterAbilityResponse } from "../../../screens/personaje/utils/dndApi";
import type { WeaponModalState } from "../../../screens/personaje/dndcharactersheet/hooks/useNpcEdit";

const NOOP = vi.fn();

const BASE_PROPS = {
  isEditMode: false,
  pasivas: [] as CharacterAbilityResponse[],
  acciones: [] as CharacterAbilityResponse[],
  armas: [] as CharacterAbilityResponse[],
  onDeleteHabilidad: NOOP,
  showAddForm: false,
  onShowAddFormChange: NOOP,
  newHabilidadNombre: "",
  onNewHabilidadNombreChange: NOOP,
  newHabilidadDesc: "",
  onNewHabilidadDescChange: NOOP,
  newHabilidadTipo: "PASIVA" as const,
  onNewHabilidadTipoChange: NOOP,
  isAddingHabilidad: false,
  onAddHabilidad: NOOP,
  weaponModal: null as WeaponModalState,
  onWeaponModalChange: NOOP,
  isWeaponSaving: false,
  onWeaponConfirm: NOOP,
};

const PASIVA: CharacterAbilityResponse = {
  id: 1,
  nombre: "Visión en la oscuridad",
  bonificacion: null,
  formula: null,
  descripcion: "Puede ver en la oscuridad hasta 18 m.",
  tags: null,
};

const ACCION: CharacterAbilityResponse = {
  id: 2,
  nombre: "Golpe de maza",
  bonificacion: 5,
  formula: "1d6+3",
  descripcion: "Ataque cuerpo a cuerpo.",
  tags: null,
};

const ARMA: CharacterAbilityResponse = {
  id: 3,
  nombre: "Espada corta",
  bonificacion: 4,
  formula: "1d6+2",
  descripcion: "Arma ligera.",
  tags: null,
};

describe("NpcRasgosTab", () => {
  // ── Empty state ───────────────────────────────────────────────────────────

  it("shows 'Sin rasgos' when everything is empty in view mode", () => {
    render(<NpcRasgosTab {...BASE_PROPS} />);
    expect(screen.getByText("Sin rasgos")).toBeInTheDocument();
  });

  it("does not show 'Sin rasgos' in edit mode", () => {
    render(<NpcRasgosTab {...BASE_PROPS} isEditMode />);
    expect(screen.queryByText("Sin rasgos")).not.toBeInTheDocument();
  });

  // ── Pasivas ───────────────────────────────────────────────────────────────

  it("renders pasiva list", () => {
    render(<NpcRasgosTab {...BASE_PROPS} pasivas={[PASIVA]} />);
    expect(screen.getByText("Pasivas")).toBeInTheDocument();
    expect(screen.getByText("Visión en la oscuridad")).toBeInTheDocument();
    expect(
      screen.getByText("Puede ver en la oscuridad hasta 18 m."),
    ).toBeInTheDocument();
  });

  it("does not show pasivas section when list is empty", () => {
    render(<NpcRasgosTab {...BASE_PROPS} />);
    expect(screen.queryByText("Pasivas")).not.toBeInTheDocument();
  });

  it("shows delete button for pasivas in edit mode", () => {
    const onDeleteHabilidad = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        pasivas={[PASIVA]}
        onDeleteHabilidad={onDeleteHabilidad}
      />,
    );
    fireEvent.click(screen.getByTitle("Eliminar rasgo"));
    expect(onDeleteHabilidad).toHaveBeenCalledWith(1);
  });

  // ── Acciones ──────────────────────────────────────────────────────────────

  it("renders acciones list", () => {
    render(<NpcRasgosTab {...BASE_PROPS} acciones={[ACCION]} />);
    expect(screen.getByText("Acciones")).toBeInTheDocument();
    expect(screen.getByText("Golpe de maza")).toBeInTheDocument();
  });

  it("shows delete button for acciones in edit mode", () => {
    const onDeleteHabilidad = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        acciones={[ACCION]}
        onDeleteHabilidad={onDeleteHabilidad}
      />,
    );
    fireEvent.click(screen.getByTitle("Eliminar acción"));
    expect(onDeleteHabilidad).toHaveBeenCalledWith(2);
  });

  // ── Armas ─────────────────────────────────────────────────────────────────

  it("renders armas list in view mode", () => {
    render(<NpcRasgosTab {...BASE_PROPS} armas={[ARMA]} />);
    expect(screen.getByText("Armas")).toBeInTheDocument();
    expect(screen.getByText("Espada corta")).toBeInTheDocument();
  });

  it("shows '+ Agregar arma' button in edit mode", () => {
    render(<NpcRasgosTab {...BASE_PROPS} isEditMode />);
    expect(screen.getByText("+ Agregar arma")).toBeInTheDocument();
  });

  it("calls onWeaponModalChange with add mode when '+ Agregar arma' is clicked", () => {
    const onWeaponModalChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        onWeaponModalChange={onWeaponModalChange}
      />,
    );
    fireEvent.click(screen.getByText("+ Agregar arma"));
    expect(onWeaponModalChange).toHaveBeenCalledWith({ mode: "add" });
  });

  it("shows edit/delete buttons for armas in edit mode", () => {
    const onDeleteHabilidad = vi.fn();
    const onWeaponModalChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        armas={[ARMA]}
        onDeleteHabilidad={onDeleteHabilidad}
        onWeaponModalChange={onWeaponModalChange}
      />,
    );
    expect(screen.getByTitle("Editar arma")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Eliminar arma"));
    expect(onDeleteHabilidad).toHaveBeenCalledWith(3);
  });

  it("calls onWeaponModalChange with edit data when edit weapon button is clicked", () => {
    const onWeaponModalChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        armas={[ARMA]}
        onWeaponModalChange={onWeaponModalChange}
      />,
    );
    fireEvent.click(screen.getByTitle("Editar arma"));
    expect(onWeaponModalChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "edit", id: 3, nombre: "Espada corta" }),
    );
  });

  // ── Add rasgo form ────────────────────────────────────────────────────────

  it("shows '+ Agregar rasgo / acción' button in edit mode when showAddForm is false", () => {
    render(<NpcRasgosTab {...BASE_PROPS} isEditMode />);
    expect(screen.getByText("+ Agregar rasgo / acción")).toBeInTheDocument();
  });

  it("calls onShowAddFormChange(true) when add button is clicked", () => {
    const onShowAddFormChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        onShowAddFormChange={onShowAddFormChange}
      />,
    );
    fireEvent.click(screen.getByText("+ Agregar rasgo / acción"));
    expect(onShowAddFormChange).toHaveBeenCalledWith(true);
  });

  it("shows add form when showAddForm is true", () => {
    render(<NpcRasgosTab {...BASE_PROPS} isEditMode showAddForm />);
    expect(screen.getByText("Nuevo rasgo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Pasiva")).toBeInTheDocument();
    expect(screen.getByText("Acción")).toBeInTheDocument();
    expect(screen.getByText("Agregar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("calls onNewHabilidadNombreChange when nombre input changes", () => {
    const onNewHabilidadNombreChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        onNewHabilidadNombreChange={onNewHabilidadNombreChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Nombre"), {
      target: { value: "Resistencia" },
    });
    expect(onNewHabilidadNombreChange).toHaveBeenCalledWith("Resistencia");
  });

  it("calls onNewHabilidadDescChange when description textarea changes", () => {
    const onNewHabilidadDescChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        onNewHabilidadDescChange={onNewHabilidadDescChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Descripción (opcional)"), {
      target: { value: "Resistencia al fuego" },
    });
    expect(onNewHabilidadDescChange).toHaveBeenCalledWith(
      "Resistencia al fuego",
    );
  });

  it("calls onNewHabilidadTipoChange when tipo button is clicked", () => {
    const onNewHabilidadTipoChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        onNewHabilidadTipoChange={onNewHabilidadTipoChange}
      />,
    );
    fireEvent.click(screen.getByText("Acción"));
    expect(onNewHabilidadTipoChange).toHaveBeenCalledWith("ACCION");
  });

  it("calls onAddHabilidad when Agregar button is clicked", () => {
    const onAddHabilidad = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        newHabilidadNombre="Resistencia"
        onAddHabilidad={onAddHabilidad}
      />,
    );
    fireEvent.click(screen.getByText("Agregar"));
    expect(onAddHabilidad).toHaveBeenCalled();
  });

  it("shows 'Agregando…' when isAddingHabilidad is true", () => {
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        newHabilidadNombre="Test"
        isAddingHabilidad
      />,
    );
    expect(screen.getByText("Agregando…")).toBeInTheDocument();
  });

  it("calls onShowAddFormChange(false) when Cancelar is clicked", () => {
    const onShowAddFormChange = vi.fn();
    render(
      <NpcRasgosTab
        {...BASE_PROPS}
        isEditMode
        showAddForm
        onShowAddFormChange={onShowAddFormChange}
      />,
    );
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onShowAddFormChange).toHaveBeenCalledWith(false);
  });

  // ── renderNpcText with bullets ────────────────────────────────────────────

  it("renders bullet points in descripcion as list items", () => {
    const pasivaWithBullets: CharacterAbilityResponse = {
      id: 10,
      nombre: "Inmunidades",
      bonificacion: null,
      formula: null,
      descripcion: "El criatura es inmune a:\n* Veneno\n* Encantamiento",
      tags: null,
    };
    render(<NpcRasgosTab {...BASE_PROPS} pasivas={[pasivaWithBullets]} />);
    expect(screen.getByText("Veneno")).toBeInTheDocument();
    expect(screen.getByText("Encantamiento")).toBeInTheDocument();
  });
});
