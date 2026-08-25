import type { GeographyTopic } from "@/lib/geography-data";
import type { Topic } from "@/lib/knowledge-data";

type DisplayTopic = Topic | GeographyTopic;

export default function TopicCard({
  topic,
  index,
}: {
  topic: DisplayTopic;
  index: number;
}) {
  const isGeographyTopic = "shortDescription" in topic;

  const label = isGeographyTopic ? topic.category : topic.label;

  const description = isGeographyTopic
    ? topic.shortDescription
    : topic.description;

  const href = isGeographyTopic
    ? `/geography/${topic.slug}`
    : topic.href;

  return (
    <a
      className="topic-card"
      href={href}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: "365px",
        padding: "36px",
        boxSizing: "border-box",
      }}
    >
      {/* Top row */}
      <div
        className="card-top"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        <span className="card-number">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="arrow">↗</span>
      </div>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          paddingTop: "78px",
        }}
      >
        <p
          className="card-label"
          style={{
            marginBottom: "26px",
          }}
        >
          {label}
        </p>

        <h3
          style={{
            margin: 0,
            color: "#f4f7f8",
            fontSize: "30px",
            lineHeight: 1.2,
            fontWeight: 500,
          }}
        >
          {topic.title}
        </h3>

        <p
          className="card-description"
          style={{
            marginTop: "24px",
            marginBottom: "0",
            maxWidth: "520px",
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>

        {/* Bottom metadata */}
        {isGeographyTopic ? (
          <span
            className="topic-meta"
            style={{
              marginTop: "auto",
              paddingTop: "18px",
              paddingBottom: "18px",
              display: "block",
            }}
          >
            {topic.difficulty} · {topic.examRelevance} relevance
          </span>
        ) : null}
      </div>

      {/* Bottom accent line */}
      <span
        className="card-line"
        style={{
          position: "absolute",
          left: "36px",
          bottom: "0",
        }}
      />
    </a>
  );
}