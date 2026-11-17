import Dexie from 'dexie';

export const db = new Dexie('NutriLiveDB_v3');

db.version(1).stores({
  meals: '++id, dateKey, mealType, diningContext, updatedAt',
  goals: 'key'
});

export function getTodayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let initPromise = null;

export function initializeNutritionDB() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const seeded = await db.goals.get('seeded');
    if (seeded) return;

    await db.goals.bulkPut([
      { key: 'calorieTarget', value: 2000 },
      { key: 'proteinTarget', value: 120 },
      { key: 'caffeineLimit', value: 300 }
    ]);

    const today = getTodayKey(0);

    await db.meals.bulkAdd([
      {
        dateKey: today,
        title: 'Oat Flat White & Scrambled Eggs',
        mealType: 'Breakfast',
        calories: 440,
        protein: 24,
        caffeine: 130,
        note: 'Two eggs on sourdough toast with an oat flat white.',
        diningContext: 'Home-Cooked',
        lat: 55.8440,
        lon: -4.4300,
        placeName: 'Lady Lane, Paisley',
        photo: null,
        updatedAt: Date.now() - 3600000
      },
      {
        dateKey: today,
        title: 'Grilled Chicken & Avocado Bowl',
        mealType: 'Lunch/Dinner',
        calories: 650,
        protein: 46,
        caffeine: 0,
        note: 'High-protein lunch bowl with brown rice and sesame dressing.',
        diningContext: 'Dining Out',
        lat: 55.8458,
        lon: -4.4241,
        placeName: 'High Street, Paisley',
        photo: null,
        updatedAt: Date.now() - 1200000
      }
    ]);

    await db.goals.put({ key: 'seeded', value: true });
  })();

  return initPromise;
}