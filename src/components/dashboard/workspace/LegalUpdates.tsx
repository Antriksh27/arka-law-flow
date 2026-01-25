import { Newspaper, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
interface NewsItem {
  title: string;
  source: string;
  time: string;
  url?: string;
}
interface LegalUpdatesProps {
  news: NewsItem[];
  isLoading?: boolean;
}
export const LegalUpdates = ({
  news,
  isLoading
}: LegalUpdatesProps) => {
  if (isLoading) {
    return <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Legal Updates</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />)}
        </div>
      </Card>;
  }
  return;
};
