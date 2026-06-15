import { expect, test } from "@playwright/test";

test("muestra pantalla de creación de Mork Borg y valida campos requeridos", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("jwtToken", "jwt-token");
    localStorage.setItem("username", "daria");
    localStorage.setItem("avatar", "");
  });

  await page.route("**/api/campanas/ultimas", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/personajes**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], hasMore: false }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Ir a Personajes" }).click();

  await expect(page.getByRole("heading", { name: "Personajes" })).toBeVisible();

  // Abrir modal y seleccionar Mork Borg
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await page.getByRole("button", { name: "Mork Borg" }).click();

  // Verificar que se cargó la pantalla de creación de Mork Borg
  await expect(
    page.getByRole("heading", { name: "Crear personaje" }),
  ).toBeVisible();
  await expect(page.getByText("☠ Mork Borg")).toBeVisible();

  // Llenar el nombre del personaje
  await page
    .getByPlaceholder("Escribe el nombre del personaje")
    .fill("Skullhammer");

  // Verificar que el nombre se llenó
  await expect(
    page.getByPlaceholder("Escribe el nombre del personaje"),
  ).toHaveValue("Skullhammer");

  // Subir retrato
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "retrato.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Seleccionar "Sin clase" (no requiere tiradas de opciones)
  await page.getByRole("button", { name: "Sin clase" }).click();

  // Intentar crear el personaje — debe navegar a la fase de estadísticas
  // porque aún no se han tirado las estadísticas
  await page.getByRole("button", { name: "Crear personaje" }).click();

  // Verificar que el formulario sigue presente (no se navegó fuera)
  // y que ahora muestra la fase de estadísticas
  await expect(
    page.getByRole("heading", { name: "Crear personaje" }),
  ).toBeVisible();
  // El botón "🎲 Tirar" de estadísticas debería aparecer
  await expect(page.getByText(/Tirar/).first()).toBeVisible({ timeout: 3000 });
});
