import { expect, it, describe, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meal routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
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

    const createMealResponse = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Jantar',
        description: 'Ovo com frango',
        isInside: true,
      })

    expect(createMealResponse.statusCode).toEqual(201)
  })

  it('should be able to list all meals', async () => {
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

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Jantar',
      description: 'Ovo com frango',
      isInside: true,
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    expect(listMealsResponse.statusCode).toEqual(200)
    expect(listMealsResponse.body.length).toEqual(1)
  })

  it('should be able to get a specific meal', async () => {
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

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Jantar',
      description: 'Ovo com frango',
      isInside: true,
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const mealId = listMealsResponse.body[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)

    expect(getMealResponse.statusCode).toEqual(200)
  })

  it('should be able to update a specific meal', async () => {
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

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Jantar',
      description: 'Ovo com frango',
      isInside: true,
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const mealId = listMealsResponse.body[0].id

    const updateMealResponse = await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send({
        name: 'Jantar sábado',
        description: 'Ovo com frango',
        isInside: true,
        createdAt: '2024-12-25 23:40:01',
      })

    expect(updateMealResponse.statusCode).toEqual(200)
  })

  it('should be able to get user metrics', async () => {
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

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Jantar',
      description: 'Ovo com frango',
      isInside: true,
    })

    const getUserMetricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)

    expect(getUserMetricsResponse.statusCode).toEqual(200)
    expect(getUserMetricsResponse.body.totalInside).toEqual(1)
    expect(getUserMetricsResponse.body.totalOutside).toEqual(0)
    expect(getUserMetricsResponse.body.bestSequence).toEqual(1)
  })
})
