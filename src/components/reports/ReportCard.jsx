import { useState, useEffect } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { performanceService } from '../../services/performanceService';
import { MonthlyChart } from './MonthlyChart';
import { PDFGenerator } from './PDFGenerator';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export function ReportCard() {
  const { students } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStudent) {
        setLogs([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
        
        const data = await performanceService.getLogsByStudent(selectedStudent, startDate, endDate);
        const sortedData = data.sort((a, b) => a.date.localeCompare(b.date));
        
        setLogs(sortedData);
      } catch (error) {
        console.error('Failed to fetch monthly data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedStudent, selectedMonth, selectedYear]);

  const currentStudent = students.find(s => s.id === selectedStudent);

  // Calculate averages from detailed marks
  const averages = logs.length > 0 ? {
    dailyRoutine: (logs.reduce((a, b) => a + ((b.weeklyTotals?.dailyRoutine || 0) / 50 * 5), 0) / logs.length).toFixed(1),
    hygiene: (logs.reduce((a, b) => a + ((b.weeklyTotals?.hygiene || 0) / 35 * 5), 0) / logs.length).toFixed(1),
    studyDiscipline: (logs.reduce((a, b) => a + ((b.weeklyTotals?.studyDiscipline || 0) / 12 * 5), 0) / logs.length).toFixed(1),
    sportsActivities: (logs.reduce((a, b) => a + ((b.weeklyTotals?.sportsActivities || 0) / 10 * 5), 0) / logs.length).toFixed(1)
  } : null;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Controls - Stack on mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[44px]"
            >
              <option value="">Choose student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[44px]"
            >
              {months.map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[44px]"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 mx-2 md:mx-0">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {selectedStudent && currentStudent && (
        <>
          {/* Summary Cards - 2 cols on mobile, 4 on desktop */}
          {averages && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(averages).map(([key, value]) => (
                <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <span className="text-xs md:text-sm font-medium text-gray-600 capitalize truncate">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 flex-shrink-0" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-1">Avg (0-5)</div>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Performance Trends ({logs.length} days)
              </h3>
              {currentStudent && (
                <PDFGenerator 
                  student={currentStudent} 
                  logs={logs} 
                  month={selectedMonth} 
                  year={selectedYear}
                />
              )}
            </div>
            
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <MonthlyChart logs={logs} />
            )}
          </div>

          {/* Detailed Marks Table - Horizontal scroll on mobile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Detailed Marks Log</h3>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full text-sm text-left min-w-[700px] md:min-w-0">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 md:px-4 md:py-3 rounded-l-lg">Date</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Routine</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Hygiene</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Study</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Sports</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Acad</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Pen</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3">Bon</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3 font-bold">Total</th>
                    <th className="px-3 py-2.5 md:px-4 md:py-3 rounded-r-lg">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                        No logs found for this period
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const t = log.weeklyTotals || {};
                      return (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5 md:px-4 md:py-3 font-medium whitespace-nowrap">{log.date}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3">{t.dailyRoutine || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3">{t.hygiene || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3">{t.studyDiscipline || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3">{t.sportsActivities || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3">{t.academics || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-red-600">{t.penalties || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-green-600">{t.bonus || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 font-bold text-blue-700">{t.grandTotal || 0}</td>
                          <td className="px-3 py-2.5 md:px-4 md:py-3 text-gray-500 max-w-[150px] md:max-w-xs truncate">
                            {log.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}