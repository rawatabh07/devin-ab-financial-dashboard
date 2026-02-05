from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StockRequest(BaseModel):
    ticker: str
    start_date: date
    end_date: date


class CandlestickData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


@app.get("/")
def read_root():
    return {"message": "Financial Dashboard API"}


@app.post("/api/stock-data")
def get_stock_data(request: StockRequest):
    try:
        ticker = yf.Ticker(request.ticker)
        df = ticker.history(start=request.start_date, end=request.end_date)
        
        if df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for ticker '{request.ticker}' in the specified date range"
            )
        
        candlestick_data = []
        for index, row in df.iterrows():
            candlestick_data.append({
                "date": index.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })
        
        info = ticker.info
        latest_close = candlestick_data[-1]["close"]
        prev_close = candlestick_data[-2]["close"] if len(candlestick_data) >= 2 else latest_close
        daily_change = round(latest_close - prev_close, 2)
        daily_change_pct = round((daily_change / prev_close) * 100, 2) if prev_close != 0 else 0.0
        avg_volume = int(sum(d["volume"] for d in candlestick_data) / len(candlestick_data))

        kpis = {
            "current_price": latest_close,
            "daily_change": daily_change,
            "daily_change_pct": daily_change_pct,
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": avg_volume,
            "market_cap": info.get("marketCap"),
        }

        return {"ticker": request.ticker.upper(), "data": candlestick_data, "kpis": kpis}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
