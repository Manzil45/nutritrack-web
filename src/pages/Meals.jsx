import { useState, useEffect, useCallback } from "react";
import SavedMealCard from "../components/SavedMealCard";
import { mealsApi } from "../api/meals";
import { toast } from "../utils/toast";
import { MealCardShimmer } from "../components/Shimmer";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    image: "",
    servingSize: "1 serving"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealsApi.searchMeals(searchQuery);
      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setMeals([]);
    } finally {
      setLoading(false);
    }
}, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchMeals(), 300);
    return () => clearTimeout(timeoutId);
  }, [fetchMeals]);

  const handleCreateMeal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await mealsApi.saveCustomFood({
        ...newMeal,
        calories: Number(newMeal.calories),
        protein: Number(newMeal.protein),
        carbs: Number(newMeal.carbs),
        fat: Number(newMeal.fat)
      });
      setShowAddModal(false);
      const savedName = newMeal.name;
      setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "", image: "", servingSize: "1 serving" });
      fetchMeals();
      toast(`"${savedName}" saved to library!`);
    } catch (err) {
      console.error(err);
      toast("Failed to create meal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-3 block">
              Personal Library
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-on-surface">
              Saved Meals
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                className="pl-11 pr-4 py-3 bg-white shadow-sm border border-outline-variant/10 rounded-full text-sm focus:ring-2 focus:ring-primary w-full md:w-64 transition-all outline-none"
                placeholder="Search your library..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
        {/* Add New Card */}
        <div
          onClick={() => setShowAddModal(true)}
          className="group border-2 border-dashed border-outline-variant/30 rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all hover:bg-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 cursor-pointer min-h-[400px]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
            <span className="material-symbols-outlined text-3xl">add_circle</span>
          </div>
          <h3 className="font-bold text-on-surface text-lg font-headline">New Meal</h3>
          <p className="text-xs text-slate-500 text-center mt-2 max-w-[150px]">
            Save a custom recipe to your personal library
          </p>
        </div>

        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <MealCardShimmer key={i} />
          ))
        ) : (
          meals.map((meal) => (
            <SavedMealCard key={meal._id} {...meal} />
          ))
        )}

        {!loading && meals.length === 0 && searchQuery && (
          <div className="col-span-full text-center py-20">
            <p className="text-slate-400 font-medium">No matches found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-headline">New Recipe</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Meal Name</label>
                <input 
                  required
                  placeholder="e.g. Avocado Toast"
                  className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                  value={newMeal.name}
                  onChange={e => setNewMeal({...newMeal, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Calories</label>
                  <input 
                    type="number" required
                    placeholder="kcal"
                    className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                    value={newMeal.calories}
                    onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Protein (g)</label>
                  <input 
                    type="number" required
                    placeholder="grams"
                    className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                    value={newMeal.protein}
                    onChange={e => setNewMeal({...newMeal, protein: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Carbs (g)</label>
                  <input 
                    type="number" required
                    placeholder="grams"
                    className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                    value={newMeal.carbs}
                    onChange={e => setNewMeal({...newMeal, carbs: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Fat (g)</label>
                  <input 
                    type="number" required
                    placeholder="grams"
                    className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                    value={newMeal.fat}
                    onChange={e => setNewMeal({...newMeal, fat: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Image URL</label>
                <input 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-5 py-3 bg-slate-50 border border-transparent focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                  value={newMeal.image}
                  onChange={e => setNewMeal({...newMeal, image: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 mt-2 shadow-lg shadow-primary/10"
              >
                {isSubmitting ? "Creating Recipe..." : "Save to Library"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
