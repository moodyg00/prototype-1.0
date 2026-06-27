import type { MercuryWebhookEvent } from '../mercury/types';
import {
  refreshMercuryAccountBalances,
  syncMercuryTransactionByProviderId,
  wasMercuryWebhookEventProcessed,
  markMercuryWebhookEventProcessed,
} from './sync-mercury';

export async function processMercuryWebhookEvent(event: MercuryWebhookEvent): Promise<void> {
  if (await wasMercuryWebhookEventProcessed(event.id)) {
    return;
  }

  if (event.resourceType === 'transaction') {
    await syncMercuryTransactionByProviderId(event.resourceId);
    await markMercuryWebhookEventProcessed(event.id, 'transaction');
    return;
  }

  if (
    event.resourceType === 'checkingAccount' ||
    event.resourceType === 'savingsAccount' ||
    event.resourceType === 'treasuryAccount' ||
    event.resourceType === 'creditAccount' ||
    event.resourceType === 'investmentAccount'
  ) {
    await refreshMercuryAccountBalances(event.resourceId);
    await markMercuryWebhookEventProcessed(event.id, event.resourceType);
    return;
  }

  await markMercuryWebhookEventProcessed(event.id, event.resourceType || 'unknown');
}
