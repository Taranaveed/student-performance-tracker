import { useState } from 'react';
import { Plus, Search, Upload, RefreshCw } from 'lucide-react';
import { StudentCard } from './StudentCard';
import { StudentModal } from './StudentModal';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../context/AuthContext';
import { SEED_STUDENTS } from '../../config/seedStudents';
import { studentService } from '../../services/studentService';
import { FULL_VIEW_ROLES } from '../../config/marksSystem';

const HOUSE_SCOPED_ROLES = ['housemaster', 'housemistress', 'assistantHousemaster', 'houseTeam'];

export function RosterGrid() {
  const { students, loading, error, addStudent, updateStudent, deleteStudent, refresh } = useStudents();
  const { user, role, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null); // { type: 'success'|'info'|'error', text }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.includes(searchTerm)
  );

  const handleAdd = async (formData) => {
    await addStudent(formData);
  };

  const handleEdit = async (formData) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
      setEditingStudent(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      await deleteStudent(id);
    }
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleImport = async () => {
    if (!window.confirm(`Import ${SEED_STUDENTS.length} students? Existing students (by roll number) will be skipped.`)) return;
    setImporting(true);
    try {
      const result = await studentService.bulkImportStudents(SEED_STUDENTS, user.uid);
      alert(`Import complete: ${result.imported} added, ${result.skipped} skipped.`);
      await refresh();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSync = async () => {
    const isHouseRole = HOUSE_SCOPED_ROLES.includes(role);
    const assignment = isHouseRole ? profile?.houseAssignment : profile?.classAssignment;

    if (!assignment) {
      setSyncMessage({ type: 'error', text: 'No class or house assignment found on your account. Contact an admin to update your profile.' });
      return;
    }

    setSyncing(true);
    setSyncMessage(null);
    try {
      let alreadyExists;
      let studentsToImport;

      if (isHouseRole) {
        alreadyExists = await studentService.hasStudentsForHouse(assignment);
        studentsToImport = SEED_STUDENTS.filter(s => s.house === assignment);
      } else {
        alreadyExists = await studentService.hasStudentsForGrade(assignment.toLowerCase());
        studentsToImport = SEED_STUDENTS.filter(s => s.grade === assignment.toLowerCase());
      }

      if (alreadyExists) {
        // Students are already in Firestore — just refresh so the roster loads
        await refresh();
        const label = isHouseRole ? `${assignment} House` : `Grade ${assignment.toUpperCase()}`;
        setSyncMessage({
          type: 'success',
          text: `Roster loaded — showing students for ${label}.`,
        });
        return;
      }

      if (studentsToImport.length === 0) {
        setSyncMessage({
          type: 'info',
          text: `No seed data found for ${isHouseRole ? `${assignment} House` : `Grade ${assignment}`}. Add students manually using the "Add Student" button.`,
        });
        return;
      }

      const result = await studentService.bulkImportStudents(studentsToImport, user.uid);
      await refresh();
      setSyncMessage({
        type: 'success',
        text: `Roster synced: ${result.imported} student${result.imported !== 1 ? 's' : ''} added${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.`,
      });
    } catch (err) {
      setSyncMessage({ type: 'error', text: 'Sync failed: ' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  const showSyncButton = !FULL_VIEW_ROLES.includes(role);

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      {syncMessage && (
        <div className={`rounded-xl p-4 text-sm border ${
          syncMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          syncMessage.type === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
                                           'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {syncMessage.text}
        </div>
      )}
      {/* Search + Add Button - Stack on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[44px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {(role === 'principal' || role === 'vicePrincipal') && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Upload className="w-5 h-5" />
              {importing ? 'Importing...' : `Import ${SEED_STUDENTS.length} Students`}
            </button>
          )}
          {showSyncButton && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 min-h-[48px]"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync My Roster'}
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-gray-500 px-4">
          {searchTerm ? 'No students found matching your search.' : 'No students added yet. Add your first student!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <StudentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingStudent ? handleEdit : handleAdd}
        student={editingStudent}
      />
    </div>
  );
}