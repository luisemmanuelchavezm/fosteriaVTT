// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  focusLevelUpValidationTarget,
  scrollToTarget,
} from "../../../screens/personaje/dndcharactersheet/hooks/levelUpFocus";

function makeScrollableElement(tag = "div") {
  const el = document.createElement(tag);
  (
    el as HTMLElement & { scrollIntoView: ReturnType<typeof vi.fn> }
  ).scrollIntoView = vi.fn();
  return el as HTMLElement & { scrollIntoView: ReturnType<typeof vi.fn> };
}

describe("scrollToTarget", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  it("no hace nada cuando el elemento es null", () => {
    expect(() => scrollToTarget(null)).not.toThrow();
  });

  it("llama a scrollIntoView en el elemento", () => {
    const el = makeScrollableElement();
    scrollToTarget(el);
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });
});

function makeRef(el: HTMLElement | null) {
  return { current: el };
}

function baseValidation(
  focusTarget: "class" | "class-choice" | "subclass" | "asi" | "none",
  extra: object = {},
) {
  return { error: null, focusTarget, ...extra };
}

describe("focusLevelUpValidationTarget", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  it("desplaza al elemento de clase", () => {
    const classSectionEl = makeScrollableElement("section");

    focusLevelUpValidationTarget({
      validation: baseValidation("class"),
      asiSectionRef: makeRef(null),
      classChoicesSectionRef: makeRef(null),
      classSectionRef: makeRef(classSectionEl),
      subclassSectionRef: makeRef(null),
    });

    expect(classSectionEl.scrollIntoView).toHaveBeenCalled();
  });

  it("desplaza al elemento de subclase", () => {
    const subclassEl = makeScrollableElement("section");

    focusLevelUpValidationTarget({
      validation: baseValidation("subclass"),
      asiSectionRef: makeRef(null),
      classChoicesSectionRef: makeRef(null),
      classSectionRef: makeRef(null),
      subclassSectionRef: makeRef(subclassEl),
    });

    expect(subclassEl.scrollIntoView).toHaveBeenCalled();
  });

  it("desplaza al elemento ASI", () => {
    const asiEl = makeScrollableElement("section");

    focusLevelUpValidationTarget({
      validation: baseValidation("asi"),
      asiSectionRef: makeRef(asiEl),
      classChoicesSectionRef: makeRef(null),
      classSectionRef: makeRef(null),
      subclassSectionRef: makeRef(null),
    });

    expect(asiEl.scrollIntoView).toHaveBeenCalled();
  });

  it("desplaza a classChoicesSectionRef cuando class-choice sin missing errors", () => {
    const choicesSectionEl = makeScrollableElement("section");

    focusLevelUpValidationTarget({
      validation: baseValidation("class-choice"),
      asiSectionRef: makeRef(null),
      classChoicesSectionRef: makeRef(choicesSectionEl),
      classSectionRef: makeRef(null),
      subclassSectionRef: makeRef(null),
    });

    expect(choicesSectionEl.scrollIntoView).toHaveBeenCalled();
  });

  it("desplaza al elemento especifico de choice cuando hay missingChoiceErrors", () => {
    const choiceId = "choice-abc";
    const choiceEl = makeScrollableElement("div");
    choiceEl.id = `levelup-choice-${choiceId}`;
    document.body.appendChild(choiceEl);

    focusLevelUpValidationTarget({
      validation: {
        error: "error",
        focusTarget: "class-choice",
        missingChoiceErrors: { [choiceId]: "falta" },
      },
      asiSectionRef: makeRef(null),
      classChoicesSectionRef: makeRef(null),
      classSectionRef: makeRef(null),
      subclassSectionRef: makeRef(null),
    });

    expect(choiceEl.scrollIntoView).toHaveBeenCalled();
    document.body.removeChild(choiceEl);
  });

  it("no hace nada con focusTarget none", () => {
    const classSectionEl = makeScrollableElement("section");

    focusLevelUpValidationTarget({
      validation: baseValidation("none"),
      asiSectionRef: makeRef(null),
      classChoicesSectionRef: makeRef(null),
      classSectionRef: makeRef(classSectionEl),
      subclassSectionRef: makeRef(null),
    });

    expect(classSectionEl.scrollIntoView).not.toHaveBeenCalled();
  });
});
