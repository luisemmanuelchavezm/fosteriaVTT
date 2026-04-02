import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Añadimos los matchers manualmente de forma segura para Vitest
expect.extend(matchers);

// Limpia el DOM después de cada test para que no se mezclen
afterEach(() => {
  cleanup();
});
