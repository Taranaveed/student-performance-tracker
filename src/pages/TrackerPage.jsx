import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DetailedMarksForm } from '../components/tracker/DetailedMarksForm';

/**
 * TrackerPage
 *
 * For teachers with multiple assigned classes: renders a class tab bar so the
 * teacher can quickly switch between classes. Each tab scopes the student list
 * shown inside DetailedMarksForm to that class only.
 *
 * All other roles fall through to the standard single-panel form.
 */
export function TrackerPage() {
  const { role, assignedClasses } = useAuth();

  const isMultiClassTeacher =
    role === 'teacher' && Array.isArray(assignedClasses) && assignedClasses.length > 1;

  const [activeClass, setActiveClass] = useState(
    isMultiClassTeacher ? assignedClasses[0] : null
  );

  if (!isMultiClassTeacher) {
    return (
      <div>
        <p className="text-gray-600 mb-6">
          Log detailed weekly marks for students.
        </p>
        <DetailedMarksForm classFilter={null} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-600">
        Log weekly marks for your assigned classes. Switch between classes using the tabs below.
      </p>

      {/* ── Class Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {assignedClasses.map(cls => (
          <button
            key={cls}
            onClick={() => setActiveClass(cls)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
              activeClass === cls
                ? 'bg-white border-gray-200 text-blue-700 -mb-px z-10'
                : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Class {cls.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Active Class Panel ── */}
      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 shadow-sm p-4 md:p-6 -mt-px">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wide">
            Class {activeClass?.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">· Grade marks entry</span>
        </div>
        <DetailedMarksForm classFilter={activeClass} />
      </div>
    </div>
  );
}
