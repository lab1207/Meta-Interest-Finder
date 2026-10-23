import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Interest = {
  id: string;
  name: string;
  path: string[];
  audienceMin: number;
  audienceMax: number;
};

type SearchResponse = {
  data?: Interest[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { code?: string; message?: string };
};

type Sort = "relevance" | "name" | "audience";

const SAVED_KEY = "interest-ledger:saved:v1";
const TOKEN_KEY = "interest-ledger:token:v1";
const SUGGESTIONS = [
  "sourdough",
  "trail running",
  "mechanical keyboards",
  "interior design",
  "indie film",
];

const numberFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function compact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return numberFormat.format(value).toLowerCase();
}

function audienceRange(interest: Interest): string {
  const low = interest.audienceMin || 0;
  const high = interest.audienceMax || 0;
  if (low && high && low !== high) return `${compact(low)}–${compact(high)}`;
  if (high) return `${compact(high)}+`;
  if (low) return `${compact(low)}+`;
  return "Not returned";
}

function audienceValue(interest: Interest): number {
  return interest.audienceMax || interest.audienceMin || 0;
}

function readSaved(): Interest[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Interest =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as Interest).id === "string" &&
        typeof (item as Interest).name === "string",
    );
  } catch {
    return [];
  }
}

function readSessionToken(): string {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(rows: Interest[]): void {
  const lines = [
    ["id", "name", "path", "audience_min", "audience_max"],
    ...rows.map((row) => [
      row.id,
      row.name,
      row.path.join(" > "),
      row.audienceMin,
      row.audienceMax,
    ]),
  ];
  const csv = lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `interest-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 2.5h8v11L8 11l-4 2.5z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState<Interest[]>([]);
  const [pagingAfter, setPagingAfter] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverToken, setServerToken] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [token, setToken] = useState(readSessionToken);
  const [tokenDraft, setTokenDraft] = useState("");
  const [saved, setSaved] = useState<Interest[]>(readSaved);
  const [sort, setSort] = useState<Sort>("relevance");
  const [minAudience, setMinAudience] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasToken = serverToken || Boolean(token);

  useEffect(() => {
    let active = true;
    fetch("/api/status")
      .then(async (response) => {
        if (!response.ok) throw new Error("status unavailable");
        return (await response.json()) as { serverToken?: boolean };
      })
      .then((payload) => {
        if (active) setServerToken(Boolean(payload.serverToken));
      })
      .catch(() => {
        // The BYOK path still works if the status endpoint is unavailable
        // during local Vite development.
      })
      .finally(() => {
        if (active) setStatusChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      // Saving is optional if storage is blocked.
    }
  }, [saved]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        document.getElementById("interest-query")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleResults = useMemo(() => {
    let rows = [...results];
    if (minAudience > 0) {
      rows = rows.filter((row) => audienceValue(row) >= minAudience);
    }
    if (sort === "name") {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "audience") {
      rows.sort((a, b) => audienceValue(b) - audienceValue(a));
    }
    return rows;
  }, [results, minAudience, sort]);

  const maxAudience = useMemo(
    () =>
      Math.max(
        1,
        ...visibleResults.map((interest) => audienceValue(interest)),
      ),
    [visibleResults],
  );

  const savedIds = useMemo(
    () => new Set(saved.map((interest) => interest.id)),
    [saved],
  );

  const runSearch = async (term: string, after?: string) => {
    const q = term.trim();
    if (!q) {
      setError("Enter a word or phrase to search Meta interests.");
      return;
    }
    if (!hasToken) {
      setError(
        "Add a Meta Graph access token below. The page does not ship with one.",
      );
      tokenRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/interests", window.location.origin);
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "50");
      if (after) url.searchParams.set("after", after);

      const headers: Record<string, string> = { accept: "application/json" };
      if (token) headers["x-meta-token"] = token;

      const response = await fetch(url, { headers });
      const payload = (await response.json()) as SearchResponse;

      if (!response.ok) {
        if (payload.error?.code === "invalid_token" && token) {
          setToken("");
          window.sessionStorage.removeItem(TOKEN_KEY);
        }
        throw new Error(
          payload.error?.message || `The search failed (${response.status}).`,
        );
      }

      const next = payload.data ?? [];
      setResults((current) => (after ? [...current, ...next] : next));
      setPagingAfter(payload.paging?.cursors?.after);
      setLastQuery(q);
      setHasSearched(true);

      if (!after) {
        window.requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The interest search failed.",
      );
      if (!after) {
        setResults([]);
        setPagingAfter(undefined);
        setHasSearched(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query);
  };

  const saveToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = tokenDraft.trim();
    if (!next) {
      setError("Paste a Meta Graph access token first.");
      tokenRef.current?.focus();
      return;
    }
    setToken(next);
    try {
      window.sessionStorage.setItem(TOKEN_KEY, next);
    } catch {
      // Session storage is optional.
    }
    setTokenDraft("");
    setError(null);
    setNotice("Token saved for this browser tab.");
  };

  const forgetToken = () => {
    setToken("");
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Session storage is optional.
    }
    setNotice("Session token removed.");
  };

  const toggleSaved = (interest: Interest) => {
    setSaved((current) =>
      current.some((item) => item.id === interest.id)
        ? current.filter((item) => item.id !== interest.id)
        : [...current, interest],
    );
  };

  const removeSaved = (id: string) => {
    setSaved((current) => current.filter((item) => item.id !== id));
  };

  const copyIds = async (rows: Interest[], label: string) => {
    if (!rows.length) {
      setNotice(`There are no ${label} to copy.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(rows.map((row) => row.id).join("\n"));
      setNotice(`${rows.length} interest IDs copied.`);
    } catch {
      setNotice("Clipboard access is unavailable here.");
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setNotice("Clipboard access is unavailable here.");
    }
  };

  const origin =
    typeof window === "undefined" ? "https://your-site.pages.dev" : window.location.origin;
  const endpoint = `${origin}/mcp`;
  const curlExample = `curl -X POST "${endpoint}" \\
  -H "content-type: application/json" \\
  -H "x-meta-token: $META_TOKEN" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  const useSuggestion = (term: string) => {
    setQuery(term);
    if (!hasToken) {
      setError(
        "Add a Meta Graph access token below, then search again. The page does not ship with one.",
      );
      tokenRef.current?.focus();
      return;
    }
    void runSearch(term);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Interest Ledger home">
          <span className="wordmark-mark" aria-hidden="true" />
          <span>INTEREST</span>
          <span className="wordmark-slash">/</span>
          <span>LEDGER</span>
        </a>
        <p className="topbar-note">Meta ad interests, filed cleanly</p>
        <nav className="topbar-links" aria-label="Primary">
          <a href="#mcp">MCP</a>
          <a href="#method">Method</a>
          <a
            href="https://github.com/lab1207/Meta-Interest-Finder"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-rule" aria-hidden="true" />
              Audience research / field ledger
            </p>
            <h1 id="hero-title">
              Find the audience
              <br />
              behind the <em>idea.</em>
            </h1>
            <p className="hero-lede">
              Search Meta&apos;s advertising interests, compare audience ranges,
              and keep a shortlist you can act on. No token is baked into this
              page.
            </p>
          </div>

          <aside className="access-panel" aria-labelledby="access-title">
            <div className="access-head">
              <span id="access-title">Access / Meta Graph</span>
              <span
                className={`access-light${
                  hasToken && statusChecked ? " is-live" : ""
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="access-body">
              {!statusChecked ? (
                <p className="access-copy">Checking deployment credentials…</p>
              ) : serverToken ? (
                <>
                  <p className="access-state">
                    <span className="state-dot" aria-hidden="true" />
                    Server token connected
                  </p>
                  <p className="access-copy">
                    The deployment has a server-side <code>META_TOKEN</code>.
                    This browser never sees it.
                  </p>
                </>
              ) : token ? (
                <>
                  <p className="access-state">
                    <span className="state-dot" aria-hidden="true" />
                    Session token active
                  </p>
                  <p className="access-copy">
                    Your token is stored in sessionStorage for this tab only. It
                    is sent only to this app&apos;s API, which forwards it to
                    Meta.
                  </p>
                  <button
                    className="text-button"
                    type="button"
                    onClick={forgetToken}
                  >
                    Forget session token
                  </button>
                </>
              ) : (
                <>
                  <p className="access-copy">
                    Bring your own Meta Graph access token with permission to
                    read ad interests. It stays in this tab.
                  </p>
                  <form className="token-form" onSubmit={saveToken}>
                    <label className="visually-hidden" htmlFor="meta-token">
                      Meta Graph access token
                    </label>
                    <input
                      ref={tokenRef}
                      id="meta-token"
                      type="password"
                      value={tokenDraft}
                      onChange={(event) => setTokenDraft(event.target.value)}
                      placeholder="Paste access token"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button className="mini-button solid" type="submit">
                      Use token
                    </button>
                  </form>
                  <p className="access-note">
                    Stored in sessionStorage, never in the page source.{" "}
                    <a
                      href="https://developers.facebook.com/docs/marketing-apis/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Token help ↗
                    </a>
                  </p>
                </>
              )}
            </div>
          </aside>
        </section>

        <section className="search-section" aria-labelledby="search-title">
          <div className="search-heading">
            <h2 id="search-title">Search the interest graph.</h2>
            <p>
              Try a product, hobby, or audience. Results are live from the Meta
              Graph API when a token is connected.
            </p>
          </div>
          <form className="search-form" onSubmit={handleSubmit}>
            <span className="search-prefix" aria-hidden="true">
              Q
            </span>
            <label className="visually-hidden" htmlFor="interest-query">
              Search Meta interests
            </label>
            <input
              id="interest-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="sourdough, trail running, interior design…"
              autoComplete="off"
              aria-keyshortcuts="/"
              title="Press / to focus the search"
            />
            <button className="search-button" type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search interests"}
              <ArrowIcon />
            </button>
          </form>
          <div className="search-status">
            <span
              className={`status-dot${hasToken ? " is-live" : ""}`}
              aria-hidden="true"
            />
            <span>
              {!statusChecked
                ? "Checking access…"
                : serverToken
                  ? "Server token connected / live Graph API"
                  : token
                    ? "Session token active / live Graph API"
                    : "Add a token to search the live Graph API"}
            </span>
            {lastQuery && (
              <span className="search-last">
                Last query / <strong>{lastQuery}</strong>
              </span>
            )}
          </div>
        </section>

        <section className="workspace" ref={resultsRef} aria-labelledby="results-title">
          <div className="results-column">
            <div className="results-heading">
              <div>
                <p className="eyebrow">The result sheet</p>
                <h2 id="results-title">
                  {hasSearched
                    ? `${visibleResults.length} interest${
                        visibleResults.length === 1 ? "" : "s"
                      } on the desk.`
                    : "Start with a word."}
                </h2>
              </div>
              <div className="result-controls">
                <label>
                  <span>Sort</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as Sort)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name">Name</option>
                    <option value="audience">Audience</option>
                  </select>
                </label>
                <label>
                  <span>Floor</span>
                  <select
                    value={minAudience}
                    onChange={(event) =>
                      setMinAudience(Number(event.target.value))
                    }
                  >
                    <option value={0}>Any audience</option>
                    <option value={100000}>100K+</option>
                    <option value={1000000}>1M+</option>
                    <option value={10000000}>10M+</option>
                  </select>
                </label>
              </div>
            </div>

            {error && (
              <div className="error-panel" role="alert">
                <span>Search note</span>
                <p>{error}</p>
              </div>
            )}

            {loading && !results.length ? (
              <div className="skeleton-list" aria-label="Loading results">
                {Array.from({ length: 5 }, (_, index) => (
                  <div className="skeleton-row" key={index}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              visibleResults.length ? (
                <>
                  <div className="result-table" role="table" aria-label="Meta interests">
                    <div className="result-row result-header" role="row">
                      <span role="columnheader">#</span>
                      <span role="columnheader">Interest</span>
                      <span role="columnheader">Audience range</span>
                      <span role="columnheader" className="keep-heading">
                        Keep
                      </span>
                    </div>
                    {visibleResults.map((interest, index) => {
                      const isSaved = savedIds.has(interest.id);
                      const width = Math.max(
                        2,
                        (audienceValue(interest) / maxAudience) * 100,
                      );
                      return (
                        <div
                          className={`result-row${isSaved ? " is-saved" : ""}`}
                          role="row"
                          key={interest.id}
                        >
                          <span className="result-index" role="cell">
                            {String(index + 1).padStart(3, "0")}
                          </span>
                          <span className="result-interest" role="cell">
                            <strong>{interest.name}</strong>
                            <span className="result-path">
                              {interest.path.length
                                ? interest.path.join(" › ")
                                : "Broad interest"}
                            </span>
                            <span className="result-id">ID {interest.id}</span>
                          </span>
                          <span className="result-audience" role="cell">
                            <span>{audienceRange(interest)}</span>
                            <span className="audience-bar" aria-hidden="true">
                              <span style={{ width: `${width}%` }} />
                            </span>
                          </span>
                          <span className="result-keep" role="cell">
                            <button
                              className={`keep-button${
                                isSaved ? " is-saved" : ""
                              }`}
                              type="button"
                              onClick={() => toggleSaved(interest)}
                              aria-pressed={isSaved}
                              aria-label={
                                isSaved
                                  ? `Remove ${interest.name} from shortlist`
                                  : `Add ${interest.name} to shortlist`
                              }
                              title={
                                isSaved
                                  ? "Remove from shortlist"
                                  : "Add to shortlist"
                              }
                            >
                              <BookmarkIcon active={isSaved} />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="result-footer">
                    <div className="result-actions">
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => downloadCsv(visibleResults)}
                      >
                        Export results
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => void copyIds(visibleResults, "results")}
                      >
                        Copy IDs
                      </button>
                    </div>
                    {pagingAfter && (
                      <button
                        className="load-more"
                        type="button"
                        onClick={() => void runSearch(lastQuery, pagingAfter)}
                        disabled={loading}
                      >
                        {loading ? "Loading…" : "Load more"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-results">
                  <span className="empty-index" aria-hidden="true">
                    000
                  </span>
                  <div>
                    <h3>No interests on this page.</h3>
                    <p>
                      Try a broader phrase, raise the audience floor, or search
                      a related term. Meta returns the interests it has indexed
                      for the token&apos;s region and permissions.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="search-empty">
                <div className="empty-index" aria-hidden="true">
                  001
                </div>
                <div>
                  <h3>Feed the ledger a starting point.</h3>
                  <p>
                    Search a real interest, then keep the rows worth taking into
                    your audience plan. The shortlist stays in this browser.
                  </p>
                  <div className="suggestion-list">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="suggestion"
                        type="button"
                        onClick={() => useSuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="saved-panel" aria-labelledby="saved-title">
            <div className="saved-head">
              <div>
                <span className="saved-kicker">Shortlist / local</span>
                <h2 id="saved-title">
                  {String(saved.length).padStart(2, "0")}
                </h2>
              </div>
              {saved.length > 0 && (
                <button
                  className="clear-button"
                  type="button"
                  onClick={() => setSaved([])}
                >
                  Clear
                </button>
              )}
            </div>
            {saved.length === 0 ? (
              <div className="saved-empty">
                <BookmarkIcon active={false} />
                <p>No interests clipped yet.</p>
                <span>Use the bookmark on any result.</span>
              </div>
            ) : (
              <>
                <div className="saved-list">
                  {saved.map((interest) => (
                    <div className="saved-item" key={interest.id}>
                      <div>
                        <strong>{interest.name}</strong>
                        <span>{audienceRange(interest)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSaved(interest.id)}
                        aria-label={`Remove ${interest.name}`}
                        title="Remove from shortlist"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="saved-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => void copyIds(saved, "saved interests")}
                  >
                    Copy IDs
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => downloadCsv(saved)}
                  >
                    Export list
                  </button>
                </div>
              </>
            )}
            <p className="saved-note">
              Stored in this browser. No account, no server-side list.
            </p>
          </aside>
        </section>

        <section className="mcp-section" id="mcp" aria-labelledby="mcp-title">
          <div className="mcp-copy">
            <p className="eyebrow">For agents / MCP</p>
            <h2 id="mcp-title">
              Wire the interest graph into your own tools.
            </h2>
            <p>
              This deployment exposes a JSON-RPC MCP endpoint. It uses the
              server token when configured; otherwise send a token in the{" "}
              <code>X-Meta-Token</code> header.
            </p>
            <div className="endpoint-line">
              <span>{endpoint}</span>
              <button
                className="text-button"
                type="button"
                onClick={() => void copyText(endpoint, "MCP endpoint")}
              >
                Copy endpoint
              </button>
            </div>
          </div>
          <div className="mcp-code">
            <div className="mcp-code-head">
              <span>Quick check / tools.list</span>
              <button
                className="text-button"
                type="button"
                onClick={() => void copyText(curlExample, "Example")}
              >
                Copy
              </button>
            </div>
            <pre>{curlExample}</pre>
          </div>
        </section>

        <section className="method" id="method" aria-labelledby="method-title">
          <div className="method-heading">
            <div>
              <p className="eyebrow">The method</p>
              <h2 id="method-title">A short path from word to audience.</h2>
            </div>
            <p className="method-intro">
              Interest Ledger does one job: turn Meta&apos;s interest search into
              a clean, portable shortlist. No campaign builder, no hidden token.
            </p>
          </div>
          <div className="method-grid">
            <article>
              <span className="method-number">01</span>
              <h3>Connect access</h3>
              <p>
                Use a server-side token if the deployment has one, or paste your
                own Meta Graph token for this tab.
              </p>
            </article>
            <article>
              <span className="method-number">02</span>
              <h3>Read the range</h3>
              <p>
                Compare interest names, paths, and audience bounds. Sort and
                filter without losing your place in the result sheet.
              </p>
            </article>
            <article>
              <span className="method-number">03</span>
              <h3>Take the shortlist</h3>
              <p>
                Clip the useful rows, copy the IDs, or export a CSV for the next
                planning document.
              </p>
            </article>
          </div>
          <div className="privacy-note" id="privacy">
            <span className="privacy-mark" aria-hidden="true">
              #
            </span>
            <p>
              <strong>Tokens are access, not content.</strong> The app does not
              log or persist a BYOK token beyond sessionStorage. If the
              deployment sets <code>META_TOKEN</code>, the token stays on the
              server and is never sent to the page. Meta receives the search
              request and the token according to its own policies.
            </p>
          </div>
        </section>
      </main>

      {notice && (
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      <footer className="footer">
        <div className="footer-mark">
          <span className="wordmark-mark" aria-hidden="true" />
          INTEREST / LEDGER
        </div>
        <p>
          A small tool by{" "}
          <a href="https://github.com/lab1207" target="_blank" rel="noreferrer">
            lab1207
          </a>
          . Source under GPL-3.0. Not affiliated with Meta Platforms, Inc.
        </p>
        <a
          className="footer-link"
          href="https://github.com/lab1207/Meta-Interest-Finder"
          target="_blank"
          rel="noreferrer"
        >
          View source <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </div>
  );
}
