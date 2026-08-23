import Link from "next/link";

type BreadcrumbsProps = { current: string; parentHref?: string; parentLabel?: string };

export default function Breadcrumbs({ current, parentHref, parentLabel }: BreadcrumbsProps) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{parentHref && parentLabel ? <><Link href={parentHref}>{parentLabel}</Link><span>/</span></> : null}<span aria-current="page">{current}</span></nav>;
}
