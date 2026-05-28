// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import {
  SidebarBtn,
  SidebarDivider,
} from "../../../screens/campaign/components/SidebarBtn";

describe("SidebarBtn", () => {
  it("renders children", () => {
    render(<SidebarBtn title="Mapa">🗺️</SidebarBtn>);
    expect(screen.getByText("🗺️")).toBeInTheDocument();
  });

  it("has title attribute", () => {
    render(<SidebarBtn title="Jugadores">J</SidebarBtn>);
    expect(screen.getByTitle("Jugadores")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <SidebarBtn title="Dados" onClick={onClick}>
        🎲
      </SidebarBtn>,
    );
    fireEvent.click(screen.getByText("🎲"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not throw when onClick is not provided", () => {
    render(<SidebarBtn title="Dados">🎲</SidebarBtn>);
    expect(() => fireEvent.click(screen.getByText("🎲"))).not.toThrow();
  });

  it("applies active styles when isActive is true", () => {
    render(
      <SidebarBtn title="Test" isActive>
        A
      </SidebarBtn>,
    );
    const btn = screen.getByTitle("Test");
    expect(btn.className).toContain("amber");
  });

  it("applies inactive styles when isActive is false", () => {
    render(
      <SidebarBtn title="Test" isActive={false}>
        B
      </SidebarBtn>,
    );
    const btn = screen.getByTitle("Test");
    expect(btn.className).not.toContain("border-amber");
  });

  it("isActive defaults to false", () => {
    render(<SidebarBtn title="Test">X</SidebarBtn>);
    const btn = screen.getByTitle("Test");
    expect(btn.className).toContain("transparent");
  });
});

describe("SidebarDivider", () => {
  it("renders without a label", () => {
    const { container } = render(<SidebarDivider />);
    expect(container.firstChild).toBeTruthy();
    // No label text
    expect(container.querySelector("span")).toBeNull();
  });

  it("renders with a label", () => {
    render(<SidebarDivider label="Sección" />);
    expect(screen.getByText("Sección")).toBeInTheDocument();
  });

  it("renders the horizontal divider line", () => {
    const { container } = render(<SidebarDivider />);
    const divider = container.querySelector(".h-px");
    expect(divider).toBeTruthy();
  });
});
