import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

export function useStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!user) {
      console.log('❌ useStudents: No user logged in');
      return;
    }
    setLoading(true);
    console.log('🔄 useStudents: Fetching students for teacher:', user.uid);
    try {
      const data = await studentService.getStudentsByTeacher(user.uid);
      console.log('✅ useStudents: Fetched', data.length, 'students:', data);
      setStudents(data);
      setError(null);
    } catch (err) {
      console.error('❌ useStudents: Error fetching:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 useStudents: useEffect triggered, user:', user?.uid);
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (studentData) => {
    try {
      console.log('➕ useStudents: Adding student:', studentData);
      const newStudent = await studentService.createStudent(studentData, user.uid);
      console.log('✅ useStudents: Added student:', newStudent);
      setStudents(prev => {
        console.log('📝 useStudents: Previous students:', prev);
        return [newStudent, ...prev];
      });
      return newStudent;
    } catch (err) {
      console.error('❌ useStudents: Error adding:', err.message);
      setError(err.message);
      throw err;
    }
  };

  const updateStudent = async (studentId, updates) => {
    try {
      await studentService.updateStudent(studentId, updates);
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, ...updates } : s
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      console.log('🗑️ useStudents: Deleting student:', studentId);
      await studentService.deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refresh: fetchStudents
  };
}