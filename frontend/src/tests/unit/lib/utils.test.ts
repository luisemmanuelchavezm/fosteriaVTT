import { describe, expect, it } from "vitest";
import { cn } from "../../../lib/utils";

describe("cn (className merger)", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("elimina duplicados de tailwind (última clase gana)", () => {
    // twMerge resuelve conflictos: px-2 px-4 → px-4
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("maneja valores falsy (undefined, null, false)", () => {
    expect(cn("base", undefined, null, false, "extra")).toBe("base extra");
  });

  it("maneja strings vacíos", () => {
    expect(cn("", "visible")).toBe("visible");
  });

  it("retorna string vacío si no hay clases", () => {
    expect(cn()).toBe("");
  });

  it("maneja objetos condicionales de clsx", () => {
    expect(cn({ active: true, disabled: false }, "base")).toBe("active base");
  });

  it("maneja arrays de clases", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("fusiona correctamente variantes de padding", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("no elimina clases de módulos distintos", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("resuelve conflictos de colores de texto", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
