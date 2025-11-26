import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

interface Similarity {
  id: string;
  category?: string | null;
  data?: any;
}

interface SCSimilaritiesAccordionProps {
  data: Similarity[];
}

export function SCSimilaritiesAccordion({ data }: SCSimilaritiesAccordionProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No similarities data available
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {data.map((similarity, index) => (
        <AccordionItem key={similarity.id} value={`item-${index}`} className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-sm font-medium">{similarity.category || `Category ${index + 1}`}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Card className="p-4 bg-muted/50">
              {Array.isArray(similarity.data) ? (
                <div className="space-y-2">
                  {similarity.data.map((item: string, idx: number) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {item}
                    </p>
                  ))}
                </div>
              ) : (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(similarity.data, null, 2)}
                </pre>
              )}
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}