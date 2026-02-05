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
        
        return {"ticker": request.ticker.upper(), "data": candlestick_data}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
