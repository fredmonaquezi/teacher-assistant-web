import { expect, test } from "@playwright/test";

const SUPABASE_ORIGIN = "http://127.0.0.1:54321";
const AUTH_STORAGE_KEY = "sb-127-auth-token";
const teacher = {
  id: "teacher-1",
  aud: "authenticated",
  role: "authenticated",
  email: "teacher@example.com",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Phase Six Teacher" },
  created_at: "2026-01-01T00:00:00.000Z",
};
const classRow = {
  id: "class-1",
  name: "Year 6",
  grade_level: "Grade 6",
  school_year: "2026",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
};
const studentRows = [
  {
    id: "student-1",
    first_name: "Ada",
    last_name: "Lovelace",
    gender: "Female",
    class_id: "class-1",
    notes: null,
    is_participating_well: false,
    needs_help: false,
    missing_homework: false,
    separation_list: null,
    sort_order: 0,
    academic_level_override: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

async function installTeacherSession(page) {
  await page.addInitScript(
    ({ storageKey, user }) => {
      const encode = (value) =>
        btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        aud: "authenticated",
        exp: expiresAt,
        sub: user.id,
        email: user.email,
        role: "authenticated",
      })}.test-signature`;

      localStorage.setItem(storageKey, JSON.stringify({
        access_token: accessToken,
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        expires_at: expiresAt,
        token_type: "bearer",
        user,
      }));
      localStorage.setItem(`ta_active_class:${user.id}`, "class-1");
      localStorage.setItem("teacher-assistant.language", "en");
    },
    { storageKey: AUTH_STORAGE_KEY, user: teacher }
  );
}

async function mockSupabase(page) {
  await page.route(`${SUPABASE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/auth/v1/user") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(teacher) });
      return;
    }

    const rowsByTable = {
      classes: [classRow],
      students: studentRows,
      attendance_sessions: [],
      attendance_entries: [],
    };
    const table = url.pathname.match(/^\/rest\/v1\/([^/]+)$/)?.[1];
    if (request.method() === "GET" && table in rowsByTable) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": `0-${Math.max(rowsByTable[table].length - 1, 0)}/*` },
        body: JSON.stringify(rowsByTable[table]),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test("public teacher assistant entry shows the sign-in workflow", async ({ page }) => {
  await page.goto("/teacherassistant");

  await expect(page.getByRole("heading", { name: "Class Notes" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("signed-in teacher can load a class and navigate to attendance", async ({ page }) => {
  await installTeacherSession(page);
  await mockSupabase(page);

  await page.goto("/teacherassistant");

  await expect(page.getByRole("heading", { name: "Welcome to your teaching workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Year 6" })).toBeVisible();
  await expect(page.getByText("1 student · Grade 6 · 2026")).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: "Attendance" }).click();

  await expect(page).toHaveURL(/\/teacherassistant\/attendance$/);
  await expect(page.getByRole("heading", { name: "Attendance", exact: true })).toBeVisible();
  await expect(page.getByText("Class: Year 6 (Grade 6)")).toBeVisible();
  await expect(page.getByText("No attendance sessions yet")).toBeVisible();
});
