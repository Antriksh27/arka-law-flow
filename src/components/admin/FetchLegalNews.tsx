import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Newspaper, RefreshCw } from 'lucide-react';

export const FetchLegalNews = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-legal-news');
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: data?.message || 'Legal news fetched successfully',
      });
    } catch (error) {
      console.error('Error fetching legal news:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch legal news',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Legal News Feed</h3>
            <p className="text-sm text-muted-foreground">
              Updates automatically every 12 hours
            </p>
          </div>
        </div>
        <Button
          onClick={handleFetch}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2">Fetch Now</span>
        </Button>
      </div>
    </Card>
  );
};
