import BracketViewClient from './BracketViewClient';

// Generate static params for static export (admin pages return empty array)
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

export default function BracketViewPage() {
  return <BracketViewClient />;
}