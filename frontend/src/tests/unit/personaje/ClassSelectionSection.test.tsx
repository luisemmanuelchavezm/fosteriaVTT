// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClassSelectionSection from "../../../screens/personaje/creatednd/sections/ClassSelectionSection";

const spellUtilsMocks = vi.hoisted(() => ({
  extractSpellReferenceItems: vi.fn(),
  hasSpellLikeTags: vi.fn(),
  isSpellChoiceCatalog: vi.fn(),
}));

vi.mock(
  "../../../components/spells/spellReferenceUtils",
  () => spellUtilsMocks,
);

vi.mock(
  "../../../screens/personaje/creatednd/components/ChoiceChecklist",
  () => ({
    default: ({
      title,
      error,
      onChange,
      onInfoClick,
      showInfoAction,
    }: {
      title: string;
      error?: string;
      onChange: (values: string[]) => void;
      onInfoClick?: (value: string) => void;
      showInfoAction?: boolean;
    }) => (
      <div>
        <span>{title}</span>
        {error ? <span>{error}</span> : null}
        <button onClick={() => onChange(["Arcano"])}>change-{title}</button>
        {showInfoAction ? (
          <button onClick={() => onInfoClick?.("misil magico")}>
            info-{title}
          </button>
        ) : null}
      </div>
    ),
  }),
);

vi.mock(
  "../../../screens/personaje/creatednd/components/ProgressionTablesBlock",
  () => ({
    default: ({ title }: { title: string }) => <div>{title}</div>,
  }),
);

vi.mock("../../../screens/personaje/creatednd/utils/textUtils", () => ({
  readableContentStyle: {},
  renderSkillDescription: (description: string) => <span>{description}</span>,
}));

const filteredClasses = [
  { id: "wizard", nombre: "Mago", insignia: "M" },
  { id: "rogue", nombre: "Pícaro", insignia: "P" },
] as never;

function renderSection(
  overrides: Partial<React.ComponentProps<typeof ClassSelectionSection>> = {},
) {
  const onClassSearchChange = vi.fn();
  const onClassClick = vi.fn();
  const onClearSelection = vi.fn();
  const onSubclassChange = vi.fn();
  const onClassSkillChoiceChange = vi.fn();
  const onSpellReferenceClick = vi.fn();

  render(
    <ClassSelectionSection
      filteredClasses={filteredClasses}
      selectedClassId={null}
      classSearch=""
      isLoadingClasses={false}
      classesError={null}
      onClassSearchChange={onClassSearchChange}
      onClassClick={onClassClick}
      onClearSelection={onClearSelection}
      onSubclassChange={onSubclassChange}
      onClassSkillChoiceChange={onClassSkillChoiceChange}
      onSpellReferenceClick={onSpellReferenceClick}
      {...overrides}
    />,
  );

  return {
    onClassSearchChange,
    onClassClick,
    onClearSelection,
    onSubclassChange,
    onClassSkillChoiceChange,
    onSpellReferenceClick,
  };
}

describe("creacion de personaje - ClassSelectionSection", () => {
  beforeEach(() => {
    spellUtilsMocks.extractSpellReferenceItems.mockReset();
    spellUtilsMocks.hasSpellLikeTags.mockReset();
    spellUtilsMocks.isSpellChoiceCatalog.mockReset();
    spellUtilsMocks.extractSpellReferenceItems.mockReturnValue([]);
    spellUtilsMocks.hasSpellLikeTags.mockReturnValue(false);
    spellUtilsMocks.isSpellChoiceCatalog.mockReturnValue(false);
  });

  it("muestra la búsqueda, estados de carga/error y delega cambios de clase", () => {
    const { onClassSearchChange, onClassClick } = renderSection({
      isLoadingClasses: false,
      classesError: "Sin clases",
      selectionError: "Campo obligatorio",
      hasError: true,
    });

    fireEvent.change(screen.getByPlaceholderText("Buscar por nombre"), {
      target: { value: "mag" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Mago/i }));

    expect(onClassSearchChange).toHaveBeenCalledWith("mag");
    expect(onClassClick).toHaveBeenCalledWith(filteredClasses[0]);
    expect(screen.getByText("Sin clases")).toBeInTheDocument();
    expect(screen.getByText("Campo obligatorio")).toBeInTheDocument();
  });

  it("renderiza la clase elegida, las subclases y las referencias de conjuros", () => {
    spellUtilsMocks.hasSpellLikeTags.mockReturnValue(true);
    spellUtilsMocks.extractSpellReferenceItems.mockReturnValue([
      {
        lookupName: "misil magico",
        displayText: "Misil mágico",
        prefix: "Truco",
      },
    ]);

    const { onClearSelection, onSubclassChange, onSpellReferenceClick } =
      renderSection({
        selectedClassId: "wizard",
        selectedClassName: "Mago",
        subclasses: [
          {
            id: "evocation",
            nombre: "Evocación",
            descripcion: "Explosiones arcanas.",
            tablas: [],
          },
        ] as never,
        selectedSubclassId: "evocation",
        selectedSubclassName: "Evocación",
        selectedSubclass: {
          id: "evocation",
          nombre: "Evocación",
          descripcion: "Explosiones arcanas.",
          tablas: [],
        } as never,
        subclassSkills: [
          {
            nivel: 1,
            habilidades: [
              {
                id: "spell-feature",
                nombre: "Truco extra",
                descripcion: "Aprendes un conjuro.",
                formula: "misil magico",
                tags: ["spell"],
              },
            ],
          },
        ] as never,
      });

    expect(screen.getByText(/Clase elegida:/)).toBeInTheDocument();
    expect(screen.getByText("Rasgos de Evocación")).toBeInTheDocument();
    expect(screen.getByText("Progresión de subclase")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar elección" }));
    fireEvent.click(screen.getByRole("button", { name: /Evocación/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Truco: Misil mágico/i }),
    );

    expect(onClearSelection).toHaveBeenCalledTimes(1);
    expect(onSubclassChange).toHaveBeenCalledWith("evocation");
    expect(onSpellReferenceClick).toHaveBeenCalledWith("misil magico");
  });

  it("muestra los estados de rasgos de subclase y las elecciones de clase", () => {
    spellUtilsMocks.isSpellChoiceCatalog.mockReturnValue(true);

    const { onClassSkillChoiceChange, onSpellReferenceClick } = renderSection({
      selectedClassId: "wizard",
      selectedClassName: "Mago",
      subclasses: [
        { id: "evocation", nombre: "Evocación", descripcion: "Explosiones." },
      ] as never,
      selectedSubclassId: "evocation",
      selectedSubclassName: "Evocación",
      isLoadingSubclassSkills: false,
      subclassSkillsError: null,
      subclassSkills: [] as never,
      classSkillChoices: [
        {
          id: "skills",
          etiqueta: "Competencias iniciales",
          resumen: "Elige una habilidad",
          opciones: ["Arcano", "Historia"],
          cantidad: 1,
          catalogo: "trucosdemago",
        },
      ] as never,
      classSkillErrors: {
        subclass: "Debes seleccionar una subclase",
        skills: "Debes completar esta elección",
      },
    });

    expect(
      screen.getByText(/Esta subclase no tiene rasgos de nivel 1 persistidos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Debes seleccionar una subclase"),
    ).toBeInTheDocument();
    expect(screen.getByText("Competencias iniciales")).toBeInTheDocument();
    expect(
      screen.getByText("Debes completar esta elección"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "change-Competencias iniciales" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "info-Competencias iniciales" }),
    );

    expect(onClassSkillChoiceChange).toHaveBeenCalledWith("skills", ["Arcano"]);
    expect(onSpellReferenceClick).toHaveBeenCalledWith("misil magico");
  });

  it("renderiza la seccion de pericia inicial", () => {
    renderSection({
      selectedClassId: "rogue",
      selectedClassName: "Pícaro",
      expertiseChoiceConfig: {
        title: "Pericia",
        description: "Elige dos competencias para ganar pericia.",
        allowThievesTools: true,
        count: 2,
      },
      expertiseOptions: ["Acrobacias", "Sigilo", "Herramientas de ladron"],
      selectedExpertiseChoices: ["", ""],
      onClassExpertiseChange: vi.fn(),
    });

    expect(
      screen.getByText("Elige tus pericias iniciales"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pericia 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Pericia 2")).toBeInTheDocument();
  });
});
