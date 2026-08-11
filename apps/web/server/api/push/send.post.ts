import { webPush } from '../../utils/web-push'

const { subscriptions } = await import('../../utils/push-store')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, body: message, url } = body ?? {}

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Missing title' })
  }

  const payload = JSON.stringify({ title, body: message || '', url: url || '/' })

  const results = await Promise.allSettled(
    Array.from(subscriptions.values()).map(sub =>
      webPush.sendNotification(sub, payload),
    ),
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return { sent, failed, total: subscriptions.size }
})
