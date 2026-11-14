export const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1571045323756019832/eSSiPcX3254UE4LPkQ1jbdoVC9dWxl7JvwzM58lggLwU54py-5rEKnx3m39jwG0FMiNC';

export interface DiscordOrderPayload {
  name: string;
  contact: string;
  service?: string;
  message?: string;
  title?: string;
}

export const sendToDiscordWebhook = async (
  payload: DiscordOrderPayload
): Promise<boolean> => {
  const lines = [
    payload.title || 'Шинэ захиалга',
    `Нэр: ${payload.name}`,
    `Холбоо барих: ${payload.contact}`,
    `Үйлчилгээ: ${payload.service && payload.service.trim() ? payload.service.trim() : 'Ерөнхий холбоо барих'}`,
    `Мессеж: ${payload.message && payload.message.trim() ? payload.message.trim() : '-'}`,
  ];

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: lines.join('\n'),
      allowed_mentions: { parse: [] },
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook error: ${response.status}`);
  }

  return true;
};
