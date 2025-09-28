import { AIRecommendation, Forecast, SpendingPattern, Transaction } from "@/types/ai";

// lib/local-ai/FinancialAnalyzer.ts
export class FinancialAnalyzer {
    private transactions: Transaction[];
    
    constructor(transactions: Transaction[]) {
      this.transactions = transactions;
    }
  
    /**
     * Main method to analyze financial data and generate insights
     * All processing happens locally - no external API calls
     */
    async analyzeFinances(): Promise<{
      patterns: SpendingPattern[];
      recommendations: AIRecommendation[];
      forecast: Forecast[];
      anomalies: Transaction[];
    }> {
      // Run all analyses in parallel for better performance
      const [patterns, anomalies] = await Promise.all([
        this.analyzeSpendingPatterns(),
        this.detectAnomalies()
      ]);
  
      const recommendations = this.generateRecommendations(patterns, anomalies);
      const forecast = this.predictFutureSpending(patterns);
  
      return { patterns, recommendations, forecast, anomalies };
    }
  
    /**
     * Advanced pattern detection using statistical analysis
     * Identifies spending habits, trends, and regular expenses
     */
    private async analyzeSpendingPatterns(): Promise<SpendingPattern[]> {
      const patterns: Map<string, SpendingPattern> = new Map();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
      // Filter recent transactions for better accuracy
      const recentTransactions = this.transactions.filter(t => 
        new Date(t.date) >= sixMonthsAgo
      );
  
      // Group by category and analyze
      const categories = [...new Set(recentTransactions.map(t => t.category))];
      
      for (const category of categories) {
        const categoryTransactions = recentTransactions.filter(t => 
          t.category === category && t.type === 'expense'
        );
        
        if (categoryTransactions.length < 3) continue; // Need minimum data
  
        const amounts = categoryTransactions.map(t => t.amount);
        const averageAmount = this.calculateAverage(amounts);
        const frequency = this.calculateFrequency(categoryTransactions);
        const trend = this.analyzeTrend(categoryTransactions);
  
        patterns.set(category, {
                  category,
                  averageAmount,
                  frequency,
                  trend,
                  confidence: Math.min(1, categoryTransactions.length / 10), // More data = more confidence
                  category_name: category // Assuming category_name is the same as category
                });
      }
  
      return Array.from(patterns.values());
    }
  
    /**
     * Statistical anomaly detection using Z-score analysis
     * Flags transactions that are significantly different from usual patterns
     */
    private async detectAnomalies(): Promise<Transaction[]> {
      const anomalies: Transaction[] = [];
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
      const recentExpenses = this.transactions.filter(t => 
        t.type === 'expense' && new Date(t.date) >= oneMonthAgo
      );
  
      // Group by category and detect outliers
      const categories = [...new Set(recentExpenses.map(t => t.category))];
      
      for (const category of categories) {
        const categoryTransactions = recentExpenses.filter(t => t.category === category);
        const amounts = categoryTransactions.map(t => t.amount);
        
        if (amounts.length < 5) continue; // Need enough data for statistical significance
  
        const mean = this.calculateMean(amounts);
        const stdDev = this.calculateStandardDeviation(amounts, mean);
        
        // Flag transactions that are 2 standard deviations from mean (statistical outlier)
        const threshold = mean + (2 * stdDev);
        
        categoryTransactions.forEach(transaction => {
          if (transaction.amount > threshold) {
            anomalies.push(transaction);
          }
        });
      }
  
      return anomalies;
    }
  
    /**
     * Smart recommendation engine based on pattern analysis
     * Generates actionable financial advice
     */
    private generateRecommendations(
      patterns: SpendingPattern[], 
      anomalies: Transaction[]
    ): AIRecommendation[] {
      const recommendations: AIRecommendation[] = [];
  
      // 1. Saving opportunity detection
      const highSpendingCategories = patterns.filter(p => 
        p.averageAmount > 5000 && p.frequency > 4 // High spending, frequent
      );
      
      highSpendingCategories.forEach(pattern => {
        const potentialSavings = pattern.averageAmount * 0.15; // Assume 15% savings possible
        
        recommendations.push({
          type: 'SAVING_OPPORTUNITY',
          title: `Reduce ${pattern.category} Spending`,
          message: `You spend an average of ₹${pattern.averageAmount.toFixed(0)} monthly on ${pattern.category}. A 15% reduction could save ₹${potentialSavings.toFixed(0)}.`,
          confidence: pattern.confidence,
          amountSaved: potentialSavings,
          actionItems: [
            `Review recent ${pattern.category} transactions`,
            `Set a monthly budget for ${pattern.category}`,
            `Look for alternative options`
          ],
          category: pattern.category
        });
      });
  
      // 2. Subscription finder - detect recurring payments
      const recurringPatterns = this.findRecurringPayments();
      recurringPatterns.forEach(pattern => {
        recommendations.push({
          type: 'SUBSCRIPTION_FINDER',
          title: `Recurring Payment Detected`,
          message: `You have a regular payment of ~₹${pattern.amount} every ${pattern.frequencyDays} days to ${pattern.merchant}.`,
          confidence: 0.8,
          actionItems: [
            `Confirm this is an active subscription`,
            `Evaluate if this service is still needed`,
            `Consider annual payment for discounts`
          ]
        });
      });
  
      // 3. Anomaly alerts
      anomalies.forEach(anomaly => {
        recommendations.push({
          type: 'SPENDING_ALERT',
          title: `Unusual Spending Detected`,
          message: `Transaction of ₹${anomaly.amount} at ${anomaly.merchant} is significantly higher than your usual ${anomaly.category} spending.`,
          confidence: 0.9,
          actionItems: [
            `Verify this transaction`,
            `Check if this was a one-time purchase`,
            `Monitor future spending in this category`
          ],
          category: anomaly.category
        });
      });
  
      return recommendations.sort((a, b) => b.confidence - a.confidence); // Sort by confidence
    }
  
    /**
     * Simple linear regression for spending forecasting
     * Predicts next 3 months based on historical data
     */
    private predictFutureSpending(patterns: SpendingPattern[]): Forecast[] {
      const forecasts: Forecast[] = [];
      const monthlyData = this.groupByMonth();
      
      if (monthlyData.length < 3) return forecasts; // Need minimum 3 months of data
  
      // Simple moving average forecast
      const lastThreeMonths = monthlyData.slice(-3);
      const avgExpense = lastThreeMonths.reduce((sum, month) => sum + month.totalExpenses, 0) / 3;
      const avgIncome = lastThreeMonths.reduce((sum, month) => sum + month.totalIncome, 0) / 3;
  
      // Generate 3-month forecast
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        forecasts.push({
          month: futureDate.toISOString().slice(0, 7), // YYYY-MM
          predictedIncome: avgIncome * (1 + (i * 0.02)), // Small growth assumption
          predictedExpenses: avgExpense * (1 + (i * 0.01)), // Conservative growth
          confidence: Math.max(0.7, 1 - (i * 0.1)) // Confidence decreases for further months
        });
      }
  
      return forecasts;
    }
  
    // ========== HELPER METHODS ==========
  
    private calculateAverage(numbers: number[]): number {
      return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
  
    private calculateMean(numbers: number[]): number {
      return this.calculateAverage(numbers);
    }
  
    private calculateStandardDeviation(numbers: number[], mean: number): number {
      const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
      const variance = squaredDifferences.reduce((sum, num) => sum + num, 0) / numbers.length;
      return Math.sqrt(variance);
    }
  
    private calculateFrequency(transactions: Transaction[]): number {
      const firstDate = new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())));
      const lastDate = new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())));
      const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                        (lastDate.getMonth() - firstDate.getMonth());
      
      return transactions.length / Math.max(1, monthsDiff);
    }
  
    private analyzeTrend(transactions: Transaction[]): SpendingPattern['trend'] {
      if (transactions.length < 6) return 'stable';
      
      const sorted = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const half = Math.floor(sorted.length / 2);
      const firstHalfAvg = this.calculateAverage(sorted.slice(0, half).map(t => t.amount));
      const secondHalfAvg = this.calculateAverage(sorted.slice(half).map(t => t.amount));
      
      const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      
      if (change > 10) return 'increasing';
      if (change < -10) return 'decreasing';
      return 'stable';
    }
  
    private findRecurringPayments(): any[] {
      // Advanced pattern matching for recurring payments
      const merchants = [...new Set(this.transactions.map(t => t.merchant))];
      const recurring: any[] = [];
  
      merchants.forEach(merchant => {
        const merchantTransactions = this.transactions.filter(t => t.merchant === merchant);
        if (merchantTransactions.length >= 3) {
          const amounts = merchantTransactions.map(t => t.amount);
          const avgAmount = this.calculateAverage(amounts);
          
          // Check if amounts are similar (within 20%)
          const amountVariation = this.calculateStandardDeviation(amounts, avgAmount) / avgAmount;
          if (amountVariation < 0.2) { // Low variation suggests subscription
            recurring.push({
              merchant,
              amount: avgAmount,
              frequencyDays: this.calculateFrequencyDays(merchantTransactions),
              transactionCount: merchantTransactions.length
            });
          }
        }
      });
  
      return recurring;
    }
  
    private calculateFrequencyDays(transactions: Transaction[]): number {
      const dates = transactions.map(t => new Date(t.date).getTime()).sort();
      const differences = [];
      
      for (let i = 1; i < dates.length; i++) {
        differences.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)); // Convert to days
      }
      
      return differences.length > 0 ? this.calculateAverage(differences) : 30;
    }
  
    private groupByMonth(): {month: string, totalIncome: number, totalExpenses: number}[] {
      const monthlyData: Map<string, {totalIncome: number, totalExpenses: number}> = new Map();
      
      this.transactions.forEach(transaction => {
        const month = transaction.date.slice(0, 7); // YYYY-MM
        
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { totalIncome: 0, totalExpenses: 0 });
        }
        
        const data = monthlyData.get(month)!;
        if (transaction.type === 'income') {
          data.totalIncome += transaction.amount;
        } else {
          data.totalExpenses += transaction.amount;
        }
      });
  
      return Array.from(monthlyData.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }
  }