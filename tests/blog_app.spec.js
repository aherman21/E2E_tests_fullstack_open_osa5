const { test, describe, expect, beforeEach } = require('@playwright/test')

describe('blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen'
      }
    })
    await page.goto('http://localhost:5173')
    
  })
  test('login form is visible after pressing login button', async ({ page }) => {
    

    await page.getByRole('button', { name: 'log in'}).click()

    const locatorUsername = await page.getByText('username')
    const locatorPassword = await page.getByText('password')
    await expect(locatorUsername).toBeVisible()
    await expect(locatorPassword).toBeVisible()
  })
})