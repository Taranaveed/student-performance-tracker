import { useState, useCallback } from 'react';
import { performanceService } from '../services/performanceService';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { getMonthRange } from '../lib/utils';

export function usePerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ── Weekly (new) ────────────────────────────────────────────────────────────

  const saveWeeklySection = useCallback(async (studentId, year, month, week, sectionData) => {
    setLoading(true);
    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error('No authenticated user');
      const id = await performanceService.saveWeeklySection(studentId, year, month, week, sectionData, uid);
      setError(null);
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getWeeklyRecord = useCallback(async (studentId, year, month, week) => {
    try {
      return await performanceService.getWeeklyRecord(studentId, year, month, week);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const getMonthlyRecords = useCallback(async (studentId, year, month) => {
    try {
      return await performanceService.getMonthlyRecords(studentId, year, month);
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  // ── Legacy daily (kept for old data + reports) ───────────────────────────────

  const saveDetailedMarks = useCallback(async (logData) => {
    setLoading(true);
    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error('No authenticated user');
      const result = await performanceService.createDetailedMarks(logData, uid);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDetailedMarksByDate = useCallback(async (studentId, date) => {
    try {
      return await performanceService.getDetailedMarksByDate(studentId, date);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

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
    const { start, end } = getMonthRange(year, month);
    return getStudentLogs(studentId, start, end);
  }, [getStudentLogs]);

  return {
    loading,
    error,
    // weekly
    saveWeeklySection,
    getWeeklyRecord,
    getMonthlyRecords,
    // legacy daily
    saveDetailedMarks,
    getDetailedMarksByDate,
    getStudentLogs,
    getMonthlyLogs,
  };
}
