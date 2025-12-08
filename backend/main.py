from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.simulation import run_monte_carlo

app = FastAPI(title="TradeMind Quant Engine")

# 1. CORS Configuration (Allow React Frontend to Connect)
origins = [
    "http://localhost:5173", # Vite Default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Data Model (Type Safety for Inputs)
class SimRequest(BaseModel):
    starting_equity: float
    win_rate: float # 0 to 100
    avg_win: float
    avg_loss: float
    risk_per_trade: float # 1 to 5 usually
    num_simulations: int = 1000
    num_trades: int = 50

@app.get("/")
def read_root():
    return {"status": "TradeMind Quant Engine Online"}

@app.post("/api/simulate")
def simulate_strategy(params: SimRequest):
    """
    Endpoint to run Monte Carlo simulations.
    Receives trade stats, returns 3 equity curves (Best, Median, Worst).
    """
    try:
        # Pass data to our heavy-lifting NumPy engine
        result = run_monte_carlo(
            starting_equity=params.starting_equity,
            win_rate=params.win_rate,
            avg_win=params.avg_win,
            avg_loss=params.avg_loss,
            risk_per_trade_percent=params.risk_per_trade,
            num_simulations=params.num_simulations,
            num_trades=params.num_trades
        )
        return result
    except Exception as e:
        # Log error internally and return 500
        print(f"Simulation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))