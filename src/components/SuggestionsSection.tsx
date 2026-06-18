import { PortfolioSuggestionsPanel } from './personal-portfolio/PortfolioSuggestionsPanel';

interface SuggestionsSectionProps {
  boxSlug: string;
  className?: string;
}

export function SuggestionsSection({ boxSlug, className = '' }: SuggestionsSectionProps) {
  return (
    <div className={`site-suggestions ${className}`.trim()}>
      <PortfolioSuggestionsPanel boxSlug={boxSlug} />
    </div>
  );
}
