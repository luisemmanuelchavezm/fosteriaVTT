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

const marketplaceCharacters = [
  {
    id: 10,
    nombre: "Gandalf el Gris",
    retrato: "",
    sistemaDeJuego: "Dungeons and Dragons",
    tipo: "personaje",
    creadorUsername: "wizard_user",
    esPublico: true,
    esGuardado: false,
    estaPublicado: true,
    yaTienesCopia: false,
  },
  {
    id: 11,
    nombre: "Skullcrusher",
    retrato: "",
    sistemaDeJuego: "Dungeons and Dragons",
    tipo: "enemigo",
    creadorUsername: "darkmaster",
    esPublico: true,
    esGuardado: false,
    estaPublicado: true,
    yaTienesCopia: false,
  },
];

test("crea una campaña y utiliza un personaje público del marketplace", async ({
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

  // Personajes propios del baúl (carga inicial)
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

  // Mapas propios (carga inicial del baúl)
  await page.route("**/api/mapas**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], hasMore: false }),
    });
  });

  // Marketplace personajes
  await page.route("**/api/marketplace/personajes**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: marketplaceCharacters,
        hasMore: false,
      }),
    });
  });

  // Marketplace mapas
  await page.route("**/api/marketplace/mapas**", async (route) => {
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
    .fill("Campaña con Marketplace");

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

  // Cambiar a la pestaña "Marketplace"
  // Hay 300ms de debounce antes de la llamada al API
  await page.getByRole("button", { name: "Marketplace" }).click();

  // Esperar a que carguen los personajes del marketplace
  await expect(page.getByText("Gandalf el Gris")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByText("Skullcrusher")).toBeVisible();
});
