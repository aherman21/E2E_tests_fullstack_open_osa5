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

    //first click on the login button to make the login form visible
    await page.getByRole('button', { name: 'log in'}).click()
    
  })
  test('login form is visible by default', async ({ page }) => {

    const locatorUsername = await page.getByTestId('username')
    const locatorPassword = await page.getByTestId('password')
    await expect(locatorUsername).toBeVisible()
    await expect(locatorPassword).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {

      await page.getByTestId('username').fill ('mluukkai')
      await page.getByTestId('password').fill ('salainen')

      await page.getByRole('button', { name: 'login' }).click()

      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByTestId('username').fill ('mluukkai')
      await page.getByTestId('password').fill ('wrong')
      await page.getByRole('button', {name: 'login'}).click()

      await expect(page.getByText('wrong username or password')).toBeVisible()
    })
  })
})