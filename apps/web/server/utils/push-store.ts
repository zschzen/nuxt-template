// ponytail: in-memory for template, swap to Redis/D1 in production
const subscriptions = new Map<string, any>()

export { subscriptions }
