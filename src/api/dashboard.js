// import api from '../config/api';

// export const dashboardApi = {
//   async getDashboardSummary(date) {
//     try {
//       const response = await api.get('/analytics/trends', { params: { range: 'daily', date } });
//       const logs = response.data.data || [];
//       const userGoals = response.data.goals || { calories: 2000, protein: 150, carbs: 250, fat: 60 };
      
//       let calories = 0, protein = 0, carbs = 0, fats = 0;
      
//       logs.forEach(log => {
//         if (log.totalNutrients) {
//           calories += log.totalNutrients.calories || 0;
//           protein += log.totalNutrients.protein || 0;
//           carbs += log.totalNutrients.carbs || 0;
//           fats += log.totalNutrients.fat || 0;
//         }
//       });

//       const baseGoal = userGoals.calories;

//       return {
//         summary: {
//           caloriesLeft: Math.max(baseGoal - calories, 0),
//           baseGoal: baseGoal,
//           exercise: 0,
//           food: calories,
//           goalProgress: Math.min(Math.floor((calories / baseGoal) * 100), 100),
//           recommendation: calories > baseGoal ? "You've exceeded your daily target." : "Keep logging your meals to track your progress!"
//         },
//         macros: {
//           carbs: { consumed: carbs, target: userGoals.carbs, percentage: Math.min(Math.floor((carbs/userGoals.carbs)*100), 100) },
//           protein: { consumed: protein, target: userGoals.protein, percentage: Math.min(Math.floor((protein/userGoals.protein)*100), 100) },
//           fats: { consumed: fats, target: userGoals.fat, percentage: Math.min(Math.floor((fats/userGoals.fat)*100), 100) }
//         },
//         meals: logs
//       };
//     } catch (err) {
//       console.error(err);
//       const fallbackGoal = 2000;
//       return {
//         summary: { caloriesLeft: fallbackGoal, baseGoal: fallbackGoal, exercise: 0, food: 0, goalProgress: 0, recommendation: "Error connecting to backend" },
//         macros: { carbs: { consumed: 0, target: 250, percentage: 0 }, protein: { consumed: 0, target: 150, percentage: 0 }, fats: { consumed: 0, target: 60, percentage: 0 } },
//         meals: []
//       };
//     }
//   }
// };



import api from '../config/api';

export const dashboardApi = {
  async getDashboardSummary(date) {
    try {
      const response = await api.get(
        '/api/analytics/trends',
        {
          params: {
            range: 'daily',
            date
          }
        }
      );

      const logs = response.data.data || [];

      const userGoals =
        response.data.goals || {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 60
        };

      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fats = 0;

      logs.forEach((log) => {
        if (log.totalNutrients) {
          calories +=
            log.totalNutrients.calories || 0;

          protein +=
            log.totalNutrients.protein || 0;

          carbs +=
            log.totalNutrients.carbs || 0;

          fats +=
            log.totalNutrients.fat || 0;
        }
      });

      const baseGoal = userGoals.calories;

      return {
        summary: {
          caloriesLeft: Math.max(
            baseGoal - calories,
            0
          ),

          baseGoal,

          exercise: 0,

          food: calories,

          goalProgress: Math.min(
            Math.floor(
              (calories / baseGoal) * 100
            ),
            100
          ),

          recommendation:
            calories > baseGoal
              ? "You've exceeded your daily target."
              : 'Keep logging your meals to track your progress!'
        },

        macros: {
          carbs: {
            consumed: carbs,
            target: userGoals.carbs,
            percentage: Math.min(
              Math.floor(
                (carbs / userGoals.carbs) * 100
              ),
              100
            )
          },

          protein: {
            consumed: protein,
            target: userGoals.protein,
            percentage: Math.min(
              Math.floor(
                (protein / userGoals.protein) * 100
              ),
              100
            )
          },

          fats: {
            consumed: fats,
            target: userGoals.fat,
            percentage: Math.min(
              Math.floor(
                (fats / userGoals.fat) * 100
              ),
              100
            )
          }
        },

        meals: logs
      };
    } catch (err) {
      console.error(err);

      const fallbackGoal = 2000;

      return {
        summary: {
          caloriesLeft: fallbackGoal,
          baseGoal: fallbackGoal,
          exercise: 0,
          food: 0,
          goalProgress: 0,
          recommendation:
            'Error connecting to backend'
        },

        macros: {
          carbs: {
            consumed: 0,
            target: 250,
            percentage: 0
          },

          protein: {
            consumed: 0,
            target: 150,
            percentage: 0
          },

          fats: {
            consumed: 0,
            target: 60,
            percentage: 0
          }
        },

        meals: []
      };
    }
  }
};


