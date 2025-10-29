import Layout from '@/components/Layout';
import { FileText } from 'lucide-react';
import { useRegulatoryReporting } from '@/hooks/useRegulatoryReporting';
import ReportingStats from '@/components/regulatory/ReportingStats';
import ReportSubmissionForm from '@/components/regulatory/ReportSubmissionForm';
import ReportsList from '@/components/regulatory/ReportsList';

export default function RegulatoryReporting() {
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
        </div>

        <ReportingStats stats={reportStats} />

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
      </div>
    </Layout>
  );
}
