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

export const LegalUpdates = ({ news, isLoading }: LegalUpdatesProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Legal Updates</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Legal Updates</h2>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-8">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No updates available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.slice(0, 3).map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all group"
            >
              <h3 className="font-medium text-sm mb-2 group-hover:text-primary line-clamp-2">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.source}</span>
                <div className="flex items-center gap-2">
                  <span>{item.time}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
};
