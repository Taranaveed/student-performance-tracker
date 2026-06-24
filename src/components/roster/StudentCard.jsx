import { Pencil, Trash2, User } from 'lucide-react';

export function StudentCard({ student, onEdit, onDelete, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
            {(student.grade || student.house) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {student.grade && `Grade ${student.grade}`}
                {student.grade && student.house && ' · '}
                {student.house && `${student.house} House`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity sm:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Edit student"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(student.id); }}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
            aria-label="Delete student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Added</span>
          <span className="text-gray-700">
            {new Date(student.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}