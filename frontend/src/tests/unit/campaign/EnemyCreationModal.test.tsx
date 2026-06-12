// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import EnemyCreationModal from "../../../screens/campaign/components/EnemyCreationModal";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock subcomponents to simplify rendering
vi.mock("../../../screens/campaign/components/enemy/EnemyStatsSection", () => ({
  default: () => <div data-testid="enemy-stats-section">EnemyStatsSection</div>,
}));

vi.mock("../../../screens/campaign/components/enemy/WeaponSection", () => ({
  default: () => <div data-testid="weapon-section">WeaponSection</div>,
}));

vi.mock(
  "../../../screens/campaign/components/enemy/SkillsAndSavesSection",
  () => ({
    default: () => (
      <div data-testid="skills-saves-section">SkillsAndSavesSection</div>
    ),
  }),
);

vi.mock("../../../screens/campaign/components/enemy/ActionsSection", () => ({
  default: () => <div data-testid="actions-section">ActionsSection</div>,
}));

// Mock useEnemyForm with controllable state
const mockForm = {
  fileInputRef: { current: null },
  nombre: "",
  setNombre: vi.fn(),
  tipo: "enemigo" as "enemigo" | "PNJ",
  setTipo: vi.fn(),
  vd: "",
  setVd: vi.fn(),
  portrait: null as File | null,
  portraitPreview: null as string | null,
  biografia: "",
  setBiografia: vi.fn(),
  idiomas: "",
  setIdiomas: vi.fn(),
  abilityScores: {
    Fuerza: 10,
    Destreza: 10,
    Constitucion: 10,
    Inteligencia: 10,
    Sabiduria: 10,
    Carisma: 10,
  },
  abilityScoreInputs: {
    Fuerza: "10",
    Destreza: "10",
    Constitucion: "10",
    Inteligencia: "10",
    Sabiduria: "10",
    Carisma: "10",
  },
  handleScoreInputChange: vi.fn(),
  handleScoreBlur: vi.fn(),
  ca: 10,
  setCa: vi.fn(),
  pvMax: 10,
  setPvMax: vi.fn(),
  movimiento: 30,
  setMovimiento: vi.fn(),
  iniciativa: "" as number | "",
  setIniciativa: vi.fn(),
  skillOverrides: [],
  usedSkills: [],
  availableSkills: [],
  addSkill: vi.fn(),
  updateSkill: vi.fn(),
  removeSkill: vi.fn(),
  saveOverrides: [],
  usedSaves: [],
  availableSaves: [],
  addSave: vi.fn(),
  updateSave: vi.fn(),
  removeSave: vi.fn(),
  pasivas: [],
  addPasiva: vi.fn(),
  updatePasiva: vi.fn(),
  removePasiva: vi.fn(),
  acciones: [],
  addAccion: vi.fn(),
  updateAccion: vi.fn(),
  removeAccion: vi.fn(),
  weapons: [],
  setWeapons: vi.fn(),
  isSubmitting: false,
  error: null as string | null,
  fieldErrors: {} as { nombre?: string },
  setFieldErrors: vi.fn(),
  handlePortraitChange: vi.fn(),
  clearPortrait: vi.fn(),
  handleClose: vi.fn(),
  handleSubmit: vi.fn(),
};

vi.mock("../../../screens/campaign/hooks/useEnemyForm", () => ({
  useEnemyForm: vi.fn(() => mockForm),
}));

// ─── Default props ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  isOpen: true,
  sistemaDeJuego: "Dungeons and Dragons",
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockForm.nombre = "";
  mockForm.tipo = "enemigo";
  mockForm.vd = "";
  mockForm.portrait = null;
  mockForm.portraitPreview = null;
  mockForm.isSubmitting = false;
  mockForm.error = null;
  mockForm.fieldErrors = {};
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EnemyCreationModal", () => {
  // ── isOpen ─────────────────────────────────────────────────────────────────

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <EnemyCreationModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole("heading", { name: "Crear PNJ" }),
    ).toBeInTheDocument();
  });

  // ── Header ─────────────────────────────────────────────────────────────────

  it("renders 'Crear PNJ' heading", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole("heading", { name: "Crear PNJ" }),
    ).toBeInTheDocument();
  });

  it("renders close (X) button", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    // The X button renders an SVG, find by its container button
    const closeBtn = document.querySelector("button.rounded-lg.p-1\\.5");
    expect(closeBtn).toBeTruthy();
  });

  it("calls handleClose when X button is clicked", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const closeBtn = document.querySelector(
      "button.rounded-lg.p-1\\.5",
    ) as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(mockForm.handleClose).toHaveBeenCalled();
  });

  it("calls handleClose when backdrop is clicked", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const backdrop = document.querySelector(".absolute.inset-0") as HTMLElement;
    fireEvent.click(backdrop);
    expect(mockForm.handleClose).toHaveBeenCalled();
  });

  // ── Name field ─────────────────────────────────────────────────────────────

  it("renders nombre input with placeholder", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByPlaceholderText("Nombre del NPC")).toBeInTheDocument();
  });

  it("calls setNombre when nombre input changes", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const input = screen.getByPlaceholderText("Nombre del NPC");
    fireEvent.change(input, { target: { value: "Goblin" } });
    expect(mockForm.setNombre).toHaveBeenCalledWith("Goblin");
  });

  it("shows nombre field error when fieldErrors.nombre is set", () => {
    mockForm.fieldErrors = { nombre: "El nombre es obligatorio" };
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  // ── Tipo selector ──────────────────────────────────────────────────────────

  it("renders 'Enemigo' and 'PNJ' type buttons", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Enemigo")).toBeInTheDocument();
    expect(screen.getByText("PNJ")).toBeInTheDocument();
  });

  it("calls setTipo when 'PNJ' button is clicked", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("PNJ"));
    expect(mockForm.setTipo).toHaveBeenCalledWith("PNJ");
  });

  it("calls setTipo when 'Enemigo' button is clicked", () => {
    mockForm.tipo = "PNJ";
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Enemigo"));
    expect(mockForm.setTipo).toHaveBeenCalledWith("enemigo");
  });

  // ── VD field ───────────────────────────────────────────────────────────────

  it("renders VD input with placeholder", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByPlaceholderText("ej. 1/4, 5, 20")).toBeInTheDocument();
  });

  it("calls setVd when VD input changes", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const vdInput = screen.getByPlaceholderText("ej. 1/4, 5, 20");
    fireEvent.change(vdInput, { target: { value: "1/4" } });
    expect(mockForm.setVd).toHaveBeenCalledWith("1/4");
  });

  // ── Portrait upload ────────────────────────────────────────────────────────

  it("renders 'Subir imagen' text when no portrait preview", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Subir imagen")).toBeInTheDocument();
  });

  it("renders portrait image when portraitPreview is set", () => {
    mockForm.portraitPreview = "blob:fake-url";
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const img = screen.getByAltText("Vista previa");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("blob:fake-url");
  });

  it("shows 'Eliminar' button when portrait is set", () => {
    mockForm.portrait = new File([""], "portrait.png", { type: "image/png" });
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("calls clearPortrait when 'Eliminar' is clicked", () => {
    mockForm.portrait = new File([""], "portrait.png", { type: "image/png" });
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(mockForm.clearPortrait).toHaveBeenCalled();
  });

  // ── Subcomponents ──────────────────────────────────────────────────────────

  it("renders EnemyStatsSection", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("enemy-stats-section")).toBeInTheDocument();
  });

  it("renders WeaponSection", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("weapon-section")).toBeInTheDocument();
  });

  it("renders SkillsAndSavesSection", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("skills-saves-section")).toBeInTheDocument();
  });

  it("renders ActionsSection", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("actions-section")).toBeInTheDocument();
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  it("renders 'Crear PNJ' submit button in footer", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    // There's the heading "Crear PNJ" and a submit button "Crear PNJ"
    const buttons = screen.getAllByText("Crear PNJ");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Creando...' when isSubmitting is true", () => {
    mockForm.isSubmitting = true;
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Creando...")).toBeInTheDocument();
  });

  it("calls handleSubmit when submit button is clicked", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    // The submit button has class bg-amber-600 — find by label (not heading)
    // Both heading and submit button say "Crear PNJ", use getAllByText
    const btns = screen.getAllByText("Crear PNJ");
    // The submit button is the one that is a <button> element
    const submitBtn = btns.find(
      (el) => el.tagName === "BUTTON",
    ) as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
    fireEvent.click(submitBtn);
    expect(mockForm.handleSubmit).toHaveBeenCalled();
  });

  it("shows error message when error is set", () => {
    mockForm.error = "Error al crear el NPC";
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(screen.getByText("Error al crear el NPC")).toBeInTheDocument();
  });

  // ── Biography and Idiomas ──────────────────────────────────────────────────

  it("renders Biografía textarea", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    expect(
      screen.getByPlaceholderText("Historia, apariencia, motivaciones..."),
    ).toBeInTheDocument();
  });

  it("calls setBiografia when biography changes", () => {
    render(<EnemyCreationModal {...DEFAULT_PROPS} />);
    const textarea = screen.getByPlaceholderText(
      "Historia, apariencia, motivaciones...",
    );
    fireEvent.change(textarea, { target: { value: "Un goblin traicionero" } });
    expect(mockForm.setBiografia).toHaveBeenCalledWith("Un goblin traicionero");
  });
});
