type BreadcrumbsProps = { current: string; parentHref?: string; parentLabel?: string };

export default function Breadcrumbs({ current, parentHref, parentLabel }: BreadcrumbsProps) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>{parentHref && parentLabel ? <><a href={parentHref}>{parentLabel}</a><span>/</span></> : null}<span aria-current="page">{current}</span></nav>;
}
