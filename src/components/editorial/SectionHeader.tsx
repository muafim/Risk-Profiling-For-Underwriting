type Props = {
  number: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  inverse?: boolean;
};

export function SectionHeader({ number, eyebrow, title, subtitle, inverse = false }: Props) {
  return (
    <header className={`section-header ${inverse ? "section-header--inverse" : ""}`}>
      <span className="section-number" aria-hidden="true">{number}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}
