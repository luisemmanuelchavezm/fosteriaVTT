import { expect, test } from "@playwright/test";

const emptyEquipment = { fijos: [], gruposEleccion: [] };

const dndCharacterDetail = {
  id: 1,
  nombre: "Gandalf",
  retrato: "",
  biografia: null,
  sistemaDeJuego: "Dungeons and Dragons",
  raza: "Humano",
  subraza: null,
  clases: [
    {
      clase: { id: "clerigo", nombre: "Clérigo", insignia: "Cl" },
      nivel: 1,
      subclase: null,
      subclaseNivel: null,
    },
  ],
  caracteristicaLanzamientoConjuros: null,
  estadisticas: {
    FuerzaBase: 10,
    DestrBase: 10,
    ConstBase: 10,
    IntBase: 10,
    SabBase: 14,
    CarBase: 10,
    VidaActual: 9,
    VidaMaxima: 9,
    VidaTemporal: 0,
    "Hechizos nivel 1": 2,
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

test("crea un personaje de Dungeons and Dragons", async ({ page }) => {
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
            descripcion: "Clérigo centrado en curación.",
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
        body: JSON.stringify([]),
      });
    },
  );

  await page.route(
    "**/api/informacion/dnd/trasfondos/acolito",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "acolito",
          nombre: "Acolito",
          descripcion: "Sirviente de un templo.",
          competenciasHabilidades: [],
          competenciasHerramientas: [],
          resumenIdiomas: [],
          nombreRasgo: "Refugio de las gentes",
          descripcionRasgo: "Los que te tratan como familia te protegen.",
          elecciones: [],
          equipamiento: emptyEquipment,
        }),
      });
    },
  );

  await page.route("**/api/informacion/dnd/razas", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: "humano", nombre: "Humano" }]),
    });
  });

  await page.route("**/api/informacion/dnd/razas/humano", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "humano",
        nombre: "Humano",
        descripcion: "Raza versátil.",
        aumentoCaracteristicas: ["Fuerza +1"],
        edad: "Los humanos maduran a los 18 años.",
        tamano: "Mediano",
        velocidad: 30,
        idiomas: ["Común"],
        competencias: [],
        rasgos: [],
        elecciones: [],
        subrazas: [],
      }),
    });
  });

  await page.route("**/api/personajes/dnd", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(dndCharacterDetail),
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

  await page.goto("/");
  await page.getByRole("button", { name: "Ir a Personajes" }).click();

  await expect(page.getByRole("heading", { name: "Personajes" })).toBeVisible();

  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await page.getByRole("button", { name: "Dungeons and Dragons" }).click();

  await expect(
    page.getByRole("heading", { name: "Crear personaje" }),
  ).toBeVisible();

  // Subir retrato
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "retrato.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Nombre del personaje
  await page
    .getByPlaceholder("Escribe el nombre del personaje")
    .fill("Gandalf");

  // Seleccionar clase Clérigo
  await page.getByRole("button", { name: "Clérigo" }).click();
  const selectButton = page.getByRole("button", { name: "Seleccionar" });
  await expect(selectButton).toBeEnabled();
  await selectButton.click();

  // Seleccionar subclase
  await page.getByRole("button", { name: /Dominio de la vida/i }).click();

  // Ir al trasfondo
  await page.getByRole("button", { name: "2. trasfondo" }).click();

  const backgroundSelect = page.locator("select").first();
  await Promise.all([
    page.waitForResponse("**/api/informacion/dnd/trasfondos/acolito"),
    backgroundSelect.selectOption("acolito"),
  ]);

  await page.getByRole("button", { name: "3. raza" }).click();

  // Seleccionar Humano (races use a <select>, not buttons)
  await Promise.all([
    page.waitForResponse("**/api/informacion/dnd/razas/humano"),
    page.locator("#race-select").selectOption("humano"),
  ]);

  // Ir a estadísticas
  await page.getByRole("button", { name: "4. estadísticas" }).click();

  // Cambiar a modo personalizado
  await page.locator("#stats-method-select").selectOption("custom");

  // Llenar los 6 valores de estadística con 10
  const statInputs = page.locator(
    'input[type="number"], input[inputmode="numeric"]',
  );
  const statCount = await statInputs.count();
  for (let i = 0; i < statCount && i < 6; i++) {
    await statInputs.nth(i).fill("10");
  }

  // Ir a equipamiento
  await page.getByRole("button", { name: "5. equipamiento" }).click();

  // Crear personaje
  await page.getByRole("button", { name: "Crear personaje" }).first().click();

  // Verificar que el personaje fue creado y la hoja se muestra
  await expect(
    page.getByText(/Personaje creado correctamente|Gandalf/i),
  ).toBeVisible({ timeout: 8000 });
});
