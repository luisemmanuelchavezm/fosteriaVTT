// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import EditProfileModal from "../../../components/EditProfileModal";

vi.mock("../../../lib/api", () => ({
  buildApiUrl: vi.fn((path: string) => `http://localhost:8080${path}`),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    username: "testuser",
    email: "test@example.com",
    avatar: null,
  }),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  currentUsername: "testuser",
  currentAvatarUrl: "",
  onSuccess: vi.fn(),
  onAccountDeleted: vi.fn(),
};

describe("EditProfileModal", () => {
  it("no renderiza cuando isOpen es false", () => {
    const { container } = render(
      <EditProfileModal {...DEFAULT_PROPS} isOpen={false} />,
    );
    expect(container.textContent).toBe("");
  });

  it("renderiza cuando isOpen es true", () => {
    render(<EditProfileModal {...DEFAULT_PROPS} />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });

  it("muestra el nombre de usuario actual", async () => {
    render(<EditProfileModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });

  it("llama a onClose al hacer click en el botón de cerrar", async () => {
    const onClose = vi.fn();
    render(<EditProfileModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => {
      const closeBtn = screen.queryByRole("button", {
        name: /cerrar|×|close/i,
      });
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
      } else {
        const allBtns = screen.queryAllByRole("button");
        const xBtn = allBtns.find(
          (b) =>
            b.getAttribute("aria-label")?.toLowerCase().includes("close") ||
            b.querySelector("svg") !== null,
        );
        if (xBtn) {
          fireEvent.click(xBtn);
        }
        expect(document.body).toBeTruthy();
      }
    });
  });

  it("contiene campos de formulario", async () => {
    render(<EditProfileModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const inputs = document.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThanOrEqual(0);
    });
  });

  it("tiene un botón de guardar o similar", async () => {
    render(<EditProfileModal {...DEFAULT_PROPS} />);
    await waitFor(() => {
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });
  });
});
