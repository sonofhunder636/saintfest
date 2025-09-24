import BracketViewClient from './BracketViewClient';

// Generate static params for static export
export async function generateStaticParams(): Promise<{ id: string }[]> {
  // Return a placeholder ID for static generation
  return [{ id: 'placeholder' }];
}

export default function BracketViewPage() {
  return <BracketViewClient />;
}