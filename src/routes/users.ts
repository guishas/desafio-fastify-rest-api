import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const users = await knex('users').select()

    return reply.status(200).send(users)
  })

  app.get('/:id', async (request, reply) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users').where('id', id).first()

    if (!user) {
      return reply.status(404).send('User not found')
    }

    return reply.status(200).send(user)
  })

  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    const user = await knex('users').where('email', email).first()

    if (user) {
      return reply.status(400).send('Email already in use.')
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      password,
    })

    return reply.status(201).send()
  })

  app.post('/login', async (request, reply) => {
    const loginUserBodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = loginUserBodySchema.parse(request.body)

    const user = await knex('users')
      .where({
        email,
        password,
      })
      .first()

    if (!user) {
      return reply.status(404).send('Incorrect email or password.')
    }

    const sessionId = randomUUID()
    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    await knex('users').where('id', user.id).update({
      id: user.id,
      session_id: sessionId,
      name: user.name,
      email,
      password,
      created_at: user.created_at,
    })

    return reply.status(200).send()
  })

  app.post('/logout', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    if (!sessionId) {
      return reply.status(401).send({
        error: 'Unauthorized',
      })
    }

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    await knex('users')
      .where('id', user.id)
      .update({
        id: user.id,
        session_id: knex.raw('NULL'),
        name: user.name,
        email: user.email,
        password: user.password,
        created_at: user.created_at,
      })

    reply.clearCookie('sessionId', {
      domain: 'localhost',
      path: '/',
    })

    return reply.status(200).send()
  })
}
