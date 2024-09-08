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

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {

      await page.getByTestId('username').fill ('mluukkai')
      await page.getByTestId('password').fill ('salainen')

      await page.getByRole('button', {name: 'login' }).click()
    })

    test('a new blog can be created', async ({ page }) => {

      await page.getByRole('button', { name: 'new blog' }).click()
      await page.getByTestId('title').fill ('testblog')
      await page.getByTestId('author').fill ('Luukkainen Matti')
      await page.getByTestId('url').fill ('test.blog.com')
      await page.getByRole('button', { name: 'save' }).click()

      await expect(page.getByText('testblog')).toBeVisible()
    })
    
    describe('When a blog exists', () => {
      beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'new blog' }).click()
        await page.getByTestId('title').fill ('testblog')
        await page.getByTestId('author').fill ('Luukkainen Matti')
        await page.getByTestId('url').fill ('test.blog.com')
        await page.getByRole('button', { name: 'save' }).click()
      })

      test('blog can be liked', async ({ page }) => {

        await page.getByRole('button', { name: 'show' }).click()
        await expect(page.getByText('likes: 0')).toBeVisible()

        await page.getByRole('button', { name: 'like' }).click()
        await expect(page.getByText('likes: 1')).toBeVisible()
      })

      test('blog can be deleted', async ({ page }) => {

        
        page.once('dialog', async dialog => {
          expect(dialog.message()).toContain('Do you really want to delete this blog')
          await dialog.accept()})

        await page.getByRole('button', { name: 'delete' }).click()

        await expect(page.getByText('deleted successfully')).toBeVisible()
      })

      test('only the poster can see the delete button of the blog', async ({ page, request }) => {
        //check that the user mluukkai who has posted the blog can see the delete button
        await expect(page.getByText('delete')).toBeVisible()
        // log out and create new user for posting
        await page.getByRole('button', { name: 'logout'}).click()
        await request.post('http://localhost:3003/api/users', {
          data: {
            username: 'blogtester',
            name: 'Tim Tester',
            password: 'testing'
          }
        })

        await page.getByTestId('username').fill ('blogtester')
        await page.getByTestId('password').fill ('testing')
    
        await page.getByRole('button', { name: 'login' }).click()

        await expect(page.getByText('Tim Tester logged in')).toBeVisible()
        await expect(page.getByText('delete')).not.toBeVisible()

      })

      test('blogs are rendered by the order of likes', async ({ page }) => {
        //set custom timeout because this test takes a lot of time
        test.setTimeout(60000)
        // Create the first blog
        await page.getByRole('button', { name: 'new blog' }).click()
        await page.getByTestId('title').fill('most likes')
        await page.getByTestId('author').fill('Luukkainen Matti')
        await page.getByTestId('url').fill('test.blog.com')
        await page.getByRole('button', { name: 'save' }).click()

        // Create the second blog
        await page.getByRole('button', { name: 'new blog' }).click()
        await page.getByTestId('title').fill('less likes')
        await page.getByTestId('author').fill('Luukkainen Matti')
        await page.getByTestId('url').fill('test.blog.com')
        await page.getByRole('button', { name: 'save' }).click()

        // Playwright not always rendering the second blog, adding this line helped.
        await page.waitForSelector('[data-testid="blog"]')

        // Create the third blog
        await page.getByRole('button', { name: 'new blog' }).click()
        await page.getByTestId('title').fill('nine likes')
        await page.getByTestId('author').fill('Luukkainen Matti')
        await page.getByTestId('url').fill('test.blog.com')
        await page.getByRole('button', { name: 'save' }).click()

        // Wait for the blogs to be rendered
        await page.waitForSelector('[data-testid="blog"]')

        // Show details and like the blogs
        const blogTitles = ['most likes', 'less likes', 'nine likes']
        const likeCounts = [17, 5, 9]

        for (let i = 0; i < blogTitles.length; i++) {
          const blogTitle = blogTitles[i]
          const likeCount = likeCounts[i]

          // Show the blog's details
          await page.locator('li', {hasText: blogTitle }).getByRole('button', { name: 'show' }).click()


          // Like the blog multiple times
          for (let j = 0; j < likeCount; j++) {
            await page.locator('li', { hasText: blogTitle }).getByRole('button', { name: 'like' }).click()
          }
        }

        // Get all the blog elements
        const blogElements = await page.$$('[data-testid="blog"]')

        // Extract the likes from the blog elements
        const likes = await Promise.all(blogElements.map(async blog => {
          const likesText = await blog.$eval('div:has-text("likes:")', el => el.textContent)
          const likesMatch = likesText.match(/likes:\s*(\d+)/)
          return likesMatch ? parseInt(likesMatch[1]) : 0
        }));

        // Check if the likes are sorted in descending order
        for (let i = 0; i < likes.length - 1; i++) {
          expect(likes[i]).toBeGreaterThanOrEqual(likes[i + 1])
        }
            })
          })
        })
      })