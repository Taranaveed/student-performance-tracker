import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
const HOUSE_SCOPED_ROLES = ['housemaster', 'housemistress', 'assistantHousemaster', 'houseTeam'];

export function useStudents() {
  const { user, role, houseAssignment, classAssignment, hasFullView } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data;
      if (hasFullView()) {
        // Principal / Vice Principal: all students
        data = await studentService.getAllStudents();
      } else if (HOUSE_SCOPED_ROLES.includes(role) && houseAssignment) {
        // Housemaster / house roles: scoped to their house
        data = await studentService.getStudentsByHouse(houseAssignment);
      } else if (role === 'teacher' && classAssignment) {
        // Teacher with a class assignment: fetch all students in that grade
        // regardless of which teacher originally imported them
        data = await studentService.getStudentsByGrade(classAssignment);
      } else {
        // Legacy fallback: teacher without a classAssignment, or other roles
        data = await studentService.getStudentsByTeacher(user.uid);
      }
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, role, houseAssignment, classAssignment, hasFullView]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (studentData) => {
    try {
      const newStudent = await studentService.createStudent(studentData, user.uid);
      setStudents(prev => [newStudent, ...prev]);
      return newStudent;
    } catch (err) {
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