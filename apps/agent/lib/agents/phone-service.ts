import { prisma } from '@/lib/prisma';

export async function getAgentPhoneNumber(agentId: string): Promise<string | null> {
  if (!prisma) return null;
  try {
    const setting = await prisma.setting.findUnique({
      where: { module_key: { module: 'agent.phone', key: agentId } },
    });
    if (!setting) return null;
    const val = setting.value as { phoneNumber?: string } | null;
    return val?.phoneNumber ?? null;
  } catch {
    return null;
  }
}

export async function setAgentPhoneNumber(agentId: string, phoneNumber: string): Promise<void> {
  if (!prisma) throw new Error('No DB');
  await prisma.setting.upsert({
    where: { module_key: { module: 'agent.phone', key: agentId } },
    create: { module: 'agent.phone', key: agentId, value: { phoneNumber } },
    update: { value: { phoneNumber } },
  });
}

export async function findAgentIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
  if (!prisma) return null;
  try {
    const setting = await prisma.setting.findFirst({
      where: {
        module: 'agent.phone',
        value: { path: ['phoneNumber'], equals: phoneNumber },
      },
    });
    return setting?.key ?? null;
  } catch {
    return null;
  }
}

export async function getOrCreateSmsThread(
  agentId: string,
  contactPhone: string,
  agentPhone: string,
) {
  if (!prisma) throw new Error('No DB');
  return prisma.agentSmsThread.upsert({
    where: { agentId_contactPhone: { agentId, contactPhone } },
    create: { agentId, contactPhone, agentPhone },
    update: { agentPhone },
  });
}

export async function saveSmsMessage(
  threadId: string,
  direction: 'inbound' | 'outbound',
  body: string,
  twilioSid?: string,
) {
  if (!prisma) throw new Error('No DB');
  const message = await prisma.agentSmsMessage.create({
    data: { threadId, direction, body, twilioSid: twilioSid ?? null, status: 'delivered' },
  });
  await prisma.agentSmsThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });
  return message;
}

export async function listSmsThreads(agentId: string) {
  if (!prisma) return [];
  return prisma.agentSmsThread.findMany({
    where: { agentId },
    orderBy: { lastMessageAt: 'desc' },
  });
}

export async function getSmsMessages(threadId: string) {
  if (!prisma) return [];
  return prisma.agentSmsMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  });
}
