import { useState } from 'react';
import Layout from '@/components/Layout';
import { FileText, BarChart3, FileStack, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRegulatoryReporting } from '@/hooks/useRegulatoryReporting';
import ReportingStats from '@/components/regulatory/ReportingStats';
import ReportSubmissionForm from '@/components/regulatory/ReportSubmissionForm';
import ReportsList from '@/components/regulatory/ReportsList';
import ReportAnalytics from '@/components/regulatory/ReportAnalytics';
import BulkReportGenerator from '@/components/regulatory/BulkReportGenerator';
import ReportExporter from '@/components/regulatory/ReportExporter';
import { UnifiedAssistant } from '@/components/UnifiedAssistant';

export default function RegulatoryReporting() {
  const [activeTab, setActiveTab] = useState('reports');
  const [showAssistant, setShowAssistant] = useState(false);
  const {
    authorities,
    reports,
    reportStats,
    formData,
    setFormData,
    isSubmitting,
    submitReport,
    retryReport,
    downloadReport,
    filterStatus,
    setFilterStatus,
    filterAuthority,
    setFilterAuthority
  } = useRegulatoryReporting();

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Regulatory Reporting
            </h1>
            <p className="text-muted-foreground">
              Submit compliance reports to regulatory authorities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAssistant(!showAssistant)}
              variant="outline"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {showAssistant ? 'Hide' : 'Show'} Assistant
            </Button>
            <ReportExporter reports={reports || []} />
          </div>
        </div>

        {showAssistant && (
          <div className="mb-6">
            <UnifiedAssistant 
              userRole="compliance_officer" 
              onClose={() => setShowAssistant(false)}
            />
          </div>
        )}

        <ReportingStats stats={reportStats} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              Bulk Generation
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <ReportSubmissionForm
              formData={formData}
              setFormData={setFormData}
              authorities={authorities || []}
              isSubmitting={isSubmitting}
              onSubmit={submitReport}
            />

            <ReportsList
              reports={reports || []}
              authorities={authorities || []}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterAuthority={filterAuthority}
              setFilterAuthority={setFilterAuthority}
              onRetry={retryReport}
              onDownload={downloadReport}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <BulkReportGenerator
              authorities={authorities || []}
              onComplete={() => setActiveTab('reports')}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ReportAnalytics reports={reports || []} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
