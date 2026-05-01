import { expect, test } from "@playwright/test";

const emptyEquipment = {
  fijos: [],
  gruposEleccion: [],
};

test("muestra subclases iniciales del clerigo y vuelve a clase si falta el nombre", async ({
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

  await page.route("**/api/informacion/dnd/clases", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "clerigo", nombre: "Clérigo", insignia: "Cl" },
      ]),
    });
  });

  await page.route("**/api/informacion/dnd/trasfondos", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: "acolito", nombre: "Acolito" }]),
    });
  });

  await page.route("**/api/informacion/dnd/clases/clerigo", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "clerigo",
        nombre: "Clérigo",
        insignia: "Cl",
        descripcion: "Canaliza poder divino.",
        puntosGolpe: {
          dadoGolpe: "1d8",
          primerNivel: "8 + CON",
          nivelesSuperiores: "1d8 o 5 + CON",
        },
        competencias: {
          armaduras: ["Armaduras ligeras"],
          armas: ["Armas simples"],
          herramientas: [],
          salvaciones: ["Sabiduria", "Carisma"],
          habilidades: ["Historia", "Perspicacia"],
        },
        lanzamientoConjuros: null,
        subclases: [
          {
            id: "vida",
            nombre: "Dominio de la vida",
            descripcion: "Clérigo centrado en curación y protección.",
            nivelDesbloqueo: 1,
          },
          {
            id: "luz",
            nombre: "Dominio de la luz",
            descripcion: "Canaliza fuego y resplandor sagrado.",
            nivelDesbloqueo: 1,
          },
        ],
        elecciones: [],
        equipamiento: emptyEquipment,
      }),
    });
  });

  await page.route("**/api/habilidades/clerigo", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(
    "**/api/habilidades/clerigo/subclases/vida",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            nivel: 1,
            habilidades: [
              {
                id: 1,
                nombre: "Discipulo de la vida",
                descripcion: "Tus curaciones restauran vida adicional.",
                formula: null,
              },
            ],
          },
        ]),
      });
    },
  );

  await page.route(
    "**/api/habilidades/clerigo/subclases/luz",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    },
  );

  await page.goto("/");

  await page.getByRole("button", { name: "Ir a Personajes" }).click();
  await page.getByRole("button", { name: "Crear un nuevo personaje" }).click();
  await page.getByRole("button", { name: "Dungeons and Dragons" }).click();

  await expect(
    page.getByRole("heading", { name: "Crear personaje" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Clérigo" }).click();
  await expect(
    page.getByRole("heading", { name: "Clérigo", exact: true }),
  ).toBeVisible();

  const selectClassButton = page.getByRole("button", { name: "Seleccionar" });
  await expect(selectClassButton).toBeEnabled();
  await selectClassButton.click();

  await expect(
    page.getByRole("heading", { name: "Subclase inicial", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dominio de la vida/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Dominio de la vida/i }).click();
  await expect(page.getByText("Rasgos de Dominio de la vida")).toBeVisible();
  await expect(page.getByText("Discipulo de la vida")).toBeVisible();

  await page.getByRole("button", { name: "5. equipamiento" }).click();
  await page.getByRole("button", { name: "Crear personaje" }).first().click();

  await expect(
    page.getByPlaceholder("Escribe el nombre del personaje"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Subclase inicial", exact: true }),
  ).toBeVisible();
});
