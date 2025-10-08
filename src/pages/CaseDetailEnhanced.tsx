import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useLegalkartCaseDetails } from '@/hooks/useLegalkartCaseDetails';
import { CaseHeaderCard } from '@/components/cases/enhanced/CaseHeaderCard';
import { PartiesCards } from '@/components/cases/enhanced/PartiesCards';
import { CategoryIACards } from '@/components/cases/enhanced/CategoryIACards';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';

const CaseDetailEnhanced = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    legalkartCase,
    petitioners,
    respondents,
    iaDetails,
    documents,
    orders,
    objections,
    hearings,
    isLoading,
    refreshCaseData,
    isRefreshing
  } = useLegalkartCaseDetails(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/ecourts')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to eCourts
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#111827]">Case Details</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => refreshCaseData()}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Case Header Card */}
        <CaseHeaderCard caseData={legalkartCase} />

        {/* Parties */}
        <PartiesCards petitioners={petitioners} respondents={respondents} />

        {/* Category & IA Details */}
        <CategoryIACards caseData={legalkartCase} iaDetails={iaDetails} />

        {/* Tabbed Content */}
        <Tabs defaultValue="hearings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="hearings" className="text-base">
              🗓️ Hearings
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-base">
              📄 Orders
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-base">
              📂 Documents
            </TabsTrigger>
            <TabsTrigger value="objections" className="text-base">
              ⚠️ Objections
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
            <TabsContent value="hearings" className="mt-0">
              <HearingsTable hearings={hearings} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrdersTable orders={orders} />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <DocumentsTable documents={documents} />
            </TabsContent>

            <TabsContent value="objections" className="mt-0">
              <ObjectionsTable objections={objections} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default CaseDetailEnhanced;
