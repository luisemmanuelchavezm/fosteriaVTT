import { expect, test } from "@playwright/test";

const newObject = {
  id: 1,
  nombre: "Poción de prueba",
  formula: null,
  descripcion: "",
  tipoObjeto: "MISCELANEO",
  sistema: "D&D 5e",
  adminCreado: true,
};

test("admin crea un objeto de catálogo (misceláneo) y lo borra", async ({
  page,
}) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "jwt-token",
        username: "admin-user",
        avatar: "",
        role: "ADMIN",
      }),
    });
  });

  await page.route("**/api/admin/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  let objectsInDb: (typeof newObject)[] = [];

  await page.route("**/api/admin/objetos", async (route) => {
    if (route.request().method() === "POST") {
      objectsInDb = [newObject];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(newObject),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([...objectsInDb]),
    });
  });

  await page.route("**/api/admin/objetos/1", async (route) => {
    if (route.request().method() === "DELETE") {
      objectsInDb = [];
      await route.fulfill({ status: 200 });
      return;
    }
    await route.continue();
  });

  await page.goto("/");

  // Login
  await expect(page.getByPlaceholder("Tu usuario")).toBeVisible({
    timeout: 5000,
  });
  await page.getByPlaceholder("Tu usuario").fill("admin");
  await page.getByPlaceholder("Tu contraseña").fill("admin1234");
  await page.getByRole("button", { name: "Entrar" }).click();

  // Navigate to Objetos tab
  await expect(page.getByText("Gestión de usuarios")).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("button", { name: "Objetos" }).click();

  await expect(page.getByText("Gestión de objetos")).toBeVisible({
    timeout: 3000,
  });

  // Open create flow
  await page.getByRole("button", { name: "Crear item" }).click();

  await expect(page.getByText("¿Para qué sistema?")).toBeVisible({
    timeout: 3000,
  });

  // Select D&D 5e
  await page.getByRole("button", { name: "D&D 5e" }).click();

  await expect(page.getByText("Nuevo objeto de catálogo")).toBeVisible({
    timeout: 3000,
  });

  // Fill name (input is nested inside a label with text "Nombre")
  await page.getByLabel("Nombre").fill("Poción de prueba");

  // Submit (type defaults to MISCELANEO)
  await page.getByRole("button", { name: "Crear objeto" }).click();

  // Object appears in table (POST response adds it locally with adminCreado: true)
  await expect(page.getByText("Poción de prueba")).toBeVisible({
    timeout: 5000,
  });

  // Delete button is visible because adminCreado=true
  await page.getByTitle("Eliminar objeto").click();

  await expect(page.getByText("¿Eliminar objeto?")).toBeVisible({
    timeout: 3000,
  });

  await page.getByRole("button", { name: "Eliminar", exact: true }).click();

  await expect(page.getByText("Poción de prueba")).not.toBeVisible({
    timeout: 5000,
  });
});
