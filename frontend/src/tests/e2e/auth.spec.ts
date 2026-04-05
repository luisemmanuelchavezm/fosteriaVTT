import { expect, test } from "@playwright/test";

test("permite registrarse y volver al login", async ({ page }) => {
  await page.route("**/api/auth/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "User registered" }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.getByPlaceholder("Tu nombre...").fill("daria");
  await page.getByPlaceholder("Tu correo...").fill("daria@test.com");
  await page.getByPlaceholder("********").fill("12345678");
  await page.getByRole("button", { name: "REGISTRARSE" }).click();

  await expect(page.getByText("¡Registro completado!")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible({
    timeout: 2500,
  });
});

test("permite iniciar sesión y llegar a home", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "jwt-token", username: "daria" }),
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("Tu usuario").fill("daria");
  await page.getByPlaceholder("Tu contraseña").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("¡Bienvenido daria!")).toBeVisible();
  await expect(page.getByText("¡Bienvenido a FosteriaVTT!")).toBeVisible({
    timeout: 2000,
  });
  await expect(
    page.getByText("Hola daria, estás logueado correctamente."),
  ).toBeVisible();
});
