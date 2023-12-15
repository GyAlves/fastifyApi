import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return reply.status(200).send({ transactions })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getTransactionSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({ session_id: sessionId, id })
        .first()

      return reply.status(200).send({ transaction })
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return reply.status(200).send({ summary })
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit', 'pix']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    const transactionTax = type === 'credit' ? 0.15 : 0

    const transactionAmount = ['debit', 'pix'].includes(type)
      ? (amount + transactionTax) * -1
      : amount + transactionTax

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: transactionAmount,
      tax: transactionTax,
      type,
      session_id: sessionId,
    })

    return reply.status(201).send('Transaction created successfully !')
  })
}
