import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Building2 } from 'lucide-react';

interface ReportFiltersProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterAuthority: string;
  setFilterAuthority: (value: string) => void;
  authorities: any[];
}

export default function ReportFilters({
  filterStatus,
  setFilterStatus,
  filterAuthority,
  setFilterAuthority,
  authorities
}: ReportFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[150px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterAuthority} onValueChange={setFilterAuthority}>
        <SelectTrigger className="w-[180px]">
          <Building2 className="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Authorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Authorities</SelectItem>
          {authorities?.map((authority) => (
            <SelectItem key={authority.id} value={authority.id}>
              {authority.authority_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
