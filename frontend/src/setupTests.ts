import { expect } from "vitest";
import matchers from "@testing-library/jest-dom/matchers";

// safe manual matcher registration for Vitest/jest-dom compatibility
expect.extend(matchers);
