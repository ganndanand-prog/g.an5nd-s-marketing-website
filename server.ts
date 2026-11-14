import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_RECIPIENT = 'anand75io@moes.edu.mn';
const DATA_DIR = path.resolve(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

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
  message: string;
  deadline?: string;
  budget?: string;
  status: 'new' | 'contacted' | 'archived';
  emailDelivered: boolean;
}

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

const isValidEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ensureDataDir = async (): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

const readSubmissions = async (): Promise<SubmissionRecord[]> => {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return [];
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read submissions file:', error);
    return [];
  }
};

const writeSubmissions = async (items: SubmissionRecord[]): Promise<void> => {
  await ensureDataDir();
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(items, null, 2), 'utf8');
};

const buildEmailContent = (record: SubmissionRecord, subject: string, typeTitle: string) => {
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
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${htmlRows}
          </table>
          <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:12px;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">Зурвас / Тайлбар</div>
            <div style="font-size:14px;color:#0f172a;white-space:pre-wrap;line-height:1.6;">${escapeHtml(record.message)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return { text, html };
};

interface EmailDeliveryOutcome {
  delivered: boolean;
  configured: boolean;
  needsActivation?: boolean;
  provider?: string;
}

const getPublicSiteUrl = (): string => {
  const raw = (process.env.APP_URL || '').trim();
  if (raw && raw !== 'MY_APP_URL' && /^https?:\/\//i.test(raw)) {
    return raw.replace('://ais-dev-', '://ais-pre-').replace(/\/+$/, '');
  }
  return 'https://comforting-chebakia-654408.netlify.app';
};

const trySendDiscordWebhook = async (
  record: SubmissionRecord,
  typeTitle: string
): Promise<boolean> => {
  const webhookUrl = (process.env.DISCORD_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
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

    const lines = [
      record.type === 'service' ? 'Шинэ захиалга' : `Шинэ захиалга (${typeTitle})`,
      `Нэр: ${record.brandName ? `${record.brandName} — ${record.senderName}` : record.senderName}`,
      `Холбоо барих: ${contactVal}`,
      `Үйлчилгээ: ${serviceVal}`,
      `Мессеж: ${record.message}`,
    ];

    const response = await fetch(webhookUrl, {
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
      console.error('Discord webhook delivery failed:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
};

const trySendEmail = async (
  record: SubmissionRecord,
  subject: string,
  typeTitle: string
): Promise<EmailDeliveryOutcome> => {
  const recipient = (process.env.RECIPIENT_EMAIL || DEFAULT_RECIPIENT).trim();
  const { text, html } = buildEmailContent(record, subject, typeTitle);

  // 1. Direct Gmail SMTP or Custom SMTP via Nodemailer
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (gmailPass || (smtpHost && smtpUser && smtpPass)) {
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
      console.error('SMTP email delivery failed:', error);
    }
  }

  // 2. Resend API
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
      const response = await fetch('https://api.resend.com/emails', {
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

      if (response.ok) {
        return { delivered: true, configured: true, provider: 'resend' };
      }
      const errText = await response.text();
      console.error('Resend API failed:', response.status, errText);
    } catch (error) {
      console.error('Resend API error:', error);
    }
  }

  // 3. Web3Forms API
  const web3FormsKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  if (web3FormsKey) {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
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
      const data = (await response.json()) as { success?: boolean };
      if (response.ok && data.success) {
        return { delivered: true, configured: true, provider: 'web3forms' };
      }
      console.error('Web3Forms failed:', data);
    } catch (error) {
      console.error('Web3Forms error:', error);
    }
  }

  // 4. FormSubmit server-side relay fallback (uses clean public Origin/Referer/_url to avoid iframe activation link errors)
  try {
    const publicSiteUrl = getPublicSiteUrl();
    const formSubmitTarget = (process.env.FORMSUBMIT_ENDPOINT || recipient).trim();
    const payload: Record<string, string> = {
      _subject: subject,
      _template: 'table',
      ...(isValidEmail(record.email) ? { _replyto: record.email } : {}),
      _url: `${publicSiteUrl}/`,
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
    };

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formSubmitTarget)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: publicSiteUrl,
        Referer: `${publicSiteUrl}/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };

    if (response.ok && (data.success === true || data.success === 'true')) {
      return { delivered: true, configured: true, provider: 'formsubmit' };
    }

    const msg = (data.message || '').toLowerCase();
    const needsActivation = msg.includes('activation') || msg.includes('activate');
    console.warn('FormSubmit relay response:', response.status, data);
    return {
      delivered: false,
      configured: true,
      needsActivation,
      provider: 'formsubmit',
    };
  } catch (error) {
    console.error('FormSubmit relay error:', error);
  }

  return { delivered: false, configured: false };
};

const startServer = async (): Promise<void> => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/submissions', async (_req: Request, res: Response) => {
    try {
      const items = await readSubmissions();
      res.json({ success: true, submissions: items });
    } catch (error) {
      console.error('GET /api/submissions error:', error);
      res.status(500).json({ success: false, message: 'Хүсэлтүүдийг уншихад алдаа гарлаа.' });
    }
  });

  app.post('/api/submissions', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as IncomingSubmissionBody;
      const senderName = (body.senderName || '').trim();
      const rawContact = (body.contact || '').trim();
      const email = (body.email || (isValidEmail(rawContact) ? rawContact : '')).trim();
      const phone = (body.phone || (!isValidEmail(rawContact) ? rawContact : '')).trim();
      const service = (body.service || '').trim();
      const message = (body.message || '').trim() || (service ? `Үйлчилгээ захиалга: ${service}` : '-');
      const type: 'collaboration' | 'contact' | 'service' =
        body.type === 'contact' ? 'contact' : body.type === 'service' ? 'service' : 'collaboration';

      if (!senderName || (!email && !phone)) {
        res.status(400).json({
          success: false,
          message: 'Бүх шаардлагатай талбарыг бүрэн бөглөнө үү.',
        });
        return;
      }

      const now = new Date();
      const newRecord: SubmissionRecord = {
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
          ? `[Анандын Вэбсайт] Хамтран ажиллах хүсэлт: ${newRecord.brandName || senderName}`
          : `[Анандын Вэбсайт] Шууд зурвас: ${senderName}`);
      const typeTitle =
        body.typeTitle?.trim() ||
        (type === 'service'
          ? 'Үйлчилгээ захиалга'
          : type === 'collaboration'
          ? 'Брэнд & Байгууллагын Хамтын Ажиллагаа'
          : 'Шууд зурвас (Холбоо барих)');

      const [delivery, discordDelivered] = await Promise.all([
        trySendEmail(newRecord, subject, typeTitle),
        trySendDiscordWebhook(newRecord, typeTitle),
      ]);
      newRecord.emailDelivered = delivery.delivered;

      const existing = await readSubmissions();
      await writeSubmissions([newRecord, ...existing]);

      res.status(201).json({
        success: true,
        submission: newRecord,
        emailDelivered: delivery.delivered,
        discordDelivered,
        emailConfigured: delivery.configured,
        needsActivation: Boolean(delivery.needsActivation),
        message: delivery.delivered
          ? 'Таны хүсэлтийг амжилттай хүлээн авч, имэйлээр илгээлээ!'
          : 'Таны хүсэлтийг системд амжилттай бүртгэлээ!',
      });
    } catch (error) {
      console.error('POST /api/submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Хүсэлт илгээхэд серверийн алдаа гарлаа.',
      });
    }
  });

  app.patch('/api/submissions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = (req.body || {}) as { status?: SubmissionRecord['status'] };
      if (status !== 'new' && status !== 'contacted' && status !== 'archived') {
        res.status(400).json({ success: false, message: 'Буруу төлөв байна.' });
        return;
      }

      const existing = await readSubmissions();
      const updated = existing.map((item) => (item.id === id ? { ...item, status } : item));
      await writeSubmissions(updated);
      res.json({ success: true });
    } catch (error) {
      console.error('PATCH /api/submissions/:id error:', error);
      res.status(500).json({ success: false, message: 'Төлөв шинэчлэхэд алдаа гарлаа.' });
    }
  });

  app.delete('/api/submissions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await readSubmissions();
      const updated = existing.filter((item) => item.id !== id);
      await writeSubmissions(updated);
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/submissions/:id error:', error);
      res.status(500).json({ success: false, message: 'Устгахад алдаа гарлаа.' });
    }
  });

  app.delete('/api/submissions', async (_req: Request, res: Response) => {
    try {
      await writeSubmissions([]);
      res.json({ success: true });
    } catch (error) {
      console.error('DELETE /api/submissions error:', error);
      res.status(500).json({ success: false, message: 'Цэвэрлэхэд алдаа гарлаа.' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
