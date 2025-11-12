import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Newspaper, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  uploaded_at: string;
}

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
}

interface Chat {
  id: string;
  name: string;
  last_message: string;
  updated_at: string;
}

interface UpdatesSectionProps {
  documents: Document[];
  news: NewsItem[];
  chats: Chat[];
  isLoading?: boolean;
}

export const UpdatesSection: React.FC<UpdatesSectionProps> = ({
  documents,
  news,
  chats,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="mb-6">
        <button className="w-full bg-card rounded-xl border border-border p-4 animate-pulse">
          <div className="h-5 bg-muted rounded w-1/3" />
        </button>
      </section>
    );
  }

  const hasUpdates = documents.length > 0 || news.length > 0 || chats.length > 0;

  return (
    <section className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between transition-all active:scale-[0.99]"
      >
        <h2 className="text-base font-semibold text-foreground">Updates</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Recent Documents */}
          {documents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Recent Documents
                </h3>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {documents.slice(0, 2).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate('/documents')}
                    className="w-full bg-card rounded-lg border border-border p-3 text-left transition-all active:scale-[0.98] hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground truncate mb-1">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.uploaded_at), 'MMM d, h:mm a')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legal Updates */}
          {news.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-muted-foreground" />
                  Legal Updates
                </h3>
              </div>
              <div className="space-y-2">
                {news.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.published_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          {chats.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Recent Chats
                </h3>
              </div>
              <div className="space-y-2">
                {chats.slice(0, 2).map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full bg-card rounded-lg border border-border p-3 text-left transition-all active:scale-[0.98] hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground truncate mb-1">{chat.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {chat.last_message}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasUpdates && (
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No recent updates</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
