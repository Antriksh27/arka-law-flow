import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface SCSimilaritiesDisplayProps {
  caseId: string;
}

export const SCSimilaritiesDisplay = ({ caseId }: SCSimilaritiesDisplayProps) => {
  const { data: similarities = [], isLoading } = useQuery({
    queryKey: ['sc-similarities', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_similarities' as any)
        .select('*')
        .eq('case_id', caseId);
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading similarities...</div>;
  if (similarities.length === 0) return <div className="text-sm text-muted-foreground">No similar cases found</div>;
  
  return (
    <Accordion type="multiple" className="space-y-3">
      {similarities.map((sim) => (
        <AccordionItem key={sim.id} value={sim.id} className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:bg-accent/50">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {Array.isArray(sim.similarity_data) ? sim.similarity_data.length : 0} matches
              </Badge>
              <span className="font-medium text-left">{sim.category}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {Array.isArray(sim.similarity_data) ? (
              <div className="space-y-2">
                {sim.similarity_data.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm bg-muted/50 p-3 rounded border border-border">
                    {typeof item === 'string' ? (
                      <pre className="whitespace-pre-wrap font-sans">{item}</pre>
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-xs">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                {JSON.stringify(sim.similarity_data)}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
