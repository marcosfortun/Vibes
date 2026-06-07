import { createTranslator } from 'next-intl';
import { defaultLocale, isLocale } from '@/i18n/config';
import {
  bulletList,
  emailDocument,
  escapeHtml,
  heading,
  outlineButton,
  paragraph,
  primaryButton,
  signature,
} from './template';

export type FriendEmailUser = {
  email: string;
  username: string;
  language: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

// Envío interno: HTML + texto plano de respaldo. Usa Resend en producción y
// Mailpit en local (POST /api/v1/send). En local nunca hay RESEND_API_KEY.
// Los errores de email son no fatales: el flujo principal no se interrumpe.
async function deliver(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Vibes <onboarding@resend.dev>';

  if (!apiKey) {
    const mailpitUrl = process.env.MAILPIT_API_URL ?? 'http://localhost:54324';
    const match = from.match(/^(.+?)\s*<(.+?)>$/);
    const fromName = match ? match[1].trim() : 'Vibes';
    const fromEmail = match ? match[2] : from;

    const res = await fetch(`${mailpitUrl}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        From: { Name: fromName, Email: fromEmail },
        To: [{ Email: to }],
        Subject: subject,
        Text: text,
        HTML: html,
      }),
    });

    if (!res.ok) {
      console.error('[email:mailpit]', res.status, await res.text());
    }
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!res.ok) {
    console.error('[email:resend]', res.status, await res.text());
  }
}

async function makeTranslator(language: string) {
  const locale = isLocale(language) ? language : defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, t: createTranslator({ locale, messages, namespace: 'Email' }) };
}

// C — Notificación de nueva amistad (botón secundario/outline).
async function sendOne(to: FriendEmailUser, friendUsername: string) {
  const { locale, t } = await makeTranslator(to.language);
  const url = appUrl();

  const greeting = t('newFriend.greeting', { username: to.username });
  const p1 = t('newFriend.p1', { friend: friendUsername });
  const p2 = t('newFriend.p2');
  const cta = t('newFriend.cta');
  const signoff = t('newFriend.signoff');
  const team = t('newFriend.team');

  const html = emailDocument(
    paragraph(
      t('newFriend.greeting', { username: escapeHtml(to.username) }),
      { strong: true },
    ) +
      paragraph(t('newFriend.p1', { friend: escapeHtml(friendUsername) })) +
      paragraph(p2) +
      outlineButton(cta, url) +
      signature(signoff, team),
    locale,
    `${url}/logo.jpg`,
  );

  const text = `${greeting}\n\n${p1}\n\n${p2}\n\n${cta}: ${url}\n\n${signoff}\n${team}`;

  await deliver(to.email, t('newFriend.subject'), text, html);
}

export async function sendFriendshipEmails(a: FriendEmailUser, b: FriendEmailUser) {
  await Promise.all([sendOne(a, b.username), sendOne(b, a.username)]);
}

// A — Bienvenida (botón principal).
export async function sendWelcomeEmail(user: FriendEmailUser) {
  const { locale, t } = await makeTranslator(user.language);
  const url = appUrl();

  const greeting = t('welcome.greeting', { username: user.username });
  const p1 = t('welcome.p1');
  const howToStart = t('welcome.howToStart');
  const step1 = t('welcome.step1');
  const step2 = t('welcome.step2');
  const cta = t('welcome.cta');
  const signoff = t('welcome.signoff');
  const team = t('welcome.team');

  const html = emailDocument(
    paragraph(t('welcome.greeting', { username: escapeHtml(user.username) }), {
      strong: true,
    }) +
      paragraph(p1) +
      heading(howToStart) +
      bulletList([step1, step2]) +
      primaryButton(cta, url) +
      signature(signoff, team),
    locale,
    `${url}/logo.jpg`,
  );

  const text = `${greeting}\n\n${p1}\n\n${howToStart}\n- ${step1}\n- ${step2}\n\n${cta}: ${url}\n\n${signoff}\n${team}`;

  await deliver(user.email, t('welcome.subject', { username: user.username }), text, html);
}
