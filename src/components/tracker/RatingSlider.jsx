import { Star } from 'lucide-react';

export function RatingSlider({ value, onChange, label, description }) {
  const ratings = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {ratings.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  rating <= value
                    ? 'fill-warning-500 text-warning-500'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-lg font-semibold text-gray-700 min-w-[2rem]">
          {value}/5
        </span>
      </div>
    </div>
  );
}