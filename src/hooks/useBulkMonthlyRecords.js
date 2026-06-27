import { useEffect, useMemo, useState } from 'react';
import { usePerformance } from './usePerformance';
import { fetchBulkMonthlyRecords } from '../lib/monthlyRecordsCache';

/**
 * Loads monthly performance records for all given students with cache + debounce.
 */
export function useBulkMonthlyRecords(students, year, month, debounceMs = 350) {
  const { getMonthlyRecords } = usePerformance();
  const [recordsByStudentId, setRecordsByStudentId] = useState({});
  const [loading, setLoading] = useState(false);

  const studentKey = useMemo(
    () => students.map(s => s.id).sort().join(','),
    [students]
  );

  useEffect(() => {
    if (students.length === 0) {
      setRecordsByStudentId({});
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await fetchBulkMonthlyRecords(students, year, month, getMonthlyRecords);
        if (!cancelled) setRecordsByStudentId(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [studentKey, students, year, month, getMonthlyRecords, debounceMs]);

  return { recordsByStudentId, loading };
}
