export type AgentPhoneConfig = {
  twilioAccountSid?: string;
  twilioAuthTokenConfigured: boolean;
  twilioPhoneNumber?: string;
  isConfigured: boolean;
};

export type SmsThread = {
  id: string;
  agentId: string;
  contactPhone: string;
  agentPhone: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
};

export type SmsMessage = {
  id: string;
  threadId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  twilioSid: string | null;
  status: string;
  createdAt: string;
};
