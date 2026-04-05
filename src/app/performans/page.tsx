import { getActiveLocations } from '@/features/ledger/actions';
import { getDailyPerformanceHistory } from '@/features/ledger/performans-actions';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import PremiumExpenseTable from '@/components/premium/PremiumExpenseTable';
import { 
  TrendingUp, BarChart3, 
  Calendar, CheckCircle2, 
  Settings, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as motion from "framer-motion/client";
import PerformanceClientUI from '@/components/premium/PerformanceClientUI';

export const metadata = {
  title: 'Performans Girişi — NextGenBox',
};

export default async function PerformancePage(props: {
  searchParams: Promise<{ location?: string }>
}) {
  const searchParams = await props.searchParams;
  const filterLocation = searchParams.location || 'all';

  const locations = await getActiveLocations();
  
  const historyLocId = filterLocation === 'all' ? (locations[0]?.id || '') : filterLocation;
  const history = await getDailyPerformanceHistory(historyLocId);

  return (
    <PerformanceClientUI 
      locations={locations || []} 
      history={history || []} 
      historyLocId={filterLocation === 'all' ? '' : filterLocation} 
    />
  );
}
