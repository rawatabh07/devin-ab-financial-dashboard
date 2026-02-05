# Financial Dashboard

A web application for visualizing stock price data using interactive candlestick charts.

## Overview

This financial dashboard allows users to:
- Enter a stock ticker symbol (e.g., AAPL, GOOGL, MSFT)
- Select a date range using start and end date pickers
- View historical stock price data displayed as a candlestick chart

## Tech Stack

### Backend
- **Python** with **FastAPI** - REST API framework
- **yfinance** - Yahoo Finance API wrapper for fetching stock data
- **Pandas** - Data manipulation

### Frontend
- **React** with **TypeScript** - UI framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **Lightweight Charts** - Candlestick chart visualization

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### POST /api/stock-data

Fetch stock data for a given ticker and date range.

**Request Body:**
```json
{
  "ticker": "AAPL",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "data": [
    {
      "date": "2024-01-02",
      "open": 185.50,
      "high": 186.20,
      "low": 184.80,
      "close": 185.90,
      "volume": 50000000
    }
  ]
}
```
