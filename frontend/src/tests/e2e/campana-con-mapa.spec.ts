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

test("crea una campaña, sube un mapa y lo usa en la campaña", async ({
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

  // Personajes propios del baúl
  await page.route(/\/api\/personajes(\?.*)?$/, async (route) => {
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

  // Mapas propios y POST de subida
  await page.route("**/api/mapas**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          nombre: "Mapa de prueba",
          url: "https://example.com/mapa.png",
        }),
      });
      return;
    }
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
    .fill("Campaña con Mapa");

  await page.getByRole("button", { name: "Crear campaña" }).click();

  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible({
    timeout: 3000,
  });

  await page.getByRole("button", { name: "Abrir pestaña de campaña" }).click();

  await expect(page.getByTitle("Cambiar pestaña")).toBeVisible({
    timeout: 5000,
  });

  // Abrir el Baúl desde la barra lateral
  await page.getByTitle("Baúl").click();

  // El Baúl muestra la sección "Tus elementos > Personajes" por defecto
  // Cambiar al tab de contenido "Mapa"
  await page.getByRole("button", { name: "Mapa" }).click();

  // Aparece el botón "Subir" para subir un mapa
  await expect(page.getByRole("button", { name: "Subir" })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Subir" }).click();

  // MapUploadModal se abre
  await expect(page.getByRole("heading", { name: "Subir mapa" })).toBeVisible();

  // Subir imagen via input oculto
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  const mapFileInput = page.locator('input[type="file"]').last();
  await mapFileInput.setInputFiles({
    name: "mapa.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Dar nombre al mapa
  await page.getByPlaceholder("Nombre del mapa").fill("Mapa de prueba");

  // Enviar: POST /api/mapas → éxito → modal se cierra
  await page.getByRole("button", { name: "Subir mapa" }).click();

  // El modal se cierra tras el submit exitoso
  await expect(
    page.getByRole("heading", { name: "Subir mapa" }),
  ).not.toBeVisible({ timeout: 5000 });
});
