import type { SubmissionItem } from './submissionsStorage';

export const RECIPIENT_EMAIL = 'anand75io@moes.edu.mn';

export interface EmailPayload {
  type?: 'collaboration' | 'contact' | 'service';
  subject: string;
  typeTitle: string;
  senderName: string;
  email: string;
  phone: string;
  contact?: string;
  service?: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  deadline?: string;
  budget?: string;
  message: string;
}

export interface SendEmailResult {
  success: boolean;
  emailDelivered: boolean;
  emailConfigured: boolean;
  needsActivation?: boolean;
  message: string;
  submission?: SubmissionItem;
}

export const submitRequestToBackend = async (payload: EmailPayload): Promise<SendEmailResult> => {
  try {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        emailDelivered: Boolean(data.emailDelivered),
        emailConfigured: Boolean(data.emailConfigured),
        needsActivation: Boolean(data.needsActivation),
        message: data.message || 'Амжилттай бүртгэгдлээ!',
        submission: data.submission,
      };
    }

    return {
      success: false,
      emailDelivered: false,
      emailConfigured: false,
      message: data.message || 'Хүсэлт илгээхэд алдаа гарлаа.',
    };
  } catch (error) {
    console.error('Error submitting request:', error);
    return {
      success: false,
      emailDelivered: false,
      emailConfigured: false,
      message: 'Сервертэй холбогдоход алдаа гарлаа. Сүлжээний холболтоо шалгана уу.',
    };
  }
};

export const createMailtoLink = (payload: EmailPayload): string => {
  const body = `
Сайн байна уу, Ананд!

Таны вэбсайтаар дараах хүсэлтийг илгээж байна:
----------------------------------------
Төрөл: ${payload.typeTitle}
Нэр: ${payload.senderName}
Утас: ${payload.phone}
И-мэйл: ${payload.email}
${payload.brandName ? `Байгууллага/Брэнд: ${payload.brandName}\n` : ''}${payload.collabType ? `Формат: ${payload.collabType}\n` : ''}${payload.category ? `Чиглэл: ${payload.category}\n` : ''}${payload.deadline ? `Хугацаа: ${payload.deadline}\n` : ''}${payload.budget ? `Төсөв: ${payload.budget}\n` : ''}
Зурвас:
${payload.message}
----------------------------------------
`.trim();

  return `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
};

export const createDirectGmailLink = (payload: EmailPayload): string => {
  const body = `
Сайн байна уу, Ананд!

Таны вэбсайтаар дараах хүсэлтийг илгээж байна:
----------------------------------------
Төрөл: ${payload.typeTitle}
Нэр: ${payload.senderName}
Утас: ${payload.phone}
И-мэйл: ${payload.email}
${payload.brandName ? `Байгууллага/Брэнд: ${payload.brandName}\n` : ''}${payload.collabType ? `Формат: ${payload.collabType}\n` : ''}${payload.category ? `Чиглэл: ${payload.category}\n` : ''}${payload.deadline ? `Хугацаа: ${payload.deadline}\n` : ''}${payload.budget ? `Төсөв: ${payload.budget}\n` : ''}
Зурвас:
${payload.message}
----------------------------------------
`.trim();

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(RECIPIENT_EMAIL)}&su=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
};
