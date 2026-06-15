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
    VidaActual: 12,
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

test("elimina un personaje de Dungeons and Dragons", async ({ page }) => {
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

  await page.route("**/api/personajes/1", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 204 });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dndCharacterDetail),
      });
      return;
    }
    await route.continue();
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

  // Verificar que el personaje aparece en la lista
  await expect(page.getByText("Aragorn")).toBeVisible({ timeout: 5000 });

  // Abrir la hoja del personaje
  await page.getByText("Aragorn").click();

  // Esperar a que cargue la hoja del personaje (botón "Editar" visible)
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible({
    timeout: 5000,
  });

  // Entrar en modo edición
  await page.getByRole("button", { name: "Editar" }).click();

  // Hacer clic en "Eliminar personaje"
  await expect(
    page.getByRole("button", { name: "Eliminar personaje" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Eliminar personaje" }).click();

  // Modal de confirmación: escribir "borrar"
  await expect(page.getByPlaceholder("borrar")).toBeVisible();
  await page.getByPlaceholder("borrar").fill("borrar");

  // Confirmar eliminación
  await page.getByRole("button", { name: "Borrar" }).click();

  // Verificar que se volvió a la pantalla de personajes
  await expect(page.getByRole("heading", { name: "Personajes" })).toBeVisible({
    timeout: 5000,
  });
});
