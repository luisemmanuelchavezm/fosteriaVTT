import { expect, test } from "@playwright/test";

const createdUser = {
  id: 99,
  username: "nuevo-user",
  email: "nuevo@test.com",
  role: "USER",
  campañaCount: 0,
  marketplaceCount: 0,
};

test("admin crea un usuario y lo borra", async ({ page }) => {
  let usersInDb: (typeof createdUser)[] = [];

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
    if (route.request().method() === "POST") {
      usersInDb = [createdUser];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 99 }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([...usersInDb]),
    });
  });

  await page.route("**/api/admin/users/99", async (route) => {
    if (route.request().method() === "DELETE") {
      usersInDb = [];
      await route.fulfill({ status: 200 });
      return;
    }
    await route.continue();
  });

  await page.goto("/");

  // Login form
  await expect(page.getByPlaceholder("Tu usuario")).toBeVisible({
    timeout: 5000,
  });
  await page.getByPlaceholder("Tu usuario").fill("admin");
  await page.getByPlaceholder("Tu contraseña").fill("admin1234");
  await page.getByRole("button", { name: "Entrar" }).click();

  // Admin panel loaded
  await expect(page.getByText("Gestión de usuarios")).toBeVisible({
    timeout: 5000,
  });

  // Open create modal
  await page.getByRole("button", { name: "Crear usuario" }).click();

  await expect(
    page.getByRole("heading", { name: "Crear usuario" }),
  ).toBeVisible({ timeout: 3000 });

  await page
    .getByPlaceholder("Username (mín. 3 caracteres)")
    .fill("nuevo-user");
  await page.getByPlaceholder("Email").fill("nuevo@test.com");
  await page
    .getByPlaceholder("Contraseña (mín. 8 caracteres)")
    .fill("pass12345");

  await page.getByRole("button", { name: "Crear", exact: true }).click();

  // User appears in table
  await expect(page.getByText("nuevo-user")).toBeVisible({ timeout: 5000 });

  // Delete user
  await page.getByTitle("Eliminar usuario").click();

  await expect(page.getByText("¿Borrar usuario?")).toBeVisible({
    timeout: 3000,
  });

  await page.getByPlaceholder("borrar").fill("borrar");
  await page.getByRole("button", { name: "Borrar" }).click();

  await expect(page.getByText("nuevo-user")).not.toBeVisible({
    timeout: 5000,
  });
});
