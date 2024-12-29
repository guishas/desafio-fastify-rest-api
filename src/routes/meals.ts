import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkSessionIdExists)

  app.get('/', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const meals = await knex('meals').where('user_id', user.id).select()

    return reply.status(200).send(meals)
  })

  app.get('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .first()

    return reply.status(200).send(meal)
  })

  app.post('/', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isInside: z.boolean(),
    })

    const { name, description, isInside } = createMealBodySchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      user_id: user.id,
      name,
      description,
      is_inside: isInside,
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const updateMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = updateMealParamsSchema.parse(request.params)

    const updateMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isInside: z.boolean(),
      createdAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid ISO datetime format',
      }),
    })

    const { name, description, isInside, createdAt } =
      updateMealBodySchema.parse(request.body)

    await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .update({
        name,
        description,
        is_inside: isInside,
        created_at: createdAt,
      })

    return reply.status(200).send()
  })

  app.delete('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const updateMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = updateMealParamsSchema.parse(request.params)

    await knex('meals')
      .where({
        id,
        user_id: user.id,
      })
      .delete()

    return reply.status(200).send()
  })

  app.get('/metrics', async (request, reply) => {
    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(404).send('User not found.')
    }

    const totalMeals = await knex('meals')
      .where({ user_id: user.id })
      .count({ count: '*' })
      .first()

    // Total de refeições dentro da dieta
    const totalInsideDiet = await knex('meals')
      .where({ user_id: user.id, is_inside: true })
      .count({ count: '*' })
      .first()

    // Total de refeições fora da dieta
    const totalOutsideDiet = await knex('meals')
      .where({ user_id: user.id, is_inside: false })
      .count({ count: '*' })
      .first()

    // Melhor sequência de refeições dentro da dieta
    const meals = await knex('meals')
      .where({ user_id: user.id })
      .orderBy('created_at', 'asc') // Ordena as refeições por data de criação

    let bestSequence = 0
    let currentSequence = 0

    // Calcular a sequência
    meals.forEach((meal) => {
      if (meal.is_inside) {
        currentSequence++
        bestSequence = Math.max(bestSequence, currentSequence)
      } else {
        currentSequence = 0
      }
    })

    return {
      total: totalMeals?.count ?? 0, // Parse the string count into a number
      totalInside: totalInsideDiet?.count ?? 0, // Parse the string count into a number
      totalOutside: totalOutsideDiet?.count ?? 0, // Parse the string count into a number
      bestSequence,
    }
  })
}
