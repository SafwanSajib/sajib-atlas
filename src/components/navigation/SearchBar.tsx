"use client";

import { useState } from "react";
import { type CanonicalTopic } from "@/lib/content/manifest";
import { webSearchTopics } from "@/lib/client/web";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CanonicalTopic[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setResults(webSearchTopics(value));
  };

  return (
    <div className="search-container" style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search..."
        aria-label="Search topics"
        className="search-input"
        style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--line)", background: "transparent", color: "var(--paper)" }}
      />
      {query.length > 0 && (
        <div className="search-results" style={{ position: "absolute", top: "110%", left: 0, width: "300px", background: "var(--ink)", border: "1px solid var(--line)", zIndex: 20, padding: "10px" }}>
          {results.length > 0 ? (
            results.map((item) => (
              <Link key={item.id} href={item.href} style={{ display: "block", padding: "5px 0", color: "var(--paper)" }}>
                {item.title}
              </Link>
            ))
          ) : (
            <div style={{ color: "var(--muted)" }}>No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}
