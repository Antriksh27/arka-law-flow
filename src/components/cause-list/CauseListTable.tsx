import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CauseListTableProps {
  data: any[];
}

export const CauseListTable: React.FC<CauseListTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No cause list items found
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Sr No</TableHead>
              <TableHead className="font-semibold">Case Number</TableHead>
              <TableHead className="font-semibold">Parties</TableHead>
              <TableHead className="font-semibold">Advocate</TableHead>
              <TableHead className="font-semibold">Stage</TableHead>
              <TableHead className="font-semibold">Purpose</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {item.case_number || item.caseNumber || '-'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Pet: </span>
                      {item.petitioner || '-'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Resp: </span>
                      {item.respondent || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.advocate || item.petitioner_advocate || '-'}</TableCell>
                <TableCell>
                  {item.stage ? (
                    <Badge variant="outline">{item.stage}</Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>{item.purpose || item.purpose_of_hearing || '-'}</TableCell>
                <TableCell>
                  {item.status ? (
                    <Badge variant={item.status.toLowerCase().includes('listed') ? 'default' : 'outline'}>
                      {item.status}
                    </Badge>
                  ) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
