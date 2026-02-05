import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { createChart, IChartApi, CandlestickData, HistogramData, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface StockDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface KPIs {
  current_price: number
  daily_change: number
  daily_change_pct: number
  fifty_two_week_high: number | null
  fifty_two_week_low: number | null
  avg_volume: number
  market_cap: number | null
}

interface StockResponse {
  ticker: string
  data: StockDataPoint[]
  kpis: KPIs
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return value.toLocaleString()
}

function formatVolume(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toLocaleString()
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
      height: 500,
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
      rightPriceScale: {
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    const volumeData: HistogramData<Time>[] = stockData.data.map((item) => ({
      time: item.date as Time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    }))

    volumeSeries.setData(volumeData)
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

  const kpis = stockData?.kpis
  const isPositive = kpis ? kpis.daily_change >= 0 : false

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

        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Current Price</p>
              <p className="text-2xl font-bold">${kpis.current_price.toFixed(2)}</p>
              <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{kpis.daily_change.toFixed(2)} ({isPositive ? '+' : ''}{kpis.daily_change_pct.toFixed(2)}%)
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">52-Week High / Low</p>
              <p className="text-lg font-bold text-green-400">{kpis.fifty_two_week_high != null ? `$${kpis.fifty_two_week_high.toFixed(2)}` : 'N/A'}</p>
              <p className="text-lg font-bold text-red-400">{kpis.fifty_two_week_low != null ? `$${kpis.fifty_two_week_low.toFixed(2)}` : 'N/A'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Avg Volume</p>
              <p className="text-2xl font-bold">{formatVolume(kpis.avg_volume)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Market Cap</p>
              <p className="text-2xl font-bold">{formatNumber(kpis.market_cap)}</p>
            </div>
          </div>
        )}
        
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
