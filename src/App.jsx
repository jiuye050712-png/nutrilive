import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Utensils,
  Wifi,
  WifiOff,
  Plus,
  Flame,
  Coffee,
  Dumbbell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Zap
} from 'lucide-react';
import { db, initializeNutritionDB, getTodayKey } from './db/db';
import { useGeolocation } from './hooks/useGeolocation';
import MealCamera from './components/MealCamera';
import LiveMealCard from './components/LiveMealCard';
import MealMap from './components/MealMap';

const QUICK_PRESETS = [
  { title: 'Americano', mealType: 'Coffee/Snack', calories: 15, protein: 0, caffeine: 150 },
  { title: 'Oat Latte', mealType: 'Coffee/Snack', calories: 140, protein: 3, caffeine: 110 },
  { title: '2 Boiled Eggs', mealType: 'Breakfast', calories: 155, protein: 13, caffeine: 0 },
  { title: 'Chicken Rice Bowl', mealType: 'Lunch/Dinner', calories: 620, protein: 45, caffeine: 0 },
  { title: 'Whey Protein Shake', mealType: 'Coffee/Snack', calories: 130, protein: 25, caffeine: 0 }
];

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dayOffset, setDayOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [selectedMapMealId, setSelectedMapMealId] = useState(null);

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('Lunch/Dinner');
  const [calories, setCalories] = useState(500);
  const [protein, setProtein] = useState(30);
  const [caffeine, setCaffeine] = useState(0);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);

  const selectedDateKey = getTodayKey(dayOffset);

  const {
    coords,
    placeName,
    gpsStatus,
    distanceFromHome,
    diningContext,
    syncLocation,
    setAsHomeKitchen
  } = useGeolocation();

  const meals =
    useLiveQuery(
      () =>
        db.meals
          .where('dateKey')
          .equals(selectedDateKey)
          .reverse()
          .sortBy('updatedAt'),
      [selectedDateKey]
    ) || [];

  const calorieGoal = useLiveQuery(() => db.goals.get('calorieTarget'), []);
  const proteinGoal = useLiveQuery(() => db.goals.get('proteinTarget'), []);
  const caffeineGoal = useLiveQuery(() => db.goals.get('caffeineLimit'), []);

  useEffect(() => {
    initializeNutritionDB();
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCaffeine = meals.reduce((sum, m) => sum + m.caffeine, 0);
  const homeCookedCount = meals.filter((m) => m.diningContext === 'Home-Cooked').length;
  const homeCookedPct =
    meals.length > 0 ? Math.round((homeCookedCount / meals.length) * 100) : 0;

  const targetCal = calorieGoal?.value || 2000;
  const targetPro = proteinGoal?.value || 120;
  const limitCaf = caffeineGoal?.value || 300;

  const updateGoal = (key, val) => {
    const num = Math.max(50, Number(val) || 0);
    db.goals.put({ key, value: num });
  };

  const applyGoalPreset = (cal, pro, caf) => {
    db.goals.bulkPut([
      { key: 'calorieTarget', value: cal },
      { key: 'proteinTarget', value: pro },
      { key: 'caffeineLimit', value: caf }
    ]);
  };

  const smartAdvice = useMemo(() => {
    const tips = [];
    const currentHour = new Date().getHours();
    const proteinGap = targetPro - totalProtein;
    const calRemaining = targetCal - totalCalories;

    if (meals.length === 0) {
      tips.push('No meals logged for this date yet. Use Quick-Log chips below for 1-tap tracking.');
      return tips;
    }

    if (proteinGap > 20) {
      tips.push(
        `Protein deficit: ${proteinGap}g remaining. Add ~150g chicken breast, Greek yogurt, or a whey shake.`
      );
    } else if (proteinGap > 0) {
      tips.push(`Almost at protein target (${totalProtein}/${targetPro}g) — just ${proteinGap}g left.`);
    } else {
      tips.push(`Daily protein target achieved (${totalProtein}g). Muscle synthesis supported.`);
    }

    if (totalCaffeine > limitCaf) {
      tips.push(
        `Caffeine limit exceeded (${totalCaffeine}/${limitCaf}mg). Switch to water or herbal tea.`
      );
    } else if (dayOffset === 0 && currentHour >= 14 && totalCaffeine >= 150) {
      tips.push(
        `Afternoon caffeine alert (${totalCaffeine}mg logged after 14:00) — avoid further coffee to protect deep sleep.`
      );
    } else if (calRemaining < 0) {
      tips.push(
        `Calorie budget exceeded by ${Math.abs(calRemaining)} kcal. Keep the next meal light and fiber-rich.`
      );
    } else {
      tips.push(
        `${calRemaining} kcal remaining today · ${homeCookedPct}% home-cooked ratio.`
      );
    }

    return tips;
  }, [
    meals.length,
    totalCalories,
    totalProtein,
    totalCaffeine,
    targetCal,
    targetPro,
    limitCaf,
    homeCookedPct,
    dayOffset
  ]);

  const handleQuickPreset = async (preset) => {
    await db.meals.add({
      dateKey: selectedDateKey,
      title: preset.title,
      mealType: preset.mealType,
      calories: preset.calories,
      protein: preset.protein,
      caffeine: preset.caffeine,
      note: 'Quick-logged item.',
      diningContext,
      lat: coords.latitude,
      lon: coords.longitude,
      placeName,
      photo: null,
      updatedAt: Date.now()
    });
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await db.meals.add({
      dateKey: selectedDateKey,
      title: title.trim(),
      mealType,
      calories: Number(calories),
      protein: Number(protein),
      caffeine: Number(caffeine),
      note: note.trim(),
      diningContext,
      lat: coords.latitude,
      lon: coords.longitude,
      placeName,
      photo,
      updatedAt: Date.now()
    });

    setTitle('');
    setNote('');
    setPhoto(null);
    setCalories(500);
    setProtein(30);
    setCaffeine(0);
    setShowAddForm(false);
  };

  const visibleMeals =
    activeFilter === 'All'
      ? meals
      : meals.filter((m) => m.mealType === activeFilter);

  const selectedMapMeal = meals.find((m) => m.id === selectedMapMealId) || null;

  const dateLabel =
    dayOffset === 0
      ? `Today · ${selectedDateKey}`
      : dayOffset === -1
      ? `Yesterday · ${selectedDateKey}`
      : selectedDateKey;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#0b0f19] pb-14">
      <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">NutriLive</h1>
            <p className="text-[11px] text-slate-400">Personal Nutrition & Geo Log</p>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border ${
            isOnline
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : 'bg-amber-950/80 text-amber-300 border-amber-700'
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'Local + Sync' : 'Offline Mode'}
        </div>
      </header>

      <main className="p-4 space-y-3.5">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800 px-2 py-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedMapMealId(null);
              setDayOffset((d) => d - 1);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-200 font-mono">{dateLabel}</span>

          <button
            type="button"
            disabled={dayOffset >= 0}
            onClick={() => {
              setSelectedMapMealId(null);
              setDayOffset((d) => Math.min(0, d + 1));
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Daily Energy
              </span>
              <div className="text-2xl font-extrabold text-white mt-0.5">
                {totalCalories}
                <span className="text-xs font-normal text-slate-400"> / {targetCal} kcal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGoalEditor((v) => !v)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Goals
            </button>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                totalCalories > targetCal ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, (totalCalories / targetCal) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-400" /> Protein
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {totalProtein}/{targetPro}g
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.min(100, (totalProtein / targetPro) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-rose-400" /> Caffeine
                </span>
                <span className="font-mono font-bold text-rose-300">
                  {totalCaffeine}/{limitCaf}mg
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    totalCaffeine > limitCaf ? 'bg-rose-500' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.min(100, (totalCaffeine / limitCaf) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {showGoalEditor && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Quick Presets:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyGoalPreset(1650, 130, 250)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300"
                  >
                    Fat Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGoalPreset(2000, 120, 300)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300"
                  >
                    Balanced
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGoalPreset(2600, 160, 300)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-sky-300"
                  >
                    Muscle Gain
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="bg-slate-950 border border-slate-800 rounded-xl p-2 block">
                  <span className="text-[10px] text-slate-400 block">Calories</span>
                  <input
                    type="number"
                    value={targetCal}
                    onChange={(e) => updateGoal('calorieTarget', e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5"
                  />
                </label>
                <label className="bg-slate-950 border border-slate-800 rounded-xl p-2 block">
                  <span className="text-[10px] text-slate-400 block">Protein (g)</span>
                  <input
                    type="number"
                    value={targetPro}
                    onChange={(e) => updateGoal('proteinTarget', e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5"
                  />
                </label>
                <label className="bg-slate-950 border border-slate-800 rounded-xl p-2 block">
                  <span className="text-[10px] text-slate-400 block">Caffeine (mg)</span>
                  <input
                    type="number"
                    value={limitCaf}
                    onChange={(e) => updateGoal('caffeineLimit', e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5"
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> Nutrition Guidance
          </div>
          <ul className="space-y-1 text-xs text-slate-200 leading-relaxed">
            {smartAdvice.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <MealMap
          coords={coords}
          placeName={placeName}
          meals={meals}
          selectedMeal={selectedMapMeal}
          diningContext={diningContext}
          distanceFromHome={distanceFromHome}
          gpsStatus={gpsStatus}
          isOnline={isOnline}
          onSetHome={setAsHomeKitchen}
          onSyncLocation={syncLocation}
          onClearSelectedMeal={() => setSelectedMapMealId(null)}
        />

        <section className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-0.5">
            <Zap className="w-3 h-3 text-amber-400" /> 1-Tap Quick Log
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleQuickPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{preset.title}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Breakfast', 'Lunch/Dinner', 'Coffee/Snack'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeFilter === tab
                    ? 'bg-white text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'Lunch/Dinner' ? 'Meals' : tab === 'Coffee/Snack' ? 'Drinks' : tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Custom
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddMeal}
            className="rounded-2xl bg-slate-900 border border-amber-400/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Custom Meal Entry</h2>
              <span className="text-[11px] text-emerald-400 truncate max-w-[55%]">
                @ {placeName}
              </span>
            </div>

            <input
              type="text"
              required
              placeholder="Dish or drink name (e.g., Salmon Poke Bowl)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch/Dinner">Lunch/Dinner</option>
                <option value="Coffee/Snack">Coffee/Snack</option>
              </select>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3">
                <span className="text-xs text-slate-400">kcal:</span>
                <input
                  type="number"
                  min="0"
                  max="2500"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-400">Protein(g):</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-400">Caffeine(mg):</span>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={caffeine}
                  onChange={(e) => setCaffeine(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Optional notes or ingredients..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white resize-none"
            />

            <MealCamera photo={photo} onPhotoChange={setPhoto} />

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Entry
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="space-y-3">
          {visibleMeals.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 text-center space-y-1">
              <p className="text-sm text-slate-300">No entries recorded for this view.</p>
              <p className="text-xs text-slate-500">
                Tap a 1-Tap Quick Log chip above or click + Custom.
              </p>
            </div>
          ) : (
            visibleMeals.map((meal) => (
              <LiveMealCard
                key={meal.id}
                meal={meal}
                isSelectedOnMap={selectedMapMealId === meal.id}
                onSelectOnMap={(m) => setSelectedMapMealId(m.id)}
                currentDiningContext={diningContext}
                currentCoords={coords}
                currentPlaceName={placeName}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}