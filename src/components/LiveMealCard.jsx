import React, { useState } from 'react';
import {
  Trash2,
  MapPin,
  Home,
  Store,
  SlidersHorizontal,
  ChevronUp,
  Flame,
  Dumbbell,
  Coffee
} from 'lucide-react';
import { db } from '../db/db';
import MealCamera from './MealCamera';

const MEAL_TYPES = ['Breakfast', 'Lunch/Dinner', 'Coffee/Snack'];

export default function LiveMealCard({
  meal,
  isSelectedOnMap,
  onSelectOnMap,
  currentDiningContext,
  currentCoords,
  currentPlaceName
}) {
  const [expanded, setExpanded] = useState(false);

  const liveUpdate = (changes) => {
    db.meals.update(meal.id, {
      ...changes,
      updatedAt: Date.now()
    });
  };

  const syncCardLocation = (e) => {
    e.stopPropagation();
    liveUpdate({
      diningContext: currentDiningContext,
      lat: currentCoords.latitude,
      lon: currentCoords.longitude,
      placeName: currentPlaceName
    });
  };

  return (
    <article
      onClick={() => onSelectOnMap(meal)}
      className={`rounded-2xl bg-slate-900/95 border overflow-hidden transition-all cursor-pointer ${
        isSelectedOnMap
          ? 'border-amber-400 ring-1 ring-amber-400/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {meal.photo && (
        <div className="relative h-40 w-full bg-slate-950">
          <img
            src={meal.photo}
            alt={meal.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />
        </div>
      )}

      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {meal.mealType}
              </span>
              <span className="text-slate-600">·</span>
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  meal.diningContext === 'Home-Cooked'
                    ? 'text-emerald-400'
                    : 'text-sky-400'
                }`}
              >
                {meal.diningContext === 'Home-Cooked' ? (
                  <Home className="w-2.5 h-2.5" />
                ) : (
                  <Store className="w-2.5 h-2.5" />
                )}
                {meal.diningContext}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate">{meal.title}</h3>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] font-medium text-slate-200 flex items-center gap-1 shrink-0 border border-slate-700/70"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 text-amber-400" /> Done
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3 h-3 text-amber-400" /> Adjust
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <Flame className="w-3 h-3" /> {meal.calories} kcal
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
            <Dumbbell className="w-3 h-3" /> {meal.protein}g
          </span>
          {meal.caffeine > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
              <Coffee className="w-3 h-3" /> {meal.caffeine}mg
            </span>
          )}
        </div>

        {meal.note && <p className="text-xs text-slate-400 line-clamp-2">{meal.note}</p>}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span className="flex items-center gap-1 text-slate-400 truncate">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{meal.placeName || 'Logged Location'}</span>
          </span>
          <span className="shrink-0 font-mono">
            {new Date(meal.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {expanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-3 border-t border-slate-800 space-y-3"
          >
            <input
              type="text"
              value={meal.title}
              onChange={(e) => liveUpdate({ title: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
            />

            <div className="flex gap-1.5">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => liveUpdate({ mealType: type })}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-medium ${
                    meal.mealType === type
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-slate-950 p-3 space-y-2.5 border border-slate-800">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Calories</span>
                  <span className="text-amber-300 font-bold">{meal.calories} kcal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="10"
                  value={meal.calories}
                  onChange={(e) => liveUpdate({ calories: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Protein</span>
                    <span className="text-emerald-300 font-bold">{meal.protein}g</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={meal.protein}
                    onChange={(e) => liveUpdate({ protein: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Caffeine</span>
                    <span className="text-rose-300 font-bold">{meal.caffeine}mg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={meal.caffeine}
                    onChange={(e) => liveUpdate({ caffeine: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg accent-rose-400"
                  />
                </div>
              </div>
            </div>

            <textarea
              rows={2}
              value={meal.note}
              onChange={(e) => liveUpdate({ note: e.target.value })}
              placeholder="Add ingredients or notes..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 resize-none"
            />

            <MealCamera
              compact
              photo={meal.photo}
              onPhotoChange={(newPhoto) => liveUpdate({ photo: newPhoto })}
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={syncCardLocation}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" /> Update to current location
              </button>

              <button
                type="button"
                onClick={() => db.meals.delete(meal.id)}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}