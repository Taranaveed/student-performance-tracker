import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

const HOUSE_SCOPED_ROLES = ['housemaster', 'housemistress', 'houseTeam'];

export function useStudents() {
  const { user, role, houseAssignment, classAssignment, assignedClasses, hasFullView } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data;

      if (hasFullView()) {
        // Admin + Head roles (peHead / skillsHead / activitiesHead): all students
        data = await studentService.getAllStudents();

      } else if (HOUSE_SCOPED_ROLES.includes(role) && houseAssignment) {
        // Housemaster / house roles: scoped to their house
        data = await studentService.getStudentsByHouse(houseAssignment);

      } else if (role === 'teacher') {
        // Teachers: fetch across all assigned classes
        const classes = (assignedClasses && assignedClasses.length > 0)
          ? assignedClasses
          : (classAssignment ? [classAssignment] : []);

        if (classes.length > 0) {
          const results = await Promise.all(
            classes.map(c => studentService.getStudentsByGrade(c))
          );
          // Flatten and de-duplicate by id
          const seen = new Set();
          data = results.flat().filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });
        } else {
          // Fallback: own students
          data = await studentService.getStudentsByTeacher(user.uid);
        }

      } else {
        // Other / legacy roles
        data = await studentService.getStudentsByTeacher(user.uid);
      }

      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, role, houseAssignment, classAssignment, assignedClasses, hasFullView]);

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
    refresh: fetchStudents,
  };
}
