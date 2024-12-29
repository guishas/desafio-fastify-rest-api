import { expect, it, describe, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('User routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'Testname',
      email: 'test@gmail.com',
      password: 'test123',
    })

    expect(response.statusCode).toEqual(201)
  })

  it('should be able to list users', async () => {
    await request(app.server).post('/users').send({
      name: 'Testname',
      email: 'test@gmail.com',
      password: 'test123',
    })

    const listUsersResponse = await request(app.server).get('/users')

    expect(listUsersResponse.statusCode).toEqual(200)
    expect(listUsersResponse.body).toEqual([
      expect.objectContaining({
        name: 'Testname',
        email: 'test@gmail.com',
      }),
    ])
  })

  it('should be able to get an user by id', async () => {
    await request(app.server).post('/users').send({
      name: 'Testname',
      email: 'test@gmail.com',
      password: 'test123',
    })

    const listUsersResponse = await request(app.server).get('/users')

    const userId = listUsersResponse.body[0].id

    const getUserResponse = await request(app.server).get(`/users/${userId}`)

    expect(getUserResponse.statusCode).toEqual(200)
  })

  it('should be able to login with user email and password', async () => {
    await request(app.server).post('/users').send({
      name: 'Testname',
      email: 'test@gmail.com',
      password: 'test123',
    })

    const loginUserResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'test@gmail.com',
        password: 'test123',
      })

    expect(loginUserResponse.statusCode).toEqual(200)
  })

  it('should be able to logout with session id', async () => {
    await request(app.server).post('/users').send({
      name: 'Testname',
      email: 'test@gmail.com',
      password: 'test123',
    })

    const loginUserResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'test@gmail.com',
        password: 'test123',
      })

    const cookies = loginUserResponse.get('Set-Cookie') ?? []

    const logoutUserResponse = await request(app.server)
      .post('/users/logout')
      .set('Cookie', cookies)

    expect(logoutUserResponse.statusCode).toEqual(200)
  })
})
