import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { list, put } from '@vercel/blob';
import {
  CANONICAL_SUGGESTION_BOXES,
  LEGACY_PORTFOLIO_BOX_SLUG,
  getSuggestionBoxDefinition,
} from './_suggestionBoxes';

export interface SuggestionBox {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface SuggestionTopic {
  id: string;
  boxId: string;
  title: string;
  openingMessage: string;
  authorName: string | null;
  createdAt: string;
  lastActivityAt: string;
}

export interface SuggestionReply {
  id: string;
  topicId: string;
  message: string;
  authorName: string | null;
  createdAt: string;
}

export interface SuggestionsStore {
  version: 2;
  boxes: SuggestionBox[];
  topics: SuggestionTopic[];
  replies: SuggestionReply[];
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

/** Default box slug when none is specified. */
export const DEFAULT_SUGGESTION_BOX_SLUG = 'portfolio';

const PORTFOLIO_BOX_DEF =
  getSuggestionBoxDefinition(DEFAULT_SUGGESTION_BOX_SLUG) ?? CANONICAL_SUGGESTION_BOXES[1]!;

/** @deprecated Use box slug `portfolio` instead. */
export const DEFAULT_SUGGESTION_BOX: SuggestionBox = { ...PORTFOLIO_BOX_DEF };

const LOCAL_PATH = join(process.cwd(), 'data', 'portfolio-suggestions.json');
const BLOB_PATHNAME = 'portfolio-suggestions/data.json';

interface LegacySuggestion {
  id: string;
  message: string;
  name: string | null;
  createdAt: string;
}

function emptyStore(): SuggestionsStore {
  return {
    version: 2,
    boxes: CANONICAL_SUGGESTION_BOXES.map((box) => ({ ...box })),
    topics: [],
    replies: [],
  };
}

function syncCanonicalBoxes(store: SuggestionsStore): SuggestionsStore {
  for (const def of CANONICAL_SUGGESTION_BOXES) {
    const existing = store.boxes.find((box) => box.slug === def.slug || box.id === def.id);
    if (existing) {
      existing.id = def.id;
      existing.slug = def.slug;
      existing.name = def.name;
      existing.description = def.description;
      existing.sortOrder = def.sortOrder;
    } else {
      store.boxes.push({ ...def });
    }
  }

  const legacy = store.boxes.find((box) => box.slug === LEGACY_PORTFOLIO_BOX_SLUG);
  const portfolio = store.boxes.find((box) => box.slug === DEFAULT_SUGGESTION_BOX_SLUG);
  if (legacy && portfolio && legacy.id !== portfolio.id) {
    for (const topic of store.topics) {
      if (topic.boxId === legacy.id) topic.boxId = portfolio.id;
    }
    store.boxes = store.boxes.filter((box) => box.id !== legacy.id);
  } else if (legacy && !portfolio) {
    legacy.id = PORTFOLIO_BOX_DEF.id;
    legacy.slug = PORTFOLIO_BOX_DEF.slug;
    legacy.name = PORTFOLIO_BOX_DEF.name;
    legacy.description = PORTFOLIO_BOX_DEF.description;
    legacy.sortOrder = PORTFOLIO_BOX_DEF.sortOrder;
  }

  store.boxes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return store;
}

function deriveTitle(message: string): string {
  const firstLine = message.split('\n').find((line) => line.trim())?.trim() ?? message.trim();
  if (firstLine.length <= 100) return firstLine;
  return `${firstLine.slice(0, 97).trimEnd()}…`;
}

function normalizeStore(raw: unknown): SuggestionsStore {
  if (raw && typeof raw === 'object' && 'version' in raw && (raw as SuggestionsStore).version === 2) {
    return syncCanonicalBoxes(raw as SuggestionsStore);
  }

  if (Array.isArray(raw)) {
    const topics: SuggestionTopic[] = raw.map((item) => {
      const legacy = item as LegacySuggestion;
      const createdAt = legacy.createdAt ?? new Date().toISOString();
      return {
        id: legacy.id ?? crypto.randomUUID(),
        boxId: PORTFOLIO_BOX_DEF.id,
        title: deriveTitle(legacy.message ?? 'Untitled suggestion'),
        openingMessage: legacy.message ?? '',
        authorName: legacy.name ?? null,
        createdAt,
        lastActivityAt: createdAt,
      };
    });
    return syncCanonicalBoxes({
      version: 2,
      boxes: CANONICAL_SUGGESTION_BOXES.map((box) => ({ ...box })),
      topics,
      replies: [],
    });
  }

  return emptyStore();
}

function readLocalStore(): SuggestionsStore {
  if (!existsSync(LOCAL_PATH)) return emptyStore();
  try {
    return normalizeStore(JSON.parse(readFileSync(LOCAL_PATH, 'utf8')) as unknown);
  } catch {
    return emptyStore();
  }
}

function writeLocalStore(store: SuggestionsStore): void {
  mkdirSync(dirname(LOCAL_PATH), { recursive: true });
  writeFileSync(LOCAL_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

async function readBlobStore(): Promise<SuggestionsStore> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return readLocalStore();

  const { blobs } = await list({ prefix: 'portfolio-suggestions/', token });
  const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME) ?? blobs[0];
  if (!blob?.url) return emptyStore();

  const res = await fetch(blob.url);
  if (!res.ok) return emptyStore();

  try {
    return normalizeStore(await res.json());
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: SuggestionsStore): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const body = JSON.stringify(store, null, 2);

  if (!token) {
    writeLocalStore(store);
    return;
  }

  await put(BLOB_PATHNAME, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  });
}

async function loadStore(): Promise<SuggestionsStore> {
  return process.env.BLOB_READ_WRITE_TOKEN ? readBlobStore() : readLocalStore();
}

function sanitizeName(name?: string | null): string | null {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 40) : null;
}

function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

function replyCountFor(store: SuggestionsStore, topicId: string): number {
  return store.replies.filter((r) => r.topicId === topicId).length;
}

function findBox(store: SuggestionsStore, slug: string): SuggestionBox | null {
  return store.boxes.find((b) => b.slug === slug) ?? null;
}

export async function listSuggestionBoxes(): Promise<SuggestionBox[]> {
  const store = await loadStore();
  return [...store.boxes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function listTopicsInBox(boxSlug: string): Promise<{
  box: SuggestionBox;
  topics: TopicSummary[];
}> {
  const store = await loadStore();
  const box = findBox(store, boxSlug);
  if (!box) throw new Error('Box not found.');

  const topics = store.topics
    .filter((t) => t.boxId === box.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      authorName: t.authorName,
      createdAt: t.createdAt,
      lastActivityAt: t.lastActivityAt,
      replyCount: replyCountFor(store, t.id),
      excerpt: excerpt(t.openingMessage),
    }))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

  return { box, topics };
}

export async function getTopicDetail(topicId: string): Promise<TopicDetail> {
  const store = await loadStore();
  const topic = store.topics.find((t) => t.id === topicId);
  if (!topic) throw new Error('Topic not found.');

  const box = store.boxes.find((b) => b.id === topic.boxId);
  if (!box) throw new Error('Box not found.');

  const replies = store.replies
    .filter((r) => r.topicId === topicId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    id: topic.id,
    boxId: topic.boxId,
    boxSlug: box.slug,
    boxName: box.name,
    title: topic.title,
    openingMessage: topic.openingMessage,
    authorName: topic.authorName,
    createdAt: topic.createdAt,
    lastActivityAt: topic.lastActivityAt,
    replies,
  };
}

export async function createSuggestionTopic(input: {
  boxSlug?: string;
  title: string;
  message: string;
  name?: string | null;
}): Promise<TopicDetail> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title) throw new Error('Title is required.');
  if (!message) throw new Error('Message is required.');
  if (title.length > 120) throw new Error('Title must be 120 characters or fewer.');
  if (message.length > 500) throw new Error('Message must be 500 characters or fewer.');

  const store = await loadStore();
  const box = findBox(store, input.boxSlug?.trim() || DEFAULT_SUGGESTION_BOX_SLUG);
  if (!box) throw new Error('Box not found.');

  const now = new Date().toISOString();
  const topic: SuggestionTopic = {
    id: crypto.randomUUID(),
    boxId: box.id,
    title,
    openingMessage: message,
    authorName: sanitizeName(input.name),
    createdAt: now,
    lastActivityAt: now,
  };

  store.topics.push(topic);
  await writeStore(store);
  return getTopicDetail(topic.id);
}

export async function addSuggestionReply(input: {
  topicId: string;
  message: string;
  name?: string | null;
}): Promise<TopicDetail> {
  const message = input.message.trim();
  if (!message) throw new Error('Message is required.');
  if (message.length > 500) throw new Error('Message must be 500 characters or fewer.');

  const store = await loadStore();
  const topic = store.topics.find((t) => t.id === input.topicId);
  if (!topic) throw new Error('Topic not found.');

  const now = new Date().toISOString();
  const reply: SuggestionReply = {
    id: crypto.randomUUID(),
    topicId: topic.id,
    message,
    authorName: sanitizeName(input.name),
    createdAt: now,
  };

  store.replies.push(reply);
  topic.lastActivityAt = now;
  await writeStore(store);
  return getTopicDetail(topic.id);
}

function assertAdmin(adminToken: string | null | undefined): void {
  const expected = process.env.PORTFOLIO_SUGGESTIONS_ADMIN_TOKEN?.trim();
  if (!expected) throw new Error('Moderation is not configured on the server.');
  if (!adminToken?.trim() || adminToken.trim() !== expected) {
    throw new Error('Not authorized to moderate suggestions.');
  }
}

export function extractAdminToken(
  body: Record<string, unknown>,
  authHeader?: string | string[]
): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  if (typeof body.adminToken === 'string') return body.adminToken.trim();
  return null;
}

export function verifyAdminToken(adminToken: string | null | undefined): boolean {
  try {
    assertAdmin(adminToken);
    return true;
  } catch {
    return false;
  }
}

function refreshTopicActivity(store: SuggestionsStore, topic: SuggestionTopic): void {
  const replyTimes = store.replies
    .filter((r) => r.topicId === topic.id)
    .map((r) => r.createdAt);
  topic.lastActivityAt = replyTimes.length
    ? replyTimes.sort().at(-1)!
    : topic.createdAt;
}

export async function deleteSuggestionTopic(
  topicId: string,
  adminToken: string | null | undefined
): Promise<void> {
  assertAdmin(adminToken);

  const store = await loadStore();
  const index = store.topics.findIndex((t) => t.id === topicId);
  if (index < 0) throw new Error('Topic not found.');

  store.topics.splice(index, 1);
  store.replies = store.replies.filter((r) => r.topicId !== topicId);
  await writeStore(store);
}

export async function deleteSuggestionReply(
  replyId: string,
  adminToken: string | null | undefined
): Promise<TopicDetail> {
  assertAdmin(adminToken);

  const store = await loadStore();
  const reply = store.replies.find((r) => r.id === replyId);
  if (!reply) throw new Error('Reply not found.');

  const topic = store.topics.find((t) => t.id === reply.topicId);
  if (!topic) throw new Error('Topic not found.');

  store.replies = store.replies.filter((r) => r.id !== replyId);
  refreshTopicActivity(store, topic);
  await writeStore(store);
  return getTopicDetail(topic.id);
}

export async function handleSuggestionsGet(query: Record<string, string | undefined>) {
  if (query.boxes === '1') {
    const boxes = await listSuggestionBoxes();
    return { boxes };
  }

  const topicId = query.topicId?.trim();
  if (topicId) {
    const topic = await getTopicDetail(topicId);
    return { topic };
  }

  const boxSlug = query.box?.trim() || DEFAULT_SUGGESTION_BOX_SLUG;
  return listTopicsInBox(boxSlug);
}

export async function handleSuggestionsPost(
  body: Record<string, unknown>,
  authHeader?: string | string[]
) {
  if (typeof body.website === 'string' && body.website.trim()) {
    return { ok: true as const };
  }

  const action = typeof body.action === 'string' ? body.action : 'topic';
  const adminToken = extractAdminToken(body, authHeader);

  if (action === 'verify-admin') {
    assertAdmin(adminToken);
    return { ok: true as const };
  }

  if (action === 'delete-topic') {
    const topicId = typeof body.topicId === 'string' ? body.topicId : '';
    await deleteSuggestionTopic(topicId, adminToken);
    return { ok: true as const };
  }

  if (action === 'delete-reply') {
    const replyId = typeof body.replyId === 'string' ? body.replyId : '';
    const topic = await deleteSuggestionReply(replyId, adminToken);
    return { topic };
  }

  const name = typeof body.name === 'string' ? body.name : null;

  if (action === 'reply') {
    const topicId = typeof body.topicId === 'string' ? body.topicId : '';
    const message = typeof body.message === 'string' ? body.message : '';
    const topic = await addSuggestionReply({ topicId, message, name });
    return { topic };
  }

  const boxSlug = typeof body.boxSlug === 'string' ? body.boxSlug : undefined;
  const title = typeof body.title === 'string' ? body.title : '';
  const message = typeof body.message === 'string' ? body.message : '';
  const topic = await createSuggestionTopic({ boxSlug, title, message, name });
  return { topic };
}
