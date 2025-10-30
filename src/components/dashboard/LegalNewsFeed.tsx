import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
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
          source: "Bar & Bench",
          description: "The Supreme Court has delivered a landmark judgment on data privacy, setting new precedents for digital rights and data protection in India."
        },
        {
          title: "High Court Issues Guidelines for Virtual Hearings",
          link: "https://barandbench.com",
          pubDate: new Date().toISOString(),
          source: "Bar & Bench",
          description: "High Court issues comprehensive guidelines for conducting virtual hearings, addressing technical requirements and procedural matters."
        },
        {
          title: "Amendment to Civil Procedure Code Proposed",
          link: "https://barandbench.com",
          pubDate: new Date().toISOString(),
          source: "Bar & Bench",
          description: "Major amendments to the Civil Procedure Code are under consideration, aimed at expediting civil litigation and reducing court backlogs."
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
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNews}>
              Try Again
            </Button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No news available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.slice(0, 5).map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/10 text-primary text-xs">
                            {item.source}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(item.pubDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
