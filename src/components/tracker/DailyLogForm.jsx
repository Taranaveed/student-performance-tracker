import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { usePerformance } from '../../hooks/usePerformance';
import { Save, CheckCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const CATEGORIES = [
  {
    key: 'assembly',
    label: 'Assembly & Morning Routine',
    description: 'Discipline, punctuality, and morning preparedness'
  },
  {
    key: 'meals',
    label: 'Meals & Dining',
    description: 'Table manners, behavior, and etiquette during meals'
  },
  {
    key: 'studies',
    label: 'Academics & Study',
    description: 'Class focus, participation, and homework completion'
  },
  {
    key: 'social',
    label: 'Social & Emotional',
    description: 'Peer interaction, teamwork, and emotional regulation'
  }
];

export function DailyLogForm() {
  const { students, loading: studentsLoading } = useStudents();
  const { saveDailyLog, loading } = usePerformance();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [ratings, setRatings] = useState({
    assembly: 0,
    meals: 0,
    studies: 0,
    social: 0
  });
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      console.warn('⚠️ No student selected');
      alert('Please select a student');
      return;
    }

    const logData = {
      studentId: selectedStudent,
      date: selectedDate,
      ratings,
      notes
    };

    console.log('📤 DailyLogForm - Submitting log:', logData);
    console.log('📤 DailyLogForm - Selected student ID:', selectedStudent);
    console.log('📤 DailyLogForm - Selected date:', selectedDate);
    console.log('📤 DailyLogForm - Ratings:', ratings);

    try {
      const result = await saveDailyLog(logData);
      console.log('✅ DailyLogForm - Save successful:', result);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setRatings({ assembly: 0, meals: 0, studies: 0, social: 0 });
      setNotes('');
      setSelectedStudent('');
    } catch (error) {
      console.error('❌ DailyLogForm - Failed to save log:', error);
      console.error('❌ DailyLogForm - Error code:', error.code);
      console.error('❌ DailyLogForm - Error message:', error.message);
      alert('Failed to save log: ' + error.message);
    }
  };

  const handleRatingClick = (categoryKey, rating) => {
    console.log('⭐ Rating clicked:', categoryKey, '=', rating);
    setRatings(prev => ({
      ...prev,
      [categoryKey]: rating
    }));
  };

  if (studentsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-500 mb-4">No students found. Add students from the Roster page first.</p>
        <a href="/roster" className="text-blue-600 hover:text-blue-700 font-medium">
          Go to Roster →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              required
              value={selectedStudent}
              onChange={(e) => {
                console.log('👤 Student selected:', e.target.value);
                setSelectedStudent(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} (Roll: {student.rollNumber})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => {
                console.log('📅 Date changed:', e.target.value);
                setSelectedDate(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        <h3 className="text-lg font-semibold text-gray-900">Performance Ratings (0-5)</h3>
        
        {CATEGORIES.map((category) => (
          <div key={category.key} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{category.label}</h4>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingClick(category.key, rating)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        ratings[category.key] === rating
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700 min-w-[3rem]">
                  {ratings[category.key]}/5
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="Any specific observations or incidents..."
        />
      </div>

      <div className="flex items-center justify-between">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Log saved successfully!</span>
          </div>
        )}
        <div className="flex-1"></div>
        <button
          type="submit"
          disabled={loading || !selectedStudent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Daily Log'}
        </button>
      </div>
    </form>
  );
}