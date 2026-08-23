import type { GeographyTopic } from "@/lib/geography-data";

type PreviousNextNavigationProps = { previous?: GeographyTopic; next?: GeographyTopic; categorySlug: string };

export default function PreviousNextNavigation({ previous, next, categorySlug }: PreviousNextNavigationProps) {
  return <nav className="previous-next" aria-label="Topic navigation"><a className={previous ? "" : "is-disabled"} href={previous ? `/geography/${previous.slug}` : undefined} aria-disabled={!previous}>{previous ? <><small>Previous topic</small><strong>← {previous.title}</strong></> : <small>Beginning of category</small>}</a><a href={`/geography/${categorySlug}`}><small>Back to category</small><strong>All topics</strong></a><a className={next ? "" : "is-disabled"} href={next ? `/geography/${next.slug}` : undefined} aria-disabled={!next}>{next ? <><small>Next topic</small><strong>{next.title} →</strong></> : <small>End of category</small>}</a></nav>;
}
