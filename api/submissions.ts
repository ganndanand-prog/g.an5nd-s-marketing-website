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

const isValidEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
    const record = {
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
      status: 'new' as const,
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

    let emailDelivered = false;
    let emailConfigured = false;
    let needsActivation = false;

    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
      emailConfigured = true;
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
      }).catch(() => null);
      if (resendRes?.ok) {
        emailDelivered = true;
      }
    }

    if (!emailDelivered) {
      const web3FormsKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();
      if (web3FormsKey) {
        emailConfigured = true;
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
            'Зурвас': record.message,
          }),
        }).catch(() => null);
        const w3Data = (await w3Res?.json().catch(() => ({}))) as { success?: boolean };
        if (w3Res?.ok && w3Data.success) {
          emailDelivered = true;
        }
      }
    }

    if (!emailDelivered) {
      emailConfigured = true;
      const formSubmitTarget = (process.env.FORMSUBMIT_ENDPOINT || recipient).trim();
      const origin = request.headers.get('origin') || 'https://g-an5nd-s-marketing-website.vercel.app';
      const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formSubmitTarget)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: origin,
          Referer: `${origin}/`,
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'table',
          ...(isValidEmail(record.email) ? { _replyto: record.email } : {}),
          name: record.senderName,
          email: isValidEmail(record.email) ? record.email : recipient,
          phone: record.phone || record.email,
          'Төрөл': typeTitle,
          'Нэр': record.senderName,
          'Утасны дугаар': record.phone || '-',
          'И-мэйл хаяг': record.email || '-',
          ...(record.service ? { 'Сонгосон үйлчилгээ': record.service } : {}),
          ...(record.brandName ? { 'Байгууллага / Брэнд': record.brandName } : {}),
          message: record.message,
        }),
      }).catch(() => null);
      const fsData = (await fsRes?.json().catch(() => ({}))) as {
        success?: string | boolean;
        message?: string;
      };
      if (fsRes?.ok && (fsData.success === true || fsData.success === 'true')) {
        emailDelivered = true;
      } else {
        const msg = (fsData?.message || '').toLowerCase();
        needsActivation = msg.includes('activation') || msg.includes('activate');
      }
    }

    record.emailDelivered = emailDelivered;

    return Response.json(
      {
        success: true,
        submission: record,
        emailDelivered,
        emailConfigured,
        needsActivation,
        message: emailDelivered
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
