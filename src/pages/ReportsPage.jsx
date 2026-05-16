import { ReportCard } from '../components/reports/ReportCard';

export function ReportsPage() {
  return (
    <div>
      <p className="text-gray-600 mb-6">
        View comprehensive monthly reports and export PDF summaries for any student.
      </p>
      <ReportCard />
    </div>
  );
}
