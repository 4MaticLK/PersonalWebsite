import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { getSuggestionBoxDefinition } from '../../data/suggestionBoxes';
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  storeAdminToken,
} from '../../utils/portfolioSuggestionsAdmin';
import {
  createTopic,
  deleteReplyAsModerator,
  deleteTopicAsModerator,
  displayAuthor,
  fetchTopicDetail,
  fetchTopicsInBox,
  formatSuggestionWhen,
  postTopicReply,
  verifyModeratorToken,
  type SuggestionBox,
  type TopicDetail,
  type TopicSummary,
} from '../../utils/portfolioSuggestions';

type PanelView = 'list' | 'topic' | 'new-topic';

function AuthorMeta({
  name,
  createdAt,
  label,
  onDelete,
  deleteLabel,
}: {
  name: string | null;
  createdAt: string;
  label?: string;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <header className="personal-portfolio__suggestion-meta">
      <span className="personal-portfolio__suggestion-author">
        {label ? `${label} · ` : ''}
        {displayAuthor(name)}
      </span>
      <div className="personal-portfolio__suggestion-meta-actions">
        <time
          className="personal-portfolio__suggestion-time"
          dateTime={createdAt}
          title={new Date(createdAt).toLocaleString()}
        >
          {formatSuggestionWhen(createdAt)}
        </time>
        {onDelete && (
          <button
            type="button"
            className="personal-portfolio__suggestion-delete"
            onClick={onDelete}
          >
            {deleteLabel ?? 'Delete'}
          </button>
        )}
      </div>
    </header>
  );
}

function HoneypotInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="personal-portfolio__suggestions-honeypot" aria-hidden="true">
      Website
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function PortfolioSuggestionsPanel({ boxSlug }: { boxSlug: string }) {
  const fallbackBox = getSuggestionBoxDefinition(boxSlug);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>('list');
  const [box, setBox] = useState<SuggestionBox | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [showModeratorPrompt, setShowModeratorPrompt] = useState(false);
  const [moderatorTokenInput, setModeratorTokenInput] = useState('');
  const [moderatorError, setModeratorError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const titleId = useId();
  const messageId = useId();
  const moderatorTokenId = useId();

  useEffect(() => {
    setIsModerator(Boolean(getStoredAdminToken()));
  }, []);

  const resetForms = useCallback(() => {
    setTitle('');
    setMessage('');
    setWebsite('');
    setError(null);
  }, []);

  const loadTopicList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopicsInBox(boxSlug);
      setBox(data.box);
      setTopics(data.topics);
    } catch {
      setError('Could not load conversations right now.');
    } finally {
      setLoading(false);
    }
  }, [boxSlug]);

  const loadTopic = useCallback(async (topicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchTopicDetail(topicId);
      setTopic(detail);
    } catch {
      setError('Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (view === 'list') void loadTopicList();
  }, [open, view, loadTopicList]);

  useEffect(() => {
    if (!open || view !== 'topic' || !selectedTopicId) return;
    if (topic?.id === selectedTopicId && topic.openingMessage) return;
    void loadTopic(selectedTopicId);
  }, [open, view, selectedTopicId, topic?.id, topic?.openingMessage, loadTopic]);

  useEffect(() => {
    if (!open || view !== 'topic' || !threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [open, view, topic?.replies.length]);

  useEffect(() => {
    if (!open) {
      setView('list');
      setSelectedTopicId(null);
      setTopic(null);
      resetForms();
    }
  }, [open, resetForms]);

  function openTopic(topicId: string) {
    resetForms();
    setTopic(null);
    setSelectedTopicId(topicId);
    setView('topic');
  }

  function backToList() {
    resetForms();
    setSelectedTopicId(null);
    setTopic(null);
    setView('list');
  }

  function startNewTopic() {
    resetForms();
    setView('new-topic');
  }

  async function handleCreateTopic(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || !title.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await createTopic({
        boxSlug,
        title: title.trim(),
        message: message.trim(),
        name: name.trim() || undefined,
        website,
      });
      setSelectedTopicId(created.id);
      setTopic(created);
      setView('topic');
      resetForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start conversation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || !topic || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await postTopicReply({
        topicId: topic.id,
        message: message.trim(),
        name: name.trim() || undefined,
        website,
      });
      setTopic(updated);
      setMessage('');
      setWebsite('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post reply.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlockModerator(event: React.FormEvent) {
    event.preventDefault();
    const token = moderatorTokenInput.trim();
    if (!token) return;

    setModeratorError(null);
    setSubmitting(true);
    try {
      await verifyModeratorToken(token);
      storeAdminToken(token);
      setIsModerator(true);
      setShowModeratorPrompt(false);
      setModeratorTokenInput('');
    } catch (err) {
      setModeratorError(
        err instanceof Error
          ? err.message
          : 'That moderation key did not work. Check .env.local and restart npm run dev.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function signOutModerator() {
    clearStoredAdminToken();
    setIsModerator(false);
    setShowModeratorPrompt(false);
    setModeratorTokenInput('');
    setModeratorError(null);
  }

  async function handleDeleteTopic(topicId: string, topicTitle: string) {
    const token = getStoredAdminToken();
    if (!token) return;
    if (!window.confirm(`Delete the whole conversation “${topicTitle}”?`)) return;

    setSubmitting(true);
    setError(null);
    try {
      await deleteTopicAsModerator(topicId, token);
      if (selectedTopicId === topicId) backToList();
      else await loadTopicList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete conversation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    const token = getStoredAdminToken();
    if (!token || !topic) return;
    if (!window.confirm('Delete this reply?')) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await deleteReplyAsModerator(replyId, token);
      setTopic(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete reply.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCurrentTopic() {
    if (!topic) return;
    await handleDeleteTopic(topic.id, topic.title);
  }

  const panelTitle =
    view === 'new-topic'
      ? 'Start a conversation'
      : view === 'topic' && topic?.title
        ? topic.title
        : box?.name ?? fallbackBox?.name ?? 'Suggestions';

  const boxName = box?.name ?? fallbackBox?.name ?? 'Suggestions';
  const boxDescription =
    box?.description ??
    fallbackBox?.description ??
    'Start a topic or join an existing conversation.';

  return (
    <section
      className={`personal-portfolio__suggestions ${open ? 'personal-portfolio__suggestions--open' : ''}`}
      aria-labelledby={`portfolio-suggestions-heading-${boxSlug}`}
    >
      <div className="personal-portfolio__suggestions-bar">
        <div className="personal-portfolio__suggestions-intro">
          <h2
            id={`portfolio-suggestions-heading-${boxSlug}`}
            className="personal-portfolio__suggestions-title"
          >
            {boxName}
          </h2>
          <p className="personal-portfolio__suggestions-lead">{boxDescription}</p>
        </div>
        <button
          type="button"
          className="personal-portfolio__suggestions-toggle"
          aria-expanded={open}
          aria-controls={`portfolio-suggestions-panel-${boxSlug}`}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'Hide conversations' : 'Leave a suggestion'}
        </button>
      </div>

      {open && (
        <div
          id={`portfolio-suggestions-panel-${boxSlug}`}
          className="personal-portfolio__suggestions-panel"
        >
          <div className="personal-portfolio__suggestions-toolbar">
            {view !== 'list' ? (
              <button
                type="button"
                className="personal-portfolio__suggestions-back"
                onClick={backToList}
              >
                ← All conversations
              </button>
            ) : (
              <span className="personal-portfolio__suggestions-context">{panelTitle}</span>
            )}
            {view === 'list' && (
              <button
                type="button"
                className="personal-portfolio__suggestions-new"
                onClick={startNewTopic}
              >
                Start a topic
              </button>
            )}
            {view === 'topic' && isModerator && topic?.title && (
              <button
                type="button"
                className="personal-portfolio__suggestion-delete personal-portfolio__suggestion-delete--toolbar"
                onClick={() => void handleDeleteCurrentTopic()}
                disabled={submitting}
              >
                Delete conversation
              </button>
            )}
          </div>

          {view === 'list' && (
            <div className="personal-portfolio__suggestions-list" aria-live="polite" aria-busy={loading}>
              {loading && topics.length === 0 && (
                <p className="personal-portfolio__suggestions-empty">Loading conversations…</p>
              )}
              {!loading && topics.length === 0 && (
                <p className="personal-portfolio__suggestions-empty">
                  No conversations yet — start the first topic.
                </p>
              )}
              {topics.map((item) => (
                <div key={item.id} className="personal-portfolio__topic-row-wrap">
                  <button
                    type="button"
                    className="personal-portfolio__topic-row"
                    onClick={() => openTopic(item.id)}
                  >
                    <span className="personal-portfolio__topic-row-title">{item.title}</span>
                    <span className="personal-portfolio__topic-row-excerpt">{item.excerpt}</span>
                    <span className="personal-portfolio__topic-row-meta">
                      {displayAuthor(item.authorName)} ·{' '}
                      {item.replyCount === 0
                        ? 'No replies'
                        : `${item.replyCount} ${item.replyCount === 1 ? 'reply' : 'replies'}`}{' '}
                      · active {formatSuggestionWhen(item.lastActivityAt)}
                    </span>
                  </button>
                  {isModerator && (
                    <button
                      type="button"
                      className="personal-portfolio__suggestion-delete personal-portfolio__suggestion-delete--row"
                      onClick={() => void handleDeleteTopic(item.id, item.title)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {view === 'new-topic' && (
            <form className="personal-portfolio__suggestions-form" onSubmit={handleCreateTopic}>
              <HoneypotInput value={website} onChange={setWebsite} />
              <div className="personal-portfolio__suggestions-fields">
                <label className="personal-portfolio__suggestions-label" htmlFor={nameId}>
                  Name <span className="personal-portfolio__suggestions-optional">(optional)</span>
                </label>
                <input
                  id={nameId}
                  className="personal-portfolio__suggestions-input"
                  type="text"
                  maxLength={40}
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="personal-portfolio__suggestions-fields">
                <label className="personal-portfolio__suggestions-label" htmlFor={titleId}>
                  Topic title
                </label>
                <input
                  id={titleId}
                  className="personal-portfolio__suggestions-input"
                  type="text"
                  maxLength={120}
                  placeholder="What is this conversation about?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="personal-portfolio__suggestions-fields">
                <label className="personal-portfolio__suggestions-label" htmlFor={messageId}>
                  Opening message
                </label>
                <textarea
                  id={messageId}
                  className="personal-portfolio__suggestions-textarea"
                  rows={4}
                  maxLength={500}
                  placeholder="Share the idea, question, or feedback that starts this thread."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              {error && (
                <p className="personal-portfolio__suggestions-error" role="alert">
                  {error}
                </p>
              )}
              <div className="personal-portfolio__suggestions-actions">
                <span className="personal-portfolio__suggestions-count">
                  {message.length}/500
                </span>
                <button
                  type="submit"
                  className="personal-portfolio__suggestions-submit"
                  disabled={submitting || !title.trim() || !message.trim()}
                >
                  {submitting ? 'Creating…' : 'Create topic'}
                </button>
              </div>
            </form>
          )}

          {view === 'topic' && (
            <>
              {loading && !topic?.openingMessage && (
                <p className="personal-portfolio__suggestions-empty">Loading conversation…</p>
              )}
              {topic?.openingMessage && (
                <>
                  <div
                    ref={threadRef}
                    className="personal-portfolio__suggestions-thread"
                    aria-live="polite"
                  >
                    <article className="personal-portfolio__suggestion personal-portfolio__suggestion--opening">
                      <AuthorMeta
                        name={topic.authorName}
                        createdAt={topic.createdAt}
                        label="Started by"
                        onDelete={
                          isModerator ? () => void handleDeleteCurrentTopic() : undefined
                        }
                        deleteLabel="Delete conversation"
                      />
                      <p className="personal-portfolio__suggestion-message">{topic.openingMessage}</p>
                    </article>
                    {topic.replies.map((reply) => (
                      <article key={reply.id} className="personal-portfolio__suggestion">
                        <AuthorMeta
                          name={reply.authorName}
                          createdAt={reply.createdAt}
                          onDelete={
                            isModerator ? () => void handleDeleteReply(reply.id) : undefined
                          }
                        />
                        <p className="personal-portfolio__suggestion-message">{reply.message}</p>
                      </article>
                    ))}
                  </div>

                  <form className="personal-portfolio__suggestions-form" onSubmit={handleReply}>
                    <HoneypotInput value={website} onChange={setWebsite} />
                    <div className="personal-portfolio__suggestions-fields">
                      <label className="personal-portfolio__suggestions-label" htmlFor={nameId}>
                        Name{' '}
                        <span className="personal-portfolio__suggestions-optional">(optional)</span>
                      </label>
                      <input
                        id={nameId}
                        className="personal-portfolio__suggestions-input"
                        type="text"
                        maxLength={40}
                        placeholder="Your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="personal-portfolio__suggestions-fields">
                      <label className="personal-portfolio__suggestions-label" htmlFor={messageId}>
                        Reply
                      </label>
                      <textarea
                        id={messageId}
                        className="personal-portfolio__suggestions-textarea"
                        rows={3}
                        maxLength={500}
                        placeholder="Add to this conversation…"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    {error && (
                      <p className="personal-portfolio__suggestions-error" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="personal-portfolio__suggestions-actions">
                      <span className="personal-portfolio__suggestions-count">
                        {message.length}/500
                      </span>
                      <button
                        type="submit"
                        className="personal-portfolio__suggestions-submit"
                        disabled={submitting || !message.trim()}
                      >
                        {submitting ? 'Posting…' : 'Post reply'}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {error && !topic?.openingMessage && (
                <p className="personal-portfolio__suggestions-error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}

          <div className="personal-portfolio__suggestions-moderation">
            {isModerator ? (
              <>
                <span className="personal-portfolio__suggestions-moderation-status">
                  Moderation enabled on this device
                </span>
                <button
                  type="button"
                  className="personal-portfolio__suggestions-moderation-btn"
                  onClick={signOutModerator}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="personal-portfolio__suggestions-moderation-btn"
                onClick={() => {
                  setShowModeratorPrompt((prev) => !prev);
                  setModeratorError(null);
                }}
              >
                {showModeratorPrompt ? 'Cancel' : 'Moderate'}
              </button>
            )}
          </div>

          {showModeratorPrompt && !isModerator && (
            <form
              className="personal-portfolio__suggestions-moderation-form"
              onSubmit={handleUnlockModerator}
            >
              <label className="personal-portfolio__suggestions-label" htmlFor={moderatorTokenId}>
                Moderation key
              </label>
              <input
                id={moderatorTokenId}
                className="personal-portfolio__suggestions-input"
                type="password"
                autoComplete="off"
                placeholder="Enter your private moderation key"
                value={moderatorTokenInput}
                onChange={(event) => setModeratorTokenInput(event.target.value)}
                disabled={submitting}
              />
              {moderatorError && (
                <p className="personal-portfolio__suggestions-error" role="alert">
                  {moderatorError}
                </p>
              )}
              <button
                type="submit"
                className="personal-portfolio__suggestions-submit"
                disabled={submitting || !moderatorTokenInput.trim()}
              >
                {submitting ? 'Checking…' : 'Unlock moderation'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
