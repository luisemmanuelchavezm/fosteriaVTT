import type { MutableRefObject } from "react";
import type { LevelUpValidationResult } from "./levelUpValidation";

export function scrollToTarget(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  window.requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

interface FocusLevelUpValidationTargetOptions {
  validation: LevelUpValidationResult;
  asiSectionRef: MutableRefObject<HTMLElement | null>;
  classChoicesSectionRef: MutableRefObject<HTMLElement | null>;
  classSectionRef: MutableRefObject<HTMLElement | null>;
  subclassSectionRef: MutableRefObject<HTMLElement | null>;
}

export function focusLevelUpValidationTarget({
  validation,
  asiSectionRef,
  classChoicesSectionRef,
  classSectionRef,
  subclassSectionRef,
}: FocusLevelUpValidationTargetOptions) {
  if (validation.focusTarget === "class") {
    scrollToTarget(classSectionRef.current);
    return;
  }

  if (validation.focusTarget === "class-choice") {
    const firstMissingChoiceId = validation.missingChoiceErrors
      ? Object.keys(validation.missingChoiceErrors)[0]
      : null;
    const choiceElement = firstMissingChoiceId
      ? document.getElementById(`levelup-choice-${firstMissingChoiceId}`)
      : null;
    scrollToTarget(choiceElement ?? classChoicesSectionRef.current);
    return;
  }

  if (validation.focusTarget === "subclass") {
    scrollToTarget(subclassSectionRef.current);
    return;
  }

  if (validation.focusTarget === "asi") {
    scrollToTarget(asiSectionRef.current);
  }
}
