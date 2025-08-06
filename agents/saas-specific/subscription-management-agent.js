/**
 * Subscription Management Agent
 * Handles billing, invoicing, plan upgrades/downgrades, payment processing
 */

class SubscriptionManagementAgent {
  constructor(config = {}) {
    this.name = 'Subscription Management Agent';
    this.config = {
      currency: 'JPY',
      billingCycles: ['monthly', 'annual'],
      paymentMethods: ['credit_card', 'bank_transfer', 'digital_wallet'],
      taxRegions: ['japan'],
      gracePeriod: 7, // days
      ...config
    };
    this.subscriptionPlans = [];
    this.customers = [];
    this.subscriptions = [];
    this.invoices = [];
    this.paymentMethods = [];
  }

  createSubscriptionPlans(marketResearch, pricingStrategy) {
    const plans = [
      {
        id: 'basic',
        name: 'ベーシック',
        nameEn: 'Basic',
        description: '小規模店舗向けの基本プラン',
        price: {
          monthly: 9800,
          annual: 98000
        },
        currency: 'JPY',
        features: [
          'max_stores: 1',
          'staff_accounts: 5',
          'monthly_visits: 1000',
          'basic_analytics: true',
          'mobile_app: true',
          'email_support: true'
        ],
        limitations: {
          stores: 1,
          staff: 5,
          visits_per_month: 1000
        },
        trial: {
          enabled: true,
          duration: 14 // days
        }
      },
      {
        id: 'professional',
        name: 'プロフェッショナル',
        nameEn: 'Professional',
        description: '中規模店舗向けの充実プラン',
        price: {
          monthly: 24800,
          annual: 248000
        },
        currency: 'JPY',
        features: [
          'max_stores: 3',
          'staff_accounts: 15',
          'monthly_visits: 5000',
          'advanced_analytics: true',
          'mobile_app: true',
          'priority_support: true',
          'custom_branding: true',
          'integration_api: true'
        ],
        limitations: {
          stores: 3,
          staff: 15,
          visits_per_month: 5000
        },
        trial: {
          enabled: true,
          duration: 14
        }
      },
      {
        id: 'enterprise',
        name: 'エンタープライズ',
        nameEn: 'Enterprise',
        description: '大規模チェーン店向けの最上位プラン',
        price: {
          monthly: 49800,
          annual: 498000
        },
        currency: 'JPY',
        features: [
          'max_stores: 10',
          'staff_accounts: 50',
          'monthly_visits: 20000',
          'advanced_analytics: true',
          'mobile_app: true',
          'dedicated_support: true',
          'custom_branding: true',
          'integration_api: true',
          'white_label: true',
          'sso: true',
          'custom_reports: true'
        ],
        limitations: {
          stores: 10,
          staff: 50,
          visits_per_month: 20000
        },
        trial: {
          enabled: true,
          duration: 30
        }
      }
    ];

    this.subscriptionPlans = plans;
    return plans;
  }

  createSubscription(customerId, planId, billingCycle, startDate = new Date()) {
    const plan = this.subscriptionPlans.find(p => p.id === planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const subscription = {
      id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      planId,
      planName: plan.name,
      status: 'active',
      billingCycle,
      amount: plan.price[billingCycle],
      currency: plan.currency,
      startDate: startDate.toISOString(),
      nextBillingDate: this.calculateNextBillingDate(startDate, billingCycle),
      endDate: null,
      trialEnd: plan.trial.enabled ? 
        new Date(startDate.getTime() + plan.trial.duration * 24 * 60 * 60 * 1000).toISOString() : 
        null,
      metadata: {
        features: plan.features,
        limitations: plan.limitations
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.subscriptions.push(subscription);
    this.scheduleNextInvoice(subscription);
    return subscription;
  }

  upgradeSubscription(subscriptionId, newPlanId, upgradeType = 'immediate') {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const newPlan = this.subscriptionPlans.find(p => p.id === newPlanId);
    if (!newPlan) throw new Error('New plan not found');

    const upgrade = {
      subscriptionId,
      fromPlan: subscription.planId,
      toPlan: newPlanId,
      upgradeType,
      effectiveDate: upgradeType === 'immediate' ? new Date() : new Date(subscription.nextBillingDate),
      priceDifference: newPlan.price[subscription.billingCycle] - subscription.amount,
      prorationCredit: this.calculateProration(subscription, newPlan),
      processedAt: new Date().toISOString()
    };

    if (upgradeType === 'immediate') {
      subscription.planId = newPlanId;
      subscription.planName = newPlan.name;
      subscription.amount = newPlan.price[subscription.billingCycle];
      subscription.metadata.features = newPlan.features;
      subscription.metadata.limitations = newPlan.limitations;
      subscription.updatedAt = new Date().toISOString();

      // Generate prorated invoice if needed
      if (upgrade.priceDifference > 0) {
        this.generateUpgradeInvoice(subscription, upgrade);
      }
    } else {
      // Schedule upgrade for next billing cycle
      this.scheduleUpgrade(subscription, newPlan, upgrade);
    }

    return upgrade;
  }

  downgradeSubscription(subscriptionId, newPlanId, downgradeType = 'end_of_period') {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const newPlan = this.subscriptionPlans.find(p => p.id === newPlanId);
    if (!newPlan) throw new Error('New plan not found');

    const downgrade = {
      subscriptionId,
      fromPlan: subscription.planId,
      toPlan: newPlanId,
      downgradeType,
      effectiveDate: downgradeType === 'immediate' ? new Date() : new Date(subscription.nextBillingDate),
      savings: subscription.amount - newPlan.price[subscription.billingCycle],
      processedAt: new Date().toISOString()
    };

    if (downgradeType === 'immediate') {
      subscription.planId = newPlanId;
      subscription.planName = newPlan.name;
      subscription.amount = newPlan.price[subscription.billingCycle];
      subscription.metadata.features = newPlan.features;
      subscription.metadata.limitations = newPlan.limitations;
      subscription.updatedAt = new Date().toISOString();

      // Credit will be applied to next invoice
      subscription.creditBalance = (subscription.creditBalance || 0) + 
        this.calculateProration(subscription, newPlan);
    } else {
      this.scheduleDowngrade(subscription, newPlan, downgrade);
    }

    return downgrade;
  }

  generateInvoice(subscriptionId, invoiceDate = new Date()) {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const customer = this.customers.find(c => c.id === subscription.customerId);
    if (!customer) throw new Error('Customer not found');

    const invoice = {
      id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: this.generateInvoiceNumber(),
      customerId: subscription.customerId,
      subscriptionId,
      status: 'pending',
      amount: subscription.amount,
      currency: subscription.currency,
      tax: this.calculateTax(subscription.amount, customer.taxRegion),
      total: null,
      dueDate: this.calculateDueDate(invoiceDate),
      paidAt: null,
      items: [
        {
          description: `${subscription.planName} - ${subscription.billingCycle === 'monthly' ? '月額' : '年額'}プラン`,
          quantity: 1,
          unitPrice: subscription.amount,
          amount: subscription.amount
        }
      ],
      billingPeriod: {
        start: invoiceDate.toISOString(),
        end: this.calculatePeriodEnd(invoiceDate, subscription.billingCycle)
      },
      paymentMethod: customer.defaultPaymentMethod,
      metadata: {
        planId: subscription.planId,
        billingCycle: subscription.billingCycle
      },
      createdAt: invoiceDate.toISOString(),
      updatedAt: invoiceDate.toISOString()
    };

    // Apply credits if available
    if (subscription.creditBalance && subscription.creditBalance > 0) {
      const creditApplied = Math.min(subscription.creditBalance, invoice.amount);
      invoice.items.push({
        description: 'アカウントクレジット',
        quantity: 1,
        unitPrice: -creditApplied,
        amount: -creditApplied
      });
      subscription.creditBalance -= creditApplied;
    }

    invoice.total = invoice.amount + invoice.tax - (subscription.creditBalance || 0);
    this.invoices.push(invoice);
    return invoice;
  }

  processPayment(invoiceId, paymentDetails) {
    const invoice = this.invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const paymentResult = {
      invoiceId,
      amount: invoice.total,
      currency: invoice.currency,
      paymentMethod: paymentDetails.method,
      status: 'pending',
      transactionId: null,
      processedAt: new Date().toISOString(),
      failureReason: null
    };

    try {
      // Simulate payment processing
      const transactionResult = this.processPaymentMethod(paymentDetails, invoice.total);
      
      if (transactionResult.success) {
        paymentResult.status = 'completed';
        paymentResult.transactionId = transactionResult.transactionId;
        
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        
        // Update subscription next billing date
        const subscription = this.subscriptions.find(s => s.id === invoice.subscriptionId);
        if (subscription) {
          subscription.nextBillingDate = this.calculateNextBillingDate(
            new Date(invoice.billingPeriod.end), 
            subscription.billingCycle
          );
        }
      } else {
        paymentResult.status = 'failed';
        paymentResult.failureReason = transactionResult.error;
        invoice.status = 'payment_failed';
        
        this.handlePaymentFailure(invoice);
      }
    } catch (error) {
      paymentResult.status = 'failed';
      paymentResult.failureReason = error.message;
      invoice.status = 'payment_failed';
    }

    return paymentResult;
  }

  handlePaymentFailure(invoice) {
    const subscription = this.subscriptions.find(s => s.id === invoice.subscriptionId);
    if (!subscription) return;

    // Add to grace period
    subscription.status = 'past_due';
    subscription.gracePeriodEnd = new Date(
      Date.now() + this.config.gracePeriod * 24 * 60 * 60 * 1000
    ).toISOString();

    // Schedule retry
    this.schedulePaymentRetry(invoice, 1); // First retry after 1 day
    
    // Notify customer
    this.sendPaymentFailureNotification(invoice);
  }

  cancelSubscription(subscriptionId, cancellationType = 'end_of_period', reason = null) {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const cancellation = {
      subscriptionId,
      type: cancellationType,
      reason,
      requestedAt: new Date().toISOString(),
      effectiveDate: null,
      refundAmount: 0,
      processedAt: new Date().toISOString()
    };

    if (cancellationType === 'immediate') {
      subscription.status = 'canceled';
      subscription.endDate = new Date().toISOString();
      cancellation.effectiveDate = new Date().toISOString();
      
      // Calculate refund for remaining period
      cancellation.refundAmount = this.calculateRefund(subscription);
      
      if (cancellation.refundAmount > 0) {
        this.processRefund(subscription, cancellation.refundAmount);
      }
    } else {
      subscription.status = 'canceled';
      subscription.endDate = subscription.nextBillingDate;
      cancellation.effectiveDate = subscription.nextBillingDate;
    }

    return cancellation;
  }

  // Usage tracking and billing
  trackUsage(subscriptionId, usageType, quantity, timestamp = new Date()) {
    const subscription = this.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const usage = {
      subscriptionId,
      type: usageType, // 'visits', 'stores', 'staff'
      quantity,
      timestamp: timestamp.toISOString(),
      billingPeriod: this.getCurrentBillingPeriod(subscription, timestamp)
    };

    // Check if usage exceeds plan limits
    const limit = subscription.metadata.limitations[usageType];
    if (limit) {
      const currentUsage = this.getCurrentPeriodUsage(subscriptionId, usageType);
      if (currentUsage + quantity > limit) {
        return {
          success: false,
          error: 'Usage limit exceeded',
          currentUsage,
          limit,
          overage: (currentUsage + quantity) - limit
        };
      }
    }

    return { success: true, usage };
  }

  // Reporting and analytics
  generateSubscriptionReport(startDate, endDate) {
    const subscriptionsInPeriod = this.subscriptions.filter(sub => {
      const subStart = new Date(sub.createdAt);
      return subStart >= startDate && subStart <= endDate;
    });

    const report = {
      period: { start: startDate, end: endDate },
      metrics: {
        newSubscriptions: subscriptionsInPeriod.length,
        activeSubscriptions: this.subscriptions.filter(s => s.status === 'active').length,
        canceledSubscriptions: this.subscriptions.filter(s => s.status === 'canceled').length,
        revenue: this.calculatePeriodRevenue(startDate, endDate),
        churnRate: this.calculateChurnRate(startDate, endDate),
        mrr: this.calculateMRR(),
        arr: this.calculateARR(),
        averageRevenuePerUser: this.calculateARPU()
      },
      byPlan: this.getMetricsByPlan(),
      trends: this.analyzeTrends(startDate, endDate),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  // Utility methods
  calculateNextBillingDate(startDate, billingCycle) {
    const date = new Date(startDate);
    
    if (billingCycle === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date.toISOString();
  }

  calculateTax(amount, taxRegion) {
    const taxRates = {
      japan: 0.10 // 10% consumption tax
    };
    
    const rate = taxRates[taxRegion] || 0;
    return Math.round(amount * rate);
  }

  calculateProration(subscription, newPlan) {
    const daysRemaining = this.getDaysUntilNextBilling(subscription);
    const totalDays = subscription.billingCycle === 'monthly' ? 30 : 365;
    const unusedPortion = daysRemaining / totalDays;
    
    const currentPlanCost = subscription.amount * unusedPortion;
    const newPlanCost = newPlan.price[subscription.billingCycle] * unusedPortion;
    
    return newPlanCost - currentPlanCost;
  }

  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(this.invoices.length + 1).padStart(4, '0');
    return `${year}-${month}-${sequence}`;
  }

  // Integration methods
  exportForAnalyticsAgent() {
    return {
      subscriptions: this.subscriptions,
      revenue: this.calculateTotalRevenue(),
      metrics: this.getKeyMetrics(),
      trends: this.getSubscriptionTrends()
    };
  }

  exportForCustomerSupportAgent() {
    return {
      subscriptions: this.subscriptions,
      invoices: this.invoices,
      paymentIssues: this.getPaymentIssues(),
      cancellationReasons: this.getCancellationReasons()
    };
  }
}

module.exports = SubscriptionManagementAgent;