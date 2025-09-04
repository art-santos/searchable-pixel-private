import { test, expect } from '@playwright/test';

// Test data - you can modify these as needed
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  workspaceName: 'Test Workspace',
  domain: 'example.com'
};

test.describe('Login and Workspace Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check if the login form is visible
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for the Split logo
    await expect(page.locator('img[alt="Split Logo"]')).toBeVisible();
    
    // Check for forgot password and sign up links
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit with empty fields
    await page.click('button[type="submit"]');
    
    // Check that the form doesn't submit (we should still be on login page)
    await expect(page).toHaveURL('/login');
    
    // The HTML5 validation should prevent submission
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    
    await expect(emailField).toHaveAttribute('required', '');
    await expect(passwordField).toHaveAttribute('required', '');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.locator('input#password');
    const toggleButton = page.locator('button[type="button"]').last(); // Password toggle button
    
    // Initially password should be hidden
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click toggle button to show password
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // Click again to hide password
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'password');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
    
    // Ensure we're still on the login page
    await expect(page).toHaveURL('/login');
  });

  test('should handle successful login and redirect to dashboard or workspace creation', async ({ page }) => {
    // Note: This test assumes you have valid test credentials in your database
    // You may need to create a test user first or mock the authentication
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect - could be to dashboard or create-workspace
    await page.waitForURL(url => 
      url.pathname === '/dashboard' || 
      url.pathname === '/create-workspace'
    , { timeout: 15000 });
    
    // Check if we're redirected to either dashboard or workspace creation
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|create-workspace)$/);
  });

  test('should complete workspace creation flow after login', async ({ page }) => {
    // This test assumes the user needs to create a workspace after login
    // You may need to ensure the test user doesn't have an existing workspace
    
    // First login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to workspace creation
    await page.waitForURL('/create-workspace', { timeout: 15000 });
    
    // Check if workspace creation form is visible
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="workspace"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="domain"]')).toBeVisible();
    
    // Fill workspace creation form
    await page.fill('input[placeholder*="name"]', TEST_USER.name);
    await page.fill('input[placeholder*="workspace"]', TEST_USER.workspaceName);
    await page.fill('input[placeholder*="domain"]', TEST_USER.domain);
    
    // Submit workspace creation
    await page.click('button:has-text("Complete")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check for dashboard elements
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click the sign up button
    await page.click('text=Sign up');
    
    // Check if we're redirected to signup
    await expect(page).toHaveURL('/signup');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click the forgot password link
    await page.click('text=Forgot your password?');
    
    // Check if we're redirected to forgot password
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should prefill email from URL parameter', async ({ page }) => {
    const testEmail = 'prefilled@example.com';
    
    // Navigate with email parameter
    await page.goto(`/login?email=${encodeURIComponent(testEmail)}`);
    
    // Check if email field is prefilled
    await expect(page.locator('input[type="email"]')).toHaveValue(testEmail);
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Fill in credentials (doesn't matter if valid or not for this test)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    const submitPromise = page.click('button[type="submit"]');
    
    // Check that button shows loading state
    await expect(page.locator('button[type="submit"]')).toContainText('Signing in...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Wait for the submission to complete
    await submitPromise;
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept network requests to simulate failure
    await page.route('**/auth/v1/token**', route => {
      route.abort('failed');
    });
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should show some error message
    // This depends on how your error handling works
    await expect(page.locator('[class*="error"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain form state during interactions', async ({ page }) => {
    const testEmail = 'maintain@example.com';
    const testPassword = 'testpassword';
    
    // Fill in the form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Toggle password visibility
    await page.click('button[type="button"]'); // Password toggle
    
    // Check values are maintained
    await expect(page.locator('input[type="email"]')).toHaveValue(testEmail);
    await expect(page.locator('input[type="text"]')).toHaveValue(testPassword); // Now text type
    
    // Toggle back
    await page.click('button[type="button"]'); // Password toggle
    await expect(page.locator('input[type="password"]')).toHaveValue(testPassword);
  });
});