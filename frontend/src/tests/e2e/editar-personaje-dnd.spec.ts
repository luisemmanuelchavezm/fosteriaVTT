import { expect, test } from "@playwright/test";

const dndCharacterDetail = {
  id: 1,
  nombre: "Aragorn",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "Dungeons and Dragons",
  raza: "Humano",
  subraza: null,
  clases: [
    {
      clase: { id: "guerrero", nombre: "Guerrero", insignia: "Gu" },
      nivel: 1,
      subclase: null,
      subclaseNivel: null,
    },
  ],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    FuerzaBase: 15,
    DestrBase: 13,
    ConstBase: 14,
    IntBase: 10,
    SabBase: 11,
    CarBase: 9,
    VidaActual: 10,
    VidaMaxima: 12,
    VidaTemporal: 0,
    "Hechizos nivel 1": 0,
    "Hechizos nivel 2": 0,
    "Hechizos nivel 3": 0,
    "Hechizos nivel 4": 0,
    "Hechizos nivel 5": 0,
    "Hechizos nivel 6": 0,
    "Hechizos nivel 7": 0,
    "Hechizos nivel 8": 0,
    "Hechizos nivel 9": 0,
  },
  habilidades: [],
  mochila: [],
  usado: "2024-01-01T00:00:00Z",
  propietario: "daria",
};

const updatedDndCharacterDetail = {
  ...dndCharacterDetail,
  nombre: "Aragorn el Rey",
};

test("edita el nombre y estadísticas de un personaje de DnD", async ({
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

  await page.route("**/api/personajes/1/usar", async (route) => {
    await route.fulfill({ status: 200 });
  });

  await page.route("**/api/personajes/1/recursos", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(dndCharacterDetail),
    });
  });

  await page.route("**/api/personajes/1/edicion", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(updatedDndCharacterDetail),
    });
  });

  await page.route("**/api/personajes/1", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(dndCharacterDetail),
    });
  });

  await page.route(/\/api\/personajes(\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: 1,
            nombre: "Aragorn",
            retrato: "",
            sistemaDeJuego: "Dungeons and Dragons",
            usado: "2024-01-01T00:00:00Z",
          },
        ],
        hasMore: false,
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Ir a Personajes" }).click();

  await expect(page.getByText("Aragorn")).toBeVisible({ timeout: 5000 });
  await page.getByText("Aragorn").click();

  // Esperar que cargue la hoja
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible({
    timeout: 5000,
  });

  // Ajustar vida antes de editar (click en +)
  const healBtn = page.getByRole("button", { name: "+" }).first();
  if (await healBtn.isVisible()) {
    await healBtn.click();
  }

  // Entrar en modo edición
  await page.getByRole("button", { name: "Editar" }).click();

  // Esperar a que aparezca el botón "Guardar edición" (confirma que edit mode está activo)
  await expect(
    page.getByRole("button", { name: "Guardar edición" }),
  ).toBeVisible({ timeout: 5000 });

  // Cambiar nombre — React controlled inputs no tienen atributo value en el DOM,
  // así que buscamos el primer input de texto (el del nombre en IdentitySection)
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill("Aragorn el Rey");

  // Guardar la edición
  await page.getByRole("button", { name: "Guardar edición" }).click();

  // Verificar que salió del modo edición
  await expect(
    page.getByRole("button", { name: "Guardar edición" }),
  ).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
});
