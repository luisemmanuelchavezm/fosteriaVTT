import { expect, test } from "@playwright/test";

const pestañaResponse = {
  id: 1,
  nombre: "Pestaña 1",
  nCuadriculasX: 10,
  nCuadriculasY: 10,
  distanciaCasilla: 5,
  sistemaMetrico: "ft",
  dmUsername: "daria",
  mapaCapaUrl: null,
};

test("crea un enemigo/PNJ de DnD desde el baúl de campaña", async ({
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

  await page.route(/\/api\/campanas(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ id: 1, sistemaDeJuego: "Dungeons and Dragons" }],
        hasMore: false,
      }),
    });
  });

  await page.route("**/api/campanas/1/acceder", async (route) => {
    await route.fulfill({ status: 200 });
  });

  await page.route("**/api/campanas/1/posiciones**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/campanas/1/pestana/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pestañaResponse),
    });
  });

  await page.route("**/api/campanas/1/pestanas**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/api\/personajes(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], hasMore: false }),
    });
  });

  await page.route("**/api/personajes/npc", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 10,
        nombre: "Goblin",
        tipo: "enemigo",
        sistemaDeJuego: "Dungeons and Dragons",
      }),
    });
  });

  await page.route("**/api/mapas**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], hasMore: false }),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Crear campaña" }).first().click();

  await expect(
    page.getByPlaceholder("Escribe el nombre de la campaña"),
  ).toBeVisible({ timeout: 3000 });
  await page
    .getByPlaceholder("Escribe el nombre de la campaña")
    .fill("Campaña DnD");
  await page.getByRole("button", { name: "Crear campaña" }).click();

  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Abrir pestaña de campaña" }).click();

  await expect(page.getByTitle("Cambiar pestaña")).toBeVisible({
    timeout: 5000,
  });

  // Open Baúl
  await page.getByTitle("Baúl").click();

  // "Crear PNJ" is visible by default (mine + characters tab)
  await expect(page.getByRole("button", { name: "Crear PNJ" })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Crear PNJ" }).click();

  // DnD enemy modal opens — <h2>Crear PNJ</h2>
  await expect(page.getByRole("heading", { name: "Crear PNJ" })).toBeVisible({
    timeout: 3000,
  });

  // Upload portrait (required)
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  const portraitInput = page.locator('input[type="file"]').last();
  await portraitInput.setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Fill name
  await page.getByPlaceholder("Nombre del NPC").fill("Goblin");

  // Submit
  await page.getByRole("button", { name: "Crear PNJ" }).last().click();

  // Modal closes on success
  await expect(
    page.getByRole("heading", { name: "Crear PNJ" }),
  ).not.toBeVisible({ timeout: 5000 });
});
