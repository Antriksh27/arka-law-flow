import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export const LegalNewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, using mock data. In production, you'd parse the RSS feed
      // via an edge function or RSS parser
      const mockNews: NewsItem[] = [
        {
          title: "Supreme Court Landmark Judgment on Data Privacy",
          link: "https://barandbench.com",
          pubDate: new Date().toISOString(),
          source: "Bar & Bench"
        },
        {
          title: "High Court Issues Guidelines for Virtual Hearings",
          link: "https://barandbench.com",
          pubDate: new Date().toISOString(),
          source: "Bar & Bench"
        },
        {
          title: "Amendment to Civil Procedure Code Proposed",
          link: "https://barandbench.com",
          pubDate: new Date().toISOString(),
          source: "Bar & Bench"
        }
      ];
      
      setNews(mockNews);
    } catch (err) {
      setError('Failed to fetch news');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Legal News
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchNews} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchNews}>
              Retry
            </Button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No news available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.slice(0, 5).map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-primary" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.source}</span>
                  <span>{format(new Date(item.pubDate), 'MMM dd')}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
