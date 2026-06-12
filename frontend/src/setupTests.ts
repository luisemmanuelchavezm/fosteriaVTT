import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// 1. Extiende los matchers de Vitest con los de Testing Library
// Esto es lo que permite hacer: expect(...).toBeInTheDocument()
expect.extend(matchers);

// 2. Limpia el DOM virtual después de cada test
// Evita que lo que renderices en un test ensucie el siguiente
afterEach(() => {
  cleanup();
});

// 3. Mock global de scrollIntoView — jsdom no lo implementa
window.HTMLElement.prototype.scrollIntoView = function () {};
