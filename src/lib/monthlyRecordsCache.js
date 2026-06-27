const cache = new Map();
const BATCH_SIZE = 12;

function cacheKey(studentId, year, month) {
  return `${studentId}_${year}_${String(month).padStart(2, '0')}`;
}

export function readMonthlyCache(studentId, year, month) {
  return cache.get(cacheKey(studentId, year, month));
}

export function writeMonthlyCache(studentId, year, month, records) {
  cache.set(cacheKey(studentId, year, month), records);
}

/**
 * Fetch monthly records for many students with in-memory cache and batched requests.
 */
export async function fetchBulkMonthlyRecords(students, year, month, getMonthlyRecords) {
  const result = {};
  const uncached = [];

  students.forEach(student => {
    const cached = readMonthlyCache(student.id, year, month);
    if (cached !== undefined) {
      result[student.id] = cached;
    } else {
      uncached.push(student);
    }
  });

  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (student) => {
        const records = await getMonthlyRecords(student.id, year, month).catch(() => []);
        writeMonthlyCache(student.id, year, month, records);
        return [student.id, records];
      })
    );
    batchResults.forEach(([id, records]) => {
      result[id] = records;
    });
  }

  return result;
}
