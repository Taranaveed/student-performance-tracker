import { DetailedMarksForm } from '../components/tracker/DetailedMarksForm';

export function TrackerPage() {
  return (
    <div>
      <p className="text-gray-600 mb-6">
        Log detailed weekly marks allocation for students.
      </p>
      <DetailedMarksForm />
    </div>
  );
}