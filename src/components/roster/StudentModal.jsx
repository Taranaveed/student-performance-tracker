import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { HOUSES, GRADES } from '../../config/marksSystem';

export function StudentModal({ isOpen, onClose, onSubmit, student = null }) {
  const [formData, setFormData] = useState({ name: '', rollNumber: '', grade: '', house: '' });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        grade: student.grade || '',
        house: student.house || '',
      });
    } else {
      setFormData({ name: '', rollNumber: '', grade: '', house: '' });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{student ? 'Edit Student' : 'Add New Student'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Name</label>
            <input type="text" required value={formData.name} onChange={set('name')}
              className="input-field" placeholder="Enter student name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">School / Roll Number</label>
            <input type="text" required value={formData.rollNumber} onChange={set('rollNumber')}
              className="input-field" placeholder="e.g. 163-22-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Grade <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select value={formData.grade} onChange={set('grade')} className="input-field">
                <option value="">Select grade...</option>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                House <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select value={formData.house} onChange={set('house')} className="input-field">
                <option value="">Select house...</option>
                {HOUSES.map(h => <option key={h} value={h}>{h} House</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {student ? 'Update' : 'Add'} Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
