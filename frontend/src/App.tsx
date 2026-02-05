import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface StockDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockResponse {
  ticker: string
  data: StockDataPoint[]
}

function App() {
  const [ticker, setTicker] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stockData, setStockData] = useState<StockResponse | null>(null)
  
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !stockData || stockData.data.length === 0) {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      return
    }

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#4b5563',
      },
    })

    chartRef.current = chart

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    })

    const chartData: CandlestickData<Time>[] = stockData.data.map((item) => ({
      time: item.date as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))

    candlestickSeries.setData(chartData)
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [stockData])

  const fetchStockData = async () => {
    if (!ticker || !startDate || !endDate) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post<StockResponse>(`${API_URL}/api/stock-data`, {
        ticker: ticker.toUpperCase(),
        start_date: startDate,
        end_date: endDate,
      })
      setStockData(response.data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || 'Failed to fetch stock data')
      } else {
        setError('Failed to fetch stock data')
      }
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Financial Dashboard</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ticker Symbol</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchStockData}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Fetch Data'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              {error}
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6" style={{ display: stockData ? 'block' : 'none' }}>
          <h2 className="text-xl font-semibold mb-4">
            {stockData ? stockData.ticker : ''} Stock Price
          </h2>
          <div ref={chartContainerRef} className="w-full" />
        </div>
      </div>
    </div>
  )
}

export default App
