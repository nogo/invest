import { createServerFn } from '@tanstack/react-start'
import prisma from '~/lib/prisma'

export const getBrokerAccounts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await prisma.brokerAccounts.findMany();
  })