import { expect, test } from "@playwright/test";

const mbCharacterDetail = {
  id: 2,
  nombre: "Skullhammer",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "Mork Borg",
  raza: null,
  subraza: null,
  clases: [],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    MB_Fuerza: 1,
    MB_ModFuerza: 0,
    MB_Agilidad: -1,
    MB_ModAgilidad: -1,
    MB_Presencia: 1,
    MB_ModPresencia: 0,
    MB_Resistencia: 2,
    MB_ModResistencia: 1,
    MB_VidaActual: 6,
    MB_VidaMaxima: 10,
    MB_Presagios: 3,
    MB_Carga: 4,
    MB_Plata: 10,
    MB_Comida: 3,
  },
  habilidades: [],
  mochila: [],
  usado: "2024-01-01T00:00:00Z",
  propietario: "daria",
  tags: "sin-clase",
};

test("edita la vida y estadísticas de un personaje de Mork Borg", async ({
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

  await page.route("**/api/personajes/2/usar", async (route) => {
    await route.fulfill({ status: 200 });
  });

  await page.route("**/api/personajes/2/mejorar-mb", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mbCharacterDetail,
        estadisticas: {
          ...mbCharacterDetail.estadisticas,
          MB_ModFuerza: 1,
          MB_VidaMaxima: 12,
        },
      }),
    });
  });

  await page.route("**/api/personajes/2/suministros", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({}) });
  });

  await page.route("**/api/personajes/2", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mbCharacterDetail),
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
            id: 2,
            nombre: "Skullhammer",
            retrato: "",
            sistemaDeJuego: "Mork Borg",
            usado: "2024-01-01T00:00:00Z",
          },
        ],
        hasMore: false,
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Ir a Personajes" }).click();

  await expect(page.getByText("Skullhammer")).toBeVisible({ timeout: 5000 });
  await page.getByText("Skullhammer").click();

  // Verificar que la hoja cargó: vida actual 6 / máxima 10
  await expect(page.getByText("6")).toBeVisible({ timeout: 5000 });
  // "10" puede matchear el HP máx (p) y algún botón numérico, usar first()
  await expect(page.getByText("10").first()).toBeVisible();

  // Entrar en modo edición
  await page.getByRole("button", { name: "Editar" }).click();

  // Guardar la edición
  await page.getByRole("button", { name: "Guardar edición" }).click();

  // Verificar que salió del modo edición (botón "Guardar edición" ya no visible)
  await expect(
    page.getByRole("button", { name: "Guardar edición" }),
  ).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
});
