import { adminAuthHeaders } from './portfolioSuggestionsAdmin';

export interface SuggestionBox {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface TopicSummary {
  id: string;
  title: string;
  authorName: string | null;
  createdAt: string;
  lastActivityAt: string;
  replyCount: number;
  excerpt: string;
}

export interface SuggestionReply {
  id: string;
  topicId: string;
  message: string;
  authorName: string | null;
  createdAt: string;
}

export interface TopicDetail {
  id: string;
  boxId: string;
  boxSlug: string;
  boxName: string;
  title: string;
  openingMessage: string;
  authorName: string | null;
  createdAt: string;
  lastActivityAt: string;
  replies: SuggestionReply[];
}

export const DEFAULT_BOX_SLUG = 'portfolio';

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? 'Request failed.';
}

export async function fetchSuggestionBoxes(): Promise<SuggestionBox[]> {
  const res = await fetch('/api/portfolio-suggestions?boxes=1');
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { boxes?: SuggestionBox[] };
  return data.boxes ?? [];
}

export async function fetchTopicsInBox(boxSlug = DEFAULT_BOX_SLUG): Promise<{
  box: SuggestionBox;
  topics: TopicSummary[];
}> {
  const res = await fetch(`/api/portfolio-suggestions?box=${encodeURIComponent(boxSlug)}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as { box: SuggestionBox; topics: TopicSummary[] };
}

export async function fetchTopicDetail(topicId: string): Promise<TopicDetail> {
  const res = await fetch(
    `/api/portfolio-suggestions?topicId=${encodeURIComponent(topicId)}`
  );
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { topic: TopicDetail };
  return data.topic;
}

export async function createTopic(input: {
  boxSlug?: string;
  title: string;
  message: string;
  name?: string;
  website?: string;
}): Promise<TopicDetail> {
  const res = await fetch('/api/portfolio-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'topic', ...input }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { topic: TopicDetail };
  return data.topic;
}

export async function postTopicReply(input: {
  topicId: string;
  message: string;
  name?: string;
  website?: string;
}): Promise<TopicDetail> {
  const res = await fetch('/api/portfolio-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reply', ...input }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { topic: TopicDetail };
  return data.topic;
}

export async function verifyModeratorToken(token: string): Promise<void> {
  const res = await fetch('/api/portfolio-suggestions', {
    method: 'POST',
    headers: adminAuthHeaders(token),
    body: JSON.stringify({ action: 'verify-admin' }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteTopicAsModerator(topicId: string, token: string): Promise<void> {
  const res = await fetch('/api/portfolio-suggestions', {
    method: 'POST',
    headers: adminAuthHeaders(token),
    body: JSON.stringify({ action: 'delete-topic', topicId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteReplyAsModerator(
  replyId: string,
  token: string
): Promise<TopicDetail> {
  const res = await fetch('/api/portfolio-suggestions', {
    method: 'POST',
    headers: adminAuthHeaders(token),
    body: JSON.stringify({ action: 'delete-reply', replyId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { topic: TopicDetail };
  return data.topic;
}

function rtfSupported(): boolean {
  return typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';
}

export function formatSuggestionWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (rtfSupported()) {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (absSec < 60) return rtf.format(diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 48) return rtf.format(diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    if (Math.abs(diffDay) < 14) return rtf.format(diffDay, 'day');
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function displayAuthor(name: string | null | undefined): string {
  return name?.trim() || 'Anonymous';
}
