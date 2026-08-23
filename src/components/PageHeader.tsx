import Breadcrumbs from "@/components/Breadcrumbs";

type PageHeaderProps = { eyebrow: string; title: string; description: string; parentHref?: string; parentLabel?: string };

export default function PageHeader({ eyebrow, title, description, parentHref, parentLabel }: PageHeaderProps) {
  return <div className="page-header"><Breadcrumbs parentHref={parentHref} parentLabel={parentLabel} current={title} /><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>;
}
