import nodemailer from 'nodemailer';

const DEFAULT_RECIPIENT = 'anand75io@moes.edu.mn';

interface IncomingSubmissionBody {
  type?: 'collaboration' | 'contact' | 'service';
  subject?: string;
  typeTitle?: string;
  senderName?: string;
  email?: string;
  phone?: string;
  contact?: string;
  service?: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  deadline?: string;
  budget?: string;
  message?: string;
}

interface SubmissionRecord {
  id: string;
  type: 'collaboration' | 'contact' | 'service';
  createdAt: string;
  timestamp: number;
  senderName: string;
  email: string;
  phone: string;
  service?: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  deadline?: string;
  budget?: string;
  message: string;
  status: 'new';
  emailDelivered: boolean;
}

interface EmailDeliveryOutcome {
  delivered: boolean;
  configured: boolean;
  needsActivation?: boolean;
  provider?: string;
  error?: string;
}

const isValidEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const resolveSiteOrigin = (request: Request): string => {
  const headerOrigin = (request.headers.get('origin') || '').trim();
  if (headerOrigin && /^https?:\/\//i.test(headerOrigin)) {
    return headerOrigin.replace(/\/+$/, '');
  }

  const forwardedHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').trim();
  if (forwardedHost) {
    const proto = (request.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
  }

  const envUrl = (
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    ''
  ).trim();

  if (envUrl && envUrl !== 'MY_APP_URL') {
    const normalized = /^https?:\/\//i.test(envUrl) ? envUrl : `https://${envUrl}`;
    return normalized.replace(/\/+$/, '');
  }

  return 'https://g-an5nd-s-marketing-website.vercel.app';
};

const trySendEmail = async (
  record: SubmissionRecord,
  subject: string,
  typeTitle: string,
  siteOrigin: string
): Promise<EmailDeliveryOutcome> => {
  const recipient = (process.env.RECIPIENT_EMAIL || DEFAULT_RECIPIENT).trim();

  const rows: Array<[string, string]> = [
    ['Төрөл', typeTitle],
    ['Илгээсэн хүн', record.senderName],
    ['Утасны дугаар', record.phone || '-'],
    ['И-мэйл хаяг', record.email || '-'],
  ];
  if (record.service) rows.push(['Сонгосон үйлчилгээ', record.service]);
  if (record.brandName) rows.push(['Байгууллага / Брэнд', record.brandName]);
  if (record.collabType) rows.push(['Контентын формат', record.collabType]);
  if (record.category) rows.push(['Чиглэл', record.category]);
  if (record.deadline) rows.push(['Товлосон хугацаа', record.deadline]);
  if (record.budget) rows.push(['Төсвийн санал', record.budget]);
  rows.push(['Илгээсэн огноо', record.createdAt]);

  const text = [
    subject,
    '='.repeat(48),
    ...rows.map(([label, val]) => `${label}: ${val}`),
    '',
    'Зурвас / Тайлбар:',
    record.message,
    '='.repeat(48),
  ].join('\n');

  const htmlRows = rows
    .map(
      ([label, val]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;width:190px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:500;">${escapeHtml(val)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#0f172a,#312e81);color:#ffffff;padding:22px 24px;">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#38bdf8;font-weight:700;">Анандын Вэбсайт</div>
          <h2 style="margin:6px 0 0;font-size:20px;line-height:1.3;">${escapeHtml(subject)}</h2>
        </div>
        <div style="padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${htmlRows}</table>
          <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:12px;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">Зурвас / Тайлбар</div>
            <div style="font-size:14px;color:#0f172a;white-space:pre-wrap;line-height:1.6;">${escapeHtml(record.message)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  let configured = false;
  let lastError: string | undefined;

  // 1. Direct Gmail SMTP or Custom SMTP via Nodemailer
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (gmailPass || (smtpHost && smtpUser && smtpPass)) {
    configured = true;
    try {
      const transporter = gmailPass
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gmailUser || recipient,
              pass: gmailPass,
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
          });

      await transporter.sendMail({
        from: `"Анандын Вэбсайт" <${gmailUser || smtpUser || recipient}>`,
        to: recipient,
        ...(isValidEmail(record.email) ? { replyTo: record.email } : {}),
        subject,
        text,
        html,
      });

      return { delivered: true, configured: true, provider: 'smtp' };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'SMTP delivery failed';
      console.error('Vercel SMTP email delivery failed:', error);
    }
  }

  // 2. Resend API
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    configured = true;
    try {
      const fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Анандын Вэбсайт <${fromEmail}>`,
          to: [recipient],
          ...(isValidEmail(record.email) ? { reply_to: record.email } : {}),
          subject,
          text,
          html,
        }),
      });
      if (resendRes.ok) {
        return { delivered: true, configured: true, provider: 'resend' };
      }
      const errText = await resendRes.text().catch(() => '');
      lastError = `Resend HTTP ${resendRes.status}`;
      console.error('Vercel Resend API failed:', resendRes.status, errText);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Resend API error';
      console.error('Vercel Resend API error:', error);
    }
  }

  // 3. Web3Forms API
  const web3FormsKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  if (web3FormsKey) {
    configured = true;
    try {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: web3FormsKey,
          subject,
          from_name: record.senderName,
          ...(isValidEmail(record.email) ? { replyto: record.email } : {}),
          'Төрөл': typeTitle,
          'Нэр': record.senderName,
          'Утас': record.phone,
          'И-мэйл': record.email,
          ...(record.service ? { 'Үйлчилгээ': record.service } : {}),
          ...(record.brandName ? { 'Байгууллага / Брэнд': record.brandName } : {}),
          ...(record.collabType ? { 'Формат': record.collabType } : {}),
          ...(record.category ? { 'Чиглэл': record.category } : {}),
          ...(record.deadline ? { 'Дедлайн': record.deadline } : {}),
          ...(record.budget ? { 'Төсөв': record.budget } : {}),
          'Зурвас': record.message,
        }),
      });
      const w3Data = (await w3Res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (w3Res.ok && w3Data.success) {
        return { delivered: true, configured: true, provider: 'web3forms' };
      }
      lastError = w3Data.message || `Web3Forms HTTP ${w3Res.status}`;
      console.error('Vercel Web3Forms failed:', w3Res.status, w3Data);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Web3Forms error';
      console.error('Vercel Web3Forms error:', error);
    }
  }

  // 4. FormSubmit relay fallback
  try {
    configured = true;
    const formSubmitTarget = (process.env.FORMSUBMIT_ENDPOINT || recipient).trim();
    const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formSubmitTarget)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: siteOrigin,
        Referer: `${siteOrigin}/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        ...(isValidEmail(record.email) ? { _replyto: record.email } : {}),
        _url: `${siteOrigin}/`,
        name: record.senderName,
        email: isValidEmail(record.email) ? record.email : recipient,
        phone: record.phone || record.email,
        'Төрөл': typeTitle,
        'Нэр': record.senderName,
        'Утасны дугаар': record.phone || '-',
        'И-мэйл хаяг': record.email || '-',
        ...(record.service ? { 'Сонгосон үйлчилгээ': record.service } : {}),
        ...(record.brandName ? { 'Байгууллага / Брэнд': record.brandName } : {}),
        ...(record.collabType ? { 'Контентын формат': record.collabType } : {}),
        ...(record.category ? { 'Чиглэл': record.category } : {}),
        ...(record.deadline ? { 'Товлосон хугацаа': record.deadline } : {}),
        ...(record.budget ? { 'Төсвийн санал': record.budget } : {}),
        message: record.message,
        'Илгээсэн огноо': record.createdAt,
      }),
    });

    const fsData = (await fsRes.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };

    if (fsRes.ok && (fsData.success === true || fsData.success === 'true')) {
      return { delivered: true, configured: true, provider: 'formsubmit' };
    }

    const msg = (fsData?.message || '').toLowerCase();
    const needsActivation = msg.includes('activation') || msg.includes('activate');
    lastError = fsData?.message || `FormSubmit HTTP ${fsRes.status}`;
    console.warn('Vercel FormSubmit relay response:', fsRes.status, fsData);
    return {
      delivered: false,
      configured: true,
      needsActivation,
      provider: 'formsubmit',
      error: lastError,
    };
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'FormSubmit relay error';
    console.error('Vercel FormSubmit relay error:', error);
  }

  return { delivered: false, configured, error: lastError };
};

const trySendDiscordWebhook = async (
  record: SubmissionRecord,
  typeTitle: string
): Promise<boolean> => {
  const discordWebhookUrl = (process.env.DISCORD_WEBHOOK_URL || '').trim();
  if (!discordWebhookUrl) {
    return false;
  }

  try {
    const contactVal =
      record.phone && record.email && record.phone !== record.email
        ? `${record.phone} / ${record.email}`
        : record.phone || record.email;
    const serviceVal =
      record.service ||
      (record.collabType
        ? `${record.collabType}${record.category ? ` (${record.category})` : ''}`
        : typeTitle);

    const discordLines = [
      record.type === 'service' ? 'Шинэ захиалга' : `Шинэ захиалга (${typeTitle})`,
      `Нэр: ${record.brandName ? `${record.brandName} — ${record.senderName}` : record.senderName}`,
      `Холбоо барих: ${contactVal}`,
      `Үйлчилгээ: ${serviceVal}`,
      `Мессеж: ${record.message}`,
    ];

    const discordRes = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: discordLines.join('\n'),
        allowed_mentions: { parse: [] },
      }),
    });

    if (!discordRes.ok) {
      console.error('Vercel Discord webhook failed:', discordRes.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Vercel Discord webhook error:', error);
    return false;
  }
};

export async function GET(): Promise<Response> {
  return Response.json({ success: true, submissions: [] });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as IncomingSubmissionBody;
    const senderName = (body.senderName || '').trim();
    const rawContact = (body.contact || '').trim();
    const email = (body.email || (isValidEmail(rawContact) ? rawContact : '')).trim();
    const phone = (body.phone || (!isValidEmail(rawContact) ? rawContact : '')).trim();
    const service = (body.service || '').trim();
    const message = (body.message || '').trim() || (service ? `Үйлчилгээ захиалга: ${service}` : '-');
    const type: 'collaboration' | 'contact' | 'service' =
      body.type === 'contact' ? 'contact' : body.type === 'service' ? 'service' : 'collaboration';

    if (!senderName || (!email && !phone)) {
      return Response.json(
        { success: false, message: 'Бүх шаардлагатай талбарыг бүрэн бөглөнө үү.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const record: SubmissionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      createdAt: now.toLocaleString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now.getTime(),
      senderName,
      email: email || phone,
      phone: phone || email,
      service: service || undefined,
      brandName: body.brandName?.trim() || undefined,
      collabType: body.collabType?.trim() || undefined,
      category: body.category?.trim() || undefined,
      deadline: body.deadline?.trim() || undefined,
      budget: body.budget?.trim() || undefined,
      message,
      status: 'new',
      emailDelivered: false,
    };

    const subject =
      body.subject?.trim() ||
      (type === 'service'
        ? `[Анандын Вэбсайт] Шинэ захиалга: ${service || senderName}`
        : type === 'collaboration'
        ? `[Анандын Вэбсайт] Хамтран ажиллах хүсэлт: ${record.brandName || senderName}`
        : `[Анандын Вэбсайт] Шууд зурвас: ${senderName}`);
    const typeTitle =
      body.typeTitle?.trim() ||
      (type === 'service'
        ? 'Үйлчилгээ захиалга'
        : type === 'collaboration'
        ? 'Брэнд & Байгууллагын Хамтын Ажиллагаа'
        : 'Шууд зурвас (Холбоо барих)');

    const siteOrigin = resolveSiteOrigin(request);
    const [emailResult, discordDelivered] = await Promise.all([
      trySendEmail(record, subject, typeTitle, siteOrigin),
      trySendDiscordWebhook(record, typeTitle),
    ]);

    record.emailDelivered = emailResult.delivered;

    return Response.json(
      {
        success: true,
        submission: record,
        emailDelivered: emailResult.delivered,
        discordDelivered,
        emailConfigured: emailResult.configured,
        needsActivation: Boolean(emailResult.needsActivation),
        emailProvider: emailResult.provider,
        message: emailResult.delivered
          ? 'Таны хүсэлтийг амжилттай хүлээн авч, имэйлээр илгээлээ!'
          : 'Таны хүсэлтийг системд амжилттай бүртгэлээ!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Vercel /api/submissions error:', error);
    return Response.json(
      { success: false, message: 'Хүсэлт илгээхэд алдаа гарлаа.' },
      { status: 500 }
    );
  }
}
