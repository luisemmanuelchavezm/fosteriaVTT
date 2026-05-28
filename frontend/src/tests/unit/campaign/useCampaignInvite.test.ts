// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCampaignInvite } from "../../../screens/campaign/hooks/useCampaignInvite";

describe("useCampaignInvite", () => {
  beforeEach(() => {
    // Stub clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("inicializa con isInviteOpen en false e inviteCopied en false", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));
    expect(result.current.isInviteOpen).toBe(false);
    expect(result.current.inviteCopied).toBe(false);
  });

  it("construye el inviteLink con el campaignId", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));
    // La URL depende del entorno jsdom, sólo verificamos que contiene ?join=5
    expect(result.current.inviteLink).toContain("?join=5");
  });

  it("construye inviteLink vacío si campaignId es vacío", () => {
    const { result } = renderHook(() => useCampaignInvite(""));
    expect(result.current.inviteLink).toBe("");
  });

  it("setIsInviteOpen abre el popover", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));
    act(() => {
      result.current.setIsInviteOpen(true);
    });
    expect(result.current.isInviteOpen).toBe(true);
  });

  it("handleCopyInvite copia el link y pone inviteCopied en true", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCampaignInvite("5"));

    await act(async () => {
      result.current.handleCopyInvite();
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      result.current.inviteLink,
    );
    expect(result.current.inviteCopied).toBe(true);
  });

  it("inviteCopied vuelve a false tras 2 segundos", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCampaignInvite("5"));

    await act(async () => {
      result.current.handleCopyInvite();
      await Promise.resolve();
    });
    expect(result.current.inviteCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.inviteCopied).toBe(false);
  });

  it("el hook expone un ref para el elemento del popover", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));
    expect(result.current.inviteRef).toBeDefined();
    expect(result.current.inviteRef.current).toBeNull();
  });

  it("cierra el popover al hacer click fuera del elemento (con ref asignado)", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));

    // Crear un elemento y asignarlo al ref
    const popover = document.createElement("div");
    document.body.appendChild(popover);
    Object.defineProperty(result.current.inviteRef, "current", {
      value: popover,
      writable: true,
    });

    act(() => {
      result.current.setIsInviteOpen(true);
    });
    expect(result.current.isInviteOpen).toBe(true);

    // Click en body directamente (fuera del popover)
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
    });
    expect(result.current.isInviteOpen).toBe(false);

    document.body.removeChild(popover);
  });

  it("no cierra el popover si el click es dentro del elemento ref", () => {
    const { result } = renderHook(() => useCampaignInvite("5"));

    // Crear un div y asignarlo al ref
    const container = document.createElement("div");
    document.body.appendChild(container);
    result.current.inviteRef.current = container;

    act(() => {
      result.current.setIsInviteOpen(true);
    });

    act(() => {
      container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(result.current.isInviteOpen).toBe(true);

    document.body.removeChild(container);
  });

  it("handleCopyInvite con campaignId distinto copia el link correspondiente", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCampaignInvite("42"));

    await act(async () => {
      result.current.handleCopyInvite();
      await Promise.resolve();
    });

    expect(result.current.inviteLink).toContain("?join=42");
  });
});
