export const MARKS_SYSTEM = {
  // Category A: Daily Routine Discipline
  dailyRoutine: {
    label: 'Daily Routine Discipline',
    maxTotal: 50,
    factors: [
      { key: 'wakeUpOnTime', label: 'Wake-up on time', max: 7 },
      { key: 'breakfastLineup', label: 'Breakfast lineup', max: 7 },
      { key: 'schoolLineup', label: 'School lineup', max: 6 },
      { key: 'lunchLineup', label: 'Lunch lineup', max: 6 },
      { key: 'maghribLineup', label: 'Maghrib lineup', max: 7 },
      { key: 'diningHallDiscipline', label: 'Dining hall discipline', max: 7 },
      { key: 'lightsOut', label: 'Lights out', max: 7 },
      { key: 'generalBehavior', label: 'General behavior', max: 3 }
    ]
  },
  
  // Category B: Hygiene & Turnout
  hygiene: {
    label: 'Hygiene & Turnout',
    maxTotal: 35,
    factors: [
      { key: 'personalHygiene', label: 'Personal hygiene', max: 7 },
      { key: 'dressTurnout', label: 'Dress / turnout', max: 7 },
      { key: 'properDressOccasion', label: 'Proper dress for occasion', max: 7 },
      { key: 'footwear', label: 'Footwear', max: 7 },
      { key: 'careOfBelongings', label: 'Care of belongings', max: 7 }
    ]
  },
  
  // Category C: Study Discipline (Toye)
  studyDiscipline: {
    label: 'Study Discipline (Toye)',
    maxTotal: 12,
    factors: [
      { key: 'toye1', label: 'Toye 1', max: 6 },
      { key: 'toye2', label: 'Toye 2', max: 6 }
    ]
  },
  
  // Category D: Sports & Activities
  sportsActivities: {
    label: 'Sports & Activities',
    maxTotal: 10,
    factors: [
      { key: 'sportsParticipation', label: 'Sports participation', max: 5 },
      { key: 'houseActivities', label: 'House activities', max: 5 }
    ]
  },
  
  // Category E: Academics
  academics: {
    label: 'Academics',
    maxTotal: 25,
    factors: [
      { key: 'testPerformance', label: 'Test performance', max: 10 },
      { key: 'homework', label: 'Homework', max: 5 },
      { key: 'classBehavior', label: 'Class behavior', max: 5 },
      { key: 'improvement', label: 'Improvement', max: 5 }
    ]
  },
  
  // Category F: Penalty System (Deductions)
  penalties: {
    label: 'Penalty System',
    subcategories: {
      minorOffences: {
        label: 'Minor Offences',
        maxDeduction: -4,
        factors: [
          { key: 'abusiveLanguage', label: 'Abusive language', deduction: -1 },
          { key: 'lying', label: 'Lying', deduction: -1 },
          { key: 'littering', label: 'Littering', deduction: -1 },
          { key: 'takingFoodWithoutPermission', label: 'Taking food without permission', deduction: -1 }
        ]
      },
      seriousOffences: {
        label: 'Serious Offences',
        maxDeduction: -16,
        factors: [
          { key: 'fighting', label: 'Fighting', deduction: -2 },
          { key: 'bullying', label: 'Bullying', deduction: -2 },
          { key: 'stealing', label: 'Stealing', deduction: -2 },
          { key: 'unauthorizedItems', label: 'Unauthorized items', deduction: -2 },
          { key: 'breakingIntoRooms', label: 'Breaking into rooms', deduction: -2 },
          { key: 'damagingProperty', label: 'Damaging property', deduction: -2 },
          { key: 'harmingOthers', label: 'Harming others', deduction: -2 },
          { key: 'misconducting', label: 'Misconducting', deduction: -2 }
        ]
      },
      majorOffences: {
        label: 'Major Offences',
        maxDeduction: -20,
        factors: [
          { key: 'smoking', label: 'Smoking', deduction: -5 },
          { key: 'drugs', label: 'Drugs', deduction: -5 },
          { key: 'otherHarassment', label: 'Other / Harassment', deduction: -10 }
        ]
      }
    }
  },
  
  // Category G: Bonus
  bonus: {
    label: 'Bonus (Optional)',
    maxTotal: 16,
    factors: [
      { key: 'bestCleanliness', label: 'Best cleanliness', max: 4 },
      { key: 'noLatecomersWeek', label: 'No latecomers (week)', max: 4 },
      { key: 'competitionWinner', label: 'Competition winner', max: 4 },
      { key: 'perfectDisciplineWeek', label: 'Perfect discipline week', max: 4 }
    ]
  }
};

// Grand total calculation
export const GRAND_TOTAL_MAX = 100; // 50+35+12+10+25 = 132, but with penalties and bonus, effective max is ~100