import { useState, useCallback } from 'react';
import { performanceService } from '../services/performanceService';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';

export function usePerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Simple ratings (0-5 scale) - KEEP EXISTING
  const saveDailyLog = useCallback(async (logData) => {
    setLoading(true);
    try {
      const teacherId = user?.uid || auth.currentUser?.uid;
      if (!teacherId) throw new Error('No authenticated user');
      
      const result = await performanceService.createLog(logData, teacherId);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);*/

  // Detailed marks (100-point system) - MAKE SURE THIS EXISTS
  const saveDetailedMarks = useCallback(async (logData) => {
    setLoading(true);
    try {
      const teacherId = user?.uid || auth.currentUser?.uid;
      if (!teacherId) throw new Error('No authenticated user');
      
      const result = await performanceService.createDetailedMarks(logData, teacherId);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getStudentLogs = useCallback(async (studentId, startDate, endDate) => {
    setLoading(true);
    try {
      const logs = await performanceService.getLogsByStudent(studentId, startDate, endDate);
      setError(null);
      return logs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMonthlyLogs = useCallback(async (studentId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return getStudentLogs(studentId, startDate, endDate);
  }, [getStudentLogs]);

  // MAKE SURE saveDetailedMarks IS IN THIS RETURN OBJECT
  return {
     
    saveDetailedMarks,   
    getStudentLogs,
    getMonthlyLogs,
    loading,
    error
  };
}