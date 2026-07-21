import { test, expect } from '@playwright/test'

// Smoke tests — verify the golden path renders without errors.
// These run against a live dev/prod server (no mocking).

test.describe('Home page', () => {
  test('loads and shows navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveTitle(/error/i)
    // Bottom nav is always present
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible()
  })

  test('renders match feed or empty state', async ({ page }) => {
    await page.goto('/')
    // Either matches show OR an empty/upcoming state — either is valid
    const hasContent = await page.locator('main').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('dark mode is default', async ({ page }) => {
    await page.goto('/')
    // The root div from ThemeProvider should have data-theme="dark"
    const themeDiv = page.locator('[data-theme]').first()
    await expect(themeDiv).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('Teams page', () => {
  test('loads without error', async ({ page }) => {
    await page.goto('/teams')
    await expect(page.locator('main')).toBeVisible()
    await expect(page).not.toHaveTitle(/error/i)
  })
})

test.describe('Players page', () => {
  test('loads without error', async ({ page }) => {
    await page.goto('/players')
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Login page', () => {
  test('shows email input', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="mail" i]')
    await expect(emailInput).toBeVisible()
  })

  test('redirects to login when accessing protected route unauthenticated', async ({ page }) => {
    await page.goto('/profile')
    // Middleware should redirect to /login
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Match detail page', () => {
  // This test uses a match ID that may or may not exist in the database.
  // It verifies the page handles both "found" and "not found" states gracefully.
  test('handles unknown match id without crash', async ({ page }) => {
    await page.goto('/matches/00000000-0000-0000-0000-000000000000')
    // Should show either match content or "not found" — not a 500
    const body = page.locator('body')
    await expect(body).not.toContainText(/500|internal server error/i)
  })
})

test.describe('Player detail page', () => {
  test('handles unknown player id without crash', async ({ page }) => {
    await page.goto('/players/00000000-0000-0000-0000-000000000000')
    const body = page.locator('body')
    await expect(body).not.toContainText(/500|internal server error/i)
  })
})

test.describe('Team detail page', () => {
  test('handles unknown team id without crash', async ({ page }) => {
    await page.goto('/teams/00000000-0000-0000-0000-000000000000')
    const body = page.locator('body')
    await expect(body).not.toContainText(/500|internal server error/i)
  })
})
