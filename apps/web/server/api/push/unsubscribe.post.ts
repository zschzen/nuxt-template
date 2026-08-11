const { subscriptions } = await import('../../utils/push-store')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Missing endpoint' })
  }

  subscriptions.delete(body.endpoint)

  return { success: true }
})
