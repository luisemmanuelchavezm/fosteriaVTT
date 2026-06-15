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

// Position at grid (2,2) — center visible in 1280x720 away from sidebar and token panel
const positions = [
  {
    id: 1,
    pestanaId: 1,
    capa: "fichas",
    personajeId: 1,
    personajeNombre: "Skullface",
    retrato: "",
    posicionX: 2,
    posicionY: 2,
    largo: 1,
    ancho: 1,
    tipo: "personaje",
  },
];

const skullfaceDetail = {
  id: 1,
  nombre: "Skullface",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "Mork Borg",
  raza: null,
  subraza: null,
  clases: [],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    MB_ModFuerza: 1,
    MB_ModAgilidad: 0,
    MB_ModPresencia: -1,
    MB_ModResistencia: 2,
    MB_VidaActual: 8,
    MB_VidaMaxima: 8,
  },
  habilidades: [],
  mochila: [],
  usado: "",
  tipo: "personaje",
  tags: null,
};

test("quickaction bar Mork Borg: abre estadísticas y realiza una tirada de Fuerza", async ({
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
        items: [{ id: 1, sistemaDeJuego: "Mork Borg" }],
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
      body: JSON.stringify(positions),
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

  // Character list (Baúl)
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

  // Character detail (QuickActionBar + token panel)
  await page.route("**/api/personajes/1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(skullfaceDetail),
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
    .fill("Campaña Mork Borg");
  await page.getByRole("button", { name: "Crear campaña" }).click();

  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Abrir pestaña de campaña" }).click();

  // Wait for Konva stage to be ready
  await expect(page.getByTitle("Cambiar pestaña")).toBeVisible({
    timeout: 5000,
  });

  // loadPositions fires as a React effect after pestaña loads — wait for it
  await page.waitForTimeout(1000);

  // Compute canvas click coordinates from the actual canvas element's bounding box
  // Token is at posicionX=2, posicionY=2 on a 10x10 grid with CELL_SIZE=70
  const konvaCanvas = page.locator("canvas").first();
  const canvasBox = await konvaCanvas.boundingBox();
  if (!canvasBox) throw new Error("Konva canvas not found");

  const CELL_SIZE = 70;
  const cols = 10;
  const rows = 10;
  const rectX = (canvasBox.width - cols * CELL_SIZE) / 2;
  const rectY = (canvasBox.height - rows * CELL_SIZE) / 2;
  const tokenX = canvasBox.x + rectX + 2 * CELL_SIZE + CELL_SIZE / 2;
  const tokenY = canvasBox.y + rectY + 2 * CELL_SIZE + CELL_SIZE / 2;

  // Click the Konva canvas at the token position to select it
  await page.mouse.click(tokenX, tokenY);

  // Wait for character detail to load so MB actions are shown
  // MB player shows "Estadísticas" label on the habilidad action (overrides "Rasgos")
  await expect(page.getByTitle("Estadísticas")).toBeVisible({ timeout: 10000 });

  // Open MB stats panel
  await page.getByTitle("Estadísticas").click();

  // MBEstadisticasPanel heading — two elements match "Estadísticas" (button label + panel p), use first
  await expect(page.getByText("Estadísticas").first()).toBeVisible({
    timeout: 3000,
  });

  // Click "Fuerza" stat button to roll
  await page
    .getByRole("button", { name: /Fuerza/ })
    .first()
    .click();

  // Dice roll triggered — DiceBox may succeed or fall back to local roll
  const rollIndicator = page
    .getByText("Tirando dados")
    .or(page.getByText("Resultado"))
    .or(page.getByText(/Dice-Box/));
  await expect(rollIndicator).toBeVisible({ timeout: 15000 });
});
