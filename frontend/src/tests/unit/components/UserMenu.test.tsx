// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import UserMenu from "../../../components/UserMenu";

describe("UserMenu", () => {
  afterEach(() => {
    cleanup();
  });

  it("optimiza la url de cloudinary y permite cerrar sesion", () => {
    const onLogout = vi.fn();

    render(
      <UserMenu
        username="daria"
        avatarUrl="https://res.cloudinary.com/demo/image/upload/v1/avatar.png"
        onLogout={onLogout}
      />,
    );

    const avatar = screen.getByRole("img", { name: "daria" });
    expect(avatar).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_160,h_160,c_fill,g_auto/v1/avatar.png",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de usuario" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesion" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("cierra el menu al hacer clic fuera", () => {
    render(
      <UserMenu
        username="daria"
        avatarUrl="https://example.com/avatar.png"
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de usuario" }),
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
