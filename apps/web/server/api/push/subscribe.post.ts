// Store push subscription
// ponytail: in-memory for template, swap to Redis/D1 in production

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing endpoint' })
  }

  subscriptions.set(body.endpoint, {
    ...body,
    createdAt: new Date().toISOString(),
  })

  return { success: true }
})
