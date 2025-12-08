import numpy as np

def run_monte_carlo(
    starting_equity: float,
    win_rate: float,       # 0.0 to 100.0 (Percentage)
    avg_win: float,
    avg_loss: float,
    risk_per_trade_percent: float,
    num_simulations: int = 1000,
    num_trades: int = 50
):
    """
    Runs Monte Carlo simulations to predict future equity curves using NumPy vectorization.
    """
    
    # Validation / Safety Checks
    if starting_equity <= 0:
        starting_equity = 1000 # Default fallback
    
    # Convert percentages to decimals
    win_prob = win_rate / 100.0
    risk_decimal = risk_per_trade_percent / 100.0
    
    # 1. Generate the Matrix of Outcomes [simulations x trades]
    # We generate 50,000 random numbers instantly (1000 sims * 50 trades)
    rng = np.random.default_rng()
    # True = Win, False = Loss
    win_loss_matrix = rng.random((num_simulations, num_trades)) < win_prob
    
    # 2. Calculate P&L per trade
    # R-Multiple = Reward / Risk. If you risk $100 to make $200, R is 2.
    # Avoid division by zero if avg_loss is 0
    if avg_loss == 0:
        r_multiple = 0 if avg_win == 0 else 1 # Fallback
    else:
        r_multiple = abs(avg_win / avg_loss)
        
    # We simulate equity curves using an iterative approach for compounding
    # (Vectorizing fully dynamic compounding is complex, so we iterate trades but vectorize simulations)
    
    # Initialize results matrix: [simulations x (trades + 1)]
    # Column 0 is the starting equity
    equity_curves = np.zeros((num_simulations, num_trades + 1))
    equity_curves[:, 0] = starting_equity
    
    current_equity = np.full(num_simulations, starting_equity)
    
    for t in range(num_trades):
        # Calculate risk amount based on current equity (Compounding!)
        risk_amounts = current_equity * risk_decimal
        
        # Determine trade result:
        # If Win: profit = risk * r_multiple
        # If Loss: loss = risk (negative)
        pnl = np.where(
            win_loss_matrix[:, t], 
            risk_amounts * r_multiple, 
            -risk_amounts
        )
        
        current_equity += pnl
        
        # Bankruptcy Guard: Equity cannot go below 0
        current_equity = np.maximum(current_equity, 0)
        
        # Store step result
        equity_curves[:, t + 1] = current_equity

    # 3. Statistical Analysis
    final_equities = equity_curves[:, -1]
    
    # Risk of Ruin: % of simulations that lost > 50% of starting capital
    ruin_threshold = starting_equity * 0.5
    ruin_count = np.sum(final_equities < ruin_threshold)
    risk_of_ruin = (ruin_count / num_simulations) * 100
    
    # Percentiles for the "Cone" visualization
    # 10th percentile (Worst Case scenarios)
    # 50th percentile (Median/Expected scenarios)
    # 90th percentile (Best Case scenarios)
    percentiles = np.percentile(equity_curves, [10, 50, 90], axis=0)
    
    return {
        "metrics": {
            "risk_of_ruin": round(risk_of_ruin, 2),
            "median_equity": round(float(np.median(final_equities)), 2),
            "min_equity": round(float(np.min(final_equities)), 2),
            "max_equity": round(float(np.max(final_equities)), 2),
            "starting_equity": starting_equity
        },
        "chart_data": {
            # Convert NumPy arrays to standard lists for JSON serialization
            "worst_case": np.round(percentiles[0], 2).tolist(),
            "median_case": np.round(percentiles[1], 2).tolist(),
            "best_case": np.round(percentiles[2], 2).tolist()
        }
    }