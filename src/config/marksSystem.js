// ─── Role Definitions ────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN:          'admin',
  HOUSEMASTER:    'housemaster',
  HOUSEMISTRESS:  'housemistress',
  TEACHER:        'teacher',
  PE_HEAD:        'peHead',
  SKILLS_HEAD:    'skillsHead',
  ACTIVITIES_HEAD:'activitiesHead',
  HOUSE_TEAM:     'houseTeam',
};

export const ROLE_LABELS = {
  admin:         'Admin',
  housemaster:   'Housemaster/AHM',
  housemistress: 'Housemistress',
  teacher:       'Teacher',
  peHead:        'PE Head',
  skillsHead:    'Skills Head',
  activitiesHead:'Activities Head',
  houseTeam:     'House Team',
};

// Which roles can VIEW all students across the entire institution (no house/class restriction)
// Head roles get full read-only view; Admin gets full systemic access
export const FULL_VIEW_ROLES = ['admin', 'peHead', 'skillsHead', 'activitiesHead'];

// Head roles that have global read access but domain-scoped write access
export const HEAD_ROLES = ['peHead', 'skillsHead', 'activitiesHead'];

// Domain sections each head role is authorised to write
export const HEAD_ROLE_DOMAIN = {
  peHead:         ['D'],
  skillsHead:     ['F'],
  activitiesHead: ['G'],
};

// Sections each role can EDIT (write access)
export const ROLE_SECTION_PERMISSIONS = {
  admin:         ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'penalties', 'bonus'],
  housemaster:   ['A', 'C', 'penalties', 'bonus'],
  houseTeam:     ['A', 'C'],
  housemistress: ['B'],
  teacher:       ['E'],
  peHead:        ['D'],
  skillsHead:    ['F'],
  activitiesHead:['G'],
};

// ─── Marks System ─────────────────────────────────────────────────────────────

export const MARKS_SYSTEM = {

  // A. Daily Routine Discipline  (HM / AHM / House Team)
  dailyRoutine: {
    label: 'Daily Routine Discipline',
    section: 'A',
    filledBy: ['housemaster', 'houseTeam', 'admin'],
    maxTotal: 50,
    factors: [
      { key: 'wakeUpOnTime',         label: 'Wake-up on time',          max: 7 },
      { key: 'breakfastLineup',      label: 'Breakfast lineup',         max: 7 },
      { key: 'schoolLineup',         label: 'School lineup',            max: 6 },
      { key: 'lunchLineup',          label: 'Lunch lineup',             max: 6 },
      { key: 'maghribLineup',        label: 'Maghrib lineup',           max: 7 },
      { key: 'diningHallDiscipline', label: 'Dining hall discipline',   max: 7 },
      { key: 'lightsOut',            label: 'Lights out',               max: 7 },
      { key: 'generalBehavior',      label: 'General behavior',         max: 3 },
    ],
  },

  // B. Hygiene & Turnout  (Housemistress)
  hygiene: {
    label: 'Hygiene & Turnout',
    section: 'B',
    filledBy: ['housemistress', 'housemaster', 'admin'],
    maxTotal: 35,
    factors: [
      { key: 'personalHygiene',     label: 'Personal hygiene',          max: 7 },
      { key: 'dressTurnout',        label: 'Dress / turnout',           max: 7 },
      { key: 'properDressOccasion', label: 'Proper dress for occasion', max: 7 },
      { key: 'footwear',            label: 'Footwear',                  max: 7 },
      { key: 'careOfBelongings',    label: 'Care of belongings',        max: 7 },
    ],
  },

  // C. Study Discipline — Toye  (House Team)
  studyDiscipline: {
    label: 'Study Discipline (Toye)',
    section: 'C',
    filledBy: ['houseTeam', 'housemaster', 'admin'],
    maxTotal: 12,
    factors: [
      { key: 'toye1', label: 'Toye 1', max: 6 },
      { key: 'toye2', label: 'Toye 2', max: 6 },
    ],
  },

  // D. Sports & Activities  (PE Head) — qualitative, no numeric total
  sportsActivities: {
    label: 'Sports & Activities',
    section: 'D',
    filledBy: ['peHead', 'admin'],
    maxTotal: 0,
    qualitative: true,
    fields: [
      { key: 'sportsParticipation', label: 'Sports participation',  type: 'select',
        options: ['Excellent', 'Good', 'Average', 'Poor', 'Absent'] },
      { key: 'houseActivities',     label: 'House activities',      type: 'select',
        options: ['Participated', 'Not Participated'] },
      { key: 'fitnessLevel',        label: 'Fitness level',         type: 'select',
        options: ['Over', 'Under', 'Normal'] },
      { key: 'bmi',                 label: 'BMI (Body Mass Index)', type: 'number' },
      { key: 'gameParticipated',    label: 'Game name participated',type: 'text'   },
      { key: 'games',               label: 'Games',                 type: 'text'   },
    ],
  },

  // E. Academics  (Teacher — per subject)
  academics: {
    label: 'Academics',
    section: 'E',
    filledBy: ['teacher', 'admin'],
    maxTotal: 25,
    factors: [
      { key: 'testPerformance', label: 'Test performance', max: 10 },
      { key: 'homework',        label: 'Homework',         max: 5  },
      { key: 'classBehavior',   label: 'Class behavior',   max: 5  },
      { key: 'improvement',     label: 'Improvement',      max: 5  },
    ],
    penalties: [
      { key: 'classBunking', label: 'Class bunking', deduction: -1 },
    ],
  },

  // F. Skills Program  (Skills Head) — 5 marks/day, up to 12 days
  skillsProgram: {
    label: 'Skills Program',
    section: 'F',
    filledBy: ['skillsHead', 'admin'],
    maxPerDay: 5,
    totalDays: 12,
  },

  // G. Events & Activities  (Activities Head)
  events: {
    label: 'Events & Activities',
    section: 'G',
    filledBy: ['activitiesHead', 'admin'],
    eventList: [
      { key: 'essayWritS',       label: 'Essay Writing (Senior)'    },
      { key: 'essayWritJ',       label: 'Essay Writing (Junior)'    },
      { key: 'declamationS',     label: 'Declamation (Senior)'      },
      { key: 'declamationJ',     label: 'Declamation (Junior)'      },
      { key: 'extemporeSpeechS', label: 'Extempore Speech (Senior)' },
      { key: 'extemporeSpeechJ', label: 'Extempore Speech (Junior)' },
      { key: 'eloJunior',        label: 'ELO Junior'                },
      { key: 'eloSenior',        label: 'ELO Senior'                },
      { key: 'art',              label: 'Art'                       },
      { key: 'intNaatQritS',     label: 'Int Naat & Qrit (Senior)'  },
      { key: 'soloSinging',      label: 'Solo Singing'              },
      { key: 'intGenious',       label: 'Int Genious'               },
    ],
  },

  // Penalty System  (HM / AHM)
  penalties: {
    label: 'Penalty System',
    filledBy: ['housemaster', 'admin'],
    subcategories: {
      minorOffences: {
        label: 'Minor Offences',
        maxDeduction: -4,
        factors: [
          { key: 'abusiveLanguage',            label: 'Abusive language',               deduction: -1 },
          { key: 'lying',                      label: 'Lying',                          deduction: -1 },
          { key: 'littering',                  label: 'Littering',                      deduction: -1 },
          { key: 'takingFoodWithoutPermission', label: 'Taking food without permission', deduction: -1 },
        ],
      },
      seriousOffences: {
        label: 'Serious Offences',
        maxDeduction: -16,
        factors: [
          { key: 'fighting',          label: 'Fighting',            deduction: -2 },
          { key: 'bullying',          label: 'Bullying',            deduction: -2 },
          { key: 'stealing',          label: 'Stealing',            deduction: -2 },
          { key: 'unauthorizedItems', label: 'Unauthorized items',  deduction: -2 },
          { key: 'breakingIntoRooms', label: 'Breaking into rooms', deduction: -2 },
          { key: 'damagingProperty',  label: 'Damaging property',   deduction: -2 },
          { key: 'harmingOthers',     label: 'Harming others',      deduction: -2 },
          { key: 'misconducting',     label: 'Misconducting',       deduction: -2 },
        ],
      },
      majorOffences: {
        label: 'Major Offences',
        maxDeduction: -20,
        factors: [
          { key: 'smoking',         label: 'Smoking',            deduction: -5  },
          { key: 'drugs',           label: 'Drugs',              deduction: -5  },
          { key: 'otherHarassment', label: 'Other / Harassment', deduction: -10 },
        ],
      },
    },
  },

  // Bonus Points  (HM)
  bonus: {
    label: 'Bonus Points',
    filledBy: ['housemaster', 'admin'],
    maxTotal: 16,
    factors: [
      { key: 'bestCleanliness',       label: 'Best cleanliness',        max: 4 },
      { key: 'noLatecomersWeek',      label: 'No latecomers (week)',    max: 4 },
      { key: 'competitionWinner',     label: 'Competition winner',      max: 4 },
      { key: 'perfectDisciplineWeek', label: 'Perfect discipline week', max: 4 },
    ],
  },
};

// A(50) + B(35) + C(12) + E(25) + Skills(15 = 3 weeks × 5) = 137
export const GRAND_TOTAL_MAX = 137;

// Houses list for dropdowns
export const HOUSES = ['Qarshi', 'Abaseen', 'ZH', 'Saigol', 'Mehran', 'Ghani', 'Sanobar', 'AJ'];

// Grade / class options
export const GRADES = ['5a', '6a', '7a', '7b', '8a', '8b', '8c', '9a', '9b', '9c', '9d', '10a', '10b', '10c', '10d'];

// Maximum classes a teacher can be assigned
export const MAX_TEACHER_CLASSES = 5;
