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

async function setupCampaignAndNavigateToPestaña(
  page: import("@playwright/test").Page,
) {
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

  // GET /api/campanas?... (campaign list) and POST /api/campanas (create)
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

  // Handles both /pestana/abrir and /pestana/{id}/abrir
  await page.route("**/api/campanas/1/pestana/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pestañaResponse),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Crear campaña" }).first().click();

  await expect(
    page.getByPlaceholder("Escribe el nombre de la campaña"),
  ).toBeVisible({ timeout: 3000 });
  await page
    .getByPlaceholder("Escribe el nombre de la campaña")
    .fill("Arena de Prueba");

  await page.getByRole("button", { name: "Crear campaña" }).click();

  // After 900ms delay, navigates to campaign-home
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible({
    timeout: 3000,
  });

  await page.getByRole("button", { name: "Abrir pestaña de campaña" }).click();

  // CharacterTokenPanel always renders in CampaignPestañaScreen
  // "Cambiar pestaña" button is visible when isDM = true (username === dmUsername)
  await expect(page.getByTitle("Cambiar pestaña")).toBeVisible({
    timeout: 5000,
  });
}

test("crea una campaña y agrega una nueva pestaña", async ({ page }) => {
  await page.route("**/api/campanas/1/pestanas", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 2,
          nombre: "Pestaña 2",
          nCuadriculasX: 10,
          nCuadriculasY: 10,
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([pestañaResponse]),
    });
  });

  await setupCampaignAndNavigateToPestaña(page);

  // Open tab switcher panel
  await page.getByTitle("Cambiar pestaña").click();

  // PestañaSwitcherPanel loads: GET /api/campanas/1/pestanas → shows current tabs
  await expect(page.getByRole("button", { name: "Nueva pestaña" })).toBeVisible(
    { timeout: 3000 },
  );

  // Create new tab: POST /api/campanas/1/pestanas → {id:2}
  // Then onSelect(2) → switchPestaña(2) → POST /pestana/2/abrir → closes panel
  await page.getByRole("button", { name: "Nueva pestaña" }).click();

  // After creation, onSelect triggers switchPestaña which closes the panel
  await expect(
    page.getByRole("button", { name: "Nueva pestaña" }),
  ).not.toBeVisible({ timeout: 5000 });
});
