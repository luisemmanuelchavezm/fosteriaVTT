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
    MB_VidaActual: 8,
    MB_VidaMaxima: 8,
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

test("elimina un personaje de Mork Borg", async ({ page }) => {
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

  await page.route("**/api/personajes/2", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 204 });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mbCharacterDetail),
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

  // Verificar que el personaje aparece
  await expect(page.getByText("Skullhammer")).toBeVisible({ timeout: 5000 });

  // Abrir la hoja del personaje
  await page.getByText("Skullhammer").click();

  // Esperar a que cargue la hoja (botón "Editar" visible)
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

  // Confirmar eliminación (MorkBorg usa "Eliminar", no "Borrar")
  await page.getByRole("button", { name: "Eliminar" }).last().click();

  // Verificar que se volvió a la pantalla de personajes
  await expect(page.getByRole("heading", { name: "Personajes" })).toBeVisible({
    timeout: 5000,
  });
});
