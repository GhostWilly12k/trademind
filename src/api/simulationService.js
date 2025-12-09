/**
 * Simulation Service
 * Connects to the Python/FastAPI backend for heavy Monte Carlo calculations.
 */

const API_URL = import.meta.env.VITE_SIM_API_URL; // Your Python Server

export const SimulationService = {
  /**
   * Run a Monte Carlo simulation
   * @param {object} params - { starting_equity, win_rate, avg_win, avg_loss, risk_per_trade, num_simulations }
   */
  async runSimulation(params) {
    try {
      const response = await fetch(`${API_URL}/api/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Simulation server error");
      }

      return await response.json();
    } catch (error) {
      console.error("Simulation Failed:", error);
      // Return null or handle error gracefully in UI
      throw error;
    }
  }
};