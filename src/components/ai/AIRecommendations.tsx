// components/ai/AIRecommendations.tsx
'use client';

import { useState, useEffect } from 'react';
import { FinancialAnalyzer } from '@/lib/local-ai/FinancialAnalyzer';
import { AIRecommendation, Forecast, SpendingPattern, Transaction } from '@/types/ai';
// import {  } from '@/types/ai';

interface AIRecommendationsProps {
  transactions: Transaction[];
}

/**
 * AIRecommendations - Local AI-powered financial insights
 * 100% private - all processing happens in the browser
 * Provides personalized recommendations, forecasts, and spending patterns
 */
export function AIRecommendations({ transactions }: AIRecommendationsProps) {
  const [insights, setInsights] = useState<{
    recommendations: AIRecommendation[];
    forecast: Forecast[];
    patterns: SpendingPattern[];
    isLoading: boolean;
    error?: string;
  }>({
    recommendations: [],
    forecast: [],
    patterns: [],
    isLoading: true
  });

  useEffect(() => {
    const analyzeData = async () => {
      try {
        setInsights(prev => ({ ...prev, isLoading: true }));
        
        // All AI processing happens locally in the browser - no data sent to servers
        const analyzer = new FinancialAnalyzer(transactions);
        const analysis = await analyzer.analyzeFinances();
        
        setInsights({
          recommendations: analysis.recommendations,
          forecast: analysis.forecast,
          patterns: analysis.patterns,
          isLoading: false
        });
      } catch (error) {
        console.error('AI analysis failed:', error);
        setInsights(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to analyze data locally' 
        }));
      }
    };

    // Only analyze if we have sufficient data
    if (transactions.length > 10) {
      analyzeData();
    } else {
      setInsights(prev => ({ ...prev, isLoading: false }));
    }
  }, [transactions]);

  // Loading state
  if (insights.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Analyzing your spending patterns locally...</span>
        </div>
        <p className="text-sm text-gray-500 text-center mt-2">
          🔒 100% private - analyzing {transactions.length} transactions from your database
        </p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((transactions.length / 50) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Error state
  if (insights.error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <div className="text-lg mb-2">⚠️</div>
          <p>Analysis failed: {insights.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // Insufficient data state
  if (transactions.length < 10) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-medium text-gray-900 mb-2">Need More Data</h3>
          <p>We need at least 10 transactions to generate meaningful AI insights</p>
          <p className="text-sm mt-1">Currently have {transactions.length} transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Recommendations Section */}
      <RecommendationsSection recommendations={insights.recommendations} />
      
      {/* Spending Forecast Section */}
      <ForecastSection forecast={insights.forecast} />
      
      {/* Spending Patterns Section */}
      <SpendingPatternsSection patterns={insights.patterns} />
    </div>
  );
}

// Sub-component: Recommendations List
function RecommendationsSection({ recommendations }: { recommendations: AIRecommendation[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SAVING_OPPORTUNITY': return '💰';
      case 'SPENDING_ALERT': return '🚨';
      case 'BUDGET_ADJUSTMENT': return '📊';
      case 'SUBSCRIPTION_FINDER': return '🔄';
      default: return '💡';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'SAVING_OPPORTUNITY': return 'border-green-400';
      case 'SPENDING_ALERT': return 'border-red-400';
      case 'BUDGET_ADJUSTMENT': return 'border-blue-400';
      case 'SUBSCRIPTION_FINDER': return 'border-purple-400';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          💡 AI Recommendations
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Local AI • Your Data
          </span>
        </h3>
        <p className="text-sm text-gray-600">Personalized insights from your transaction history</p>
      </div>
      
      <div className="p-6 space-y-4">
        {recommendations.slice(0, 5).map((rec, index) => (
          <div 
            key={index} 
            className={`border-l-4 ${getBorderColor(rec.type)} pl-4 py-3 bg-gray-50 rounded-r-lg`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <span className="text-xl">{getIcon(rec.type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                  {rec.amountSaved && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Potential savings: ₹{rec.amountSaved.toFixed(0)}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                {Math.round(rec.confidence * 100)}% confidence
              </span>
            </div>
            
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggested actions:</p>
              <div className="flex flex-wrap gap-2">
                {rec.actionItems.map((action: string, i: number) => (
                  <span 
                    key={i}
                    className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎉</div>
            <p>Great job! No issues detected in your spending patterns.</p>
            <p className="text-sm mt-1">Keep up the good financial habits!</p>
          </div>
        )}

        {recommendations.length > 5 && (
          <div className="text-center pt-4 border-t">
            <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              Show {recommendations.length - 5} more recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component: Forecast Display
function ForecastSection({ forecast }: { forecast: Forecast[] }) {
  if (forecast.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        📈 AI Spending Forecast
        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
          Next 3 Months
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.map((forecast, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600 mb-3">
              {new Date(forecast.month + '-01').toLocaleDateString('en-IN', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            
            <div className="space-y-2">
              <div className="text-green-600 font-semibold text-lg">
                ₹{forecast.predictedIncome.toLocaleString('en-IN')}
                <div className="text-xs font-normal text-green-500">Income</div>
              </div>
              
              <div className="text-red-600 font-semibold text-lg">
                ₹{forecast.predictedExpenses.toLocaleString('en-IN')}
                <div className="text-xs font-normal text-red-500">Expenses</div>
              </div>
              
              <div className={`text-lg font-bold ${
                (forecast.predictedIncome - forecast.predictedExpenses) >= 0 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                ₹{(forecast.predictedIncome - forecast.predictedExpenses).toLocaleString('en-IN')}
                <div className="text-xs font-normal">Net Balance</div>
              </div>
            </div>
            
            {/* Confidence Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Confidence</span>
                <span>{Math.round(forecast.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${forecast.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on your historical spending patterns and trends
      </div>
    </div>
  );
}

// Sub-component: Spending Patterns
function SpendingPatternsSection({ patterns }: { patterns: SpendingPattern[] }) {
  if (patterns.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        📊 AI-Detected Spending Patterns
        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
          {patterns.length} Patterns
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.slice(0, 6).map((pattern, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="font-medium text-gray-900">{pattern.category_name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                pattern.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                pattern.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {pattern.trend === 'increasing' ? '📈 Increasing' :
                 pattern.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Average Spending:</span>
                <span className="font-semibold">₹{pattern.averageAmount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Frequency:</span>
                <span className="font-semibold">{pattern.frequency.toFixed(1)}x/month</span>
              </div>
              
              <div className="flex justify-between">
                <span>AI Confidence:</span>
                <span className="font-semibold">{Math.round(pattern.confidence * 100)}%</span>
              </div>
            </div>
            
            {/* Pattern insights */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {pattern.trend === 'increasing' && `Spending on ${pattern.category_name} is trending upward`}
                {pattern.trend === 'decreasing' && `Spending on ${pattern.category_name} is decreasing`}
                {pattern.trend === 'stable' && `Spending on ${pattern.category_name} is stable`}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {patterns.length > 6 && (
        <div className="text-center mt-4 pt-4 border-t">
          <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            View all {patterns.length} patterns
          </button>
        </div>
      )}
    </div>
  );
}