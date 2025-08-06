/**
 * Risk Assessment Agent
 * Identifies technical and business risks, creates mitigation strategies
 */

class RiskAssessmentAgent {
  constructor(config = {}) {
    this.name = 'Risk Assessment Agent';
    this.config = {
      riskCategories: ['technical', 'business', 'operational', 'security', 'compliance'],
      impactLevels: ['low', 'medium', 'high', 'critical'],
      probabilityLevels: ['rare', 'unlikely', 'possible', 'likely', 'almost-certain'],
      riskTolerance: 'medium',
      ...config
    };
    this.identifiedRisks = [];
    this.mitigationStrategies = [];
    this.riskMatrix = null;
    this.contingencyPlans = [];
  }

  identifyTechnicalRisks(architecture, techStack, requirements) {
    const technicalRisks = [
      this.assessTechnologyRisks(techStack),
      this.assessArchitecturalRisks(architecture),
      this.assessPerformanceRisks(requirements),
      this.assessScalabilityRisks(architecture, requirements),
      this.assessIntegrationRisks(architecture),
      this.assessDataRisks(techStack.database)
    ].flat();

    technicalRisks.forEach(risk => {
      risk.category = 'technical';
      risk.identifiedDate = new Date().toISOString();
      this.identifiedRisks.push(risk);
    });

    return technicalRisks;
  }

  identifyBusinessRisks(marketResearch, financialProjections, timeline) {
    const businessRisks = [
      this.assessMarketRisks(marketResearch),
      this.assessFinancialRisks(financialProjections),
      this.assessTimelineRisks(timeline),
      this.assessCompetitionRisks(marketResearch.competitors),
      this.assessResourceRisks(),
      this.assessCustomerAdoptionRisks(marketResearch)
    ].flat();

    businessRisks.forEach(risk => {
      risk.category = 'business';
      risk.identifiedDate = new Date().toISOString();
      this.identifiedRisks.push(risk);
    });

    return businessRisks;
  }

  identifyOperationalRisks(team, processes, infrastructure) {
    const operationalRisks = [
      this.assessTeamRisks(team),
      this.assessProcessRisks(processes),
      this.assessInfrastructureRisks(infrastructure),
      this.assessMaintenanceRisks(),
      this.assessSupportRisks(),
      this.assessVendorRisks(infrastructure)
    ].flat();

    operationalRisks.forEach(risk => {
      risk.category = 'operational';
      risk.identifiedDate = new Date().toISOString();
      this.identifiedRisks.push(risk);
    });

    return operationalRisks;
  }

  identifySecurityRisks(architecture, dataTypes, integrations) {
    const securityRisks = [
      this.assessDataSecurityRisks(dataTypes),
      this.assessAuthenticationRisks(architecture),
      this.assessNetworkSecurityRisks(architecture),
      this.assessComplianceRisks(dataTypes),
      this.assessThirdPartyRisks(integrations),
      this.assessPrivacyRisks(dataTypes)
    ].flat();

    securityRisks.forEach(risk => {
      risk.category = 'security';
      risk.identifiedDate = new Date().toISOString();
      this.identifiedRisks.push(risk);
    });

    return securityRisks;
  }

  assessRisk(riskDescription, impact, probability, category) {
    const risk = {
      id: `RISK-${this.identifiedRisks.length + 1}`,
      description: riskDescription,
      category,
      impact: this.normalizeImpact(impact),
      probability: this.normalizeProbability(probability),
      riskScore: this.calculateRiskScore(impact, probability),
      riskLevel: null,
      identifiedDate: new Date().toISOString(),
      status: 'identified',
      owner: null,
      mitigationStrategies: [],
      contingencyPlan: null
    };

    risk.riskLevel = this.determineRiskLevel(risk.riskScore);
    this.identifiedRisks.push(risk);
    return risk;
  }

  createMitigationStrategy(riskId, strategy) {
    const mitigation = {
      id: `MIT-${this.mitigationStrategies.length + 1}`,
      riskId,
      strategy: strategy.description,
      type: strategy.type, // 'avoid', 'mitigate', 'transfer', 'accept'
      cost: strategy.estimatedCost || 0,
      timeframe: strategy.timeframe || 'immediate',
      effectiveness: strategy.effectiveness || 'medium',
      owner: strategy.owner || null,
      status: 'planned',
      implementationSteps: strategy.steps || [],
      successMetrics: strategy.metrics || [],
      createdDate: new Date().toISOString()
    };

    this.mitigationStrategies.push(mitigation);
    
    // Link to risk
    const risk = this.identifiedRisks.find(r => r.id === riskId);
    if (risk) {
      risk.mitigationStrategies.push(mitigation.id);
    }

    return mitigation;
  }

  generateRiskMatrix() {
    this.riskMatrix = {
      matrix: this.createMatrix(),
      summary: this.generateMatrixSummary(),
      priorityRisks: this.identifyPriorityRisks(),
      createdDate: new Date().toISOString()
    };

    return this.riskMatrix;
  }

  createContingencyPlan(riskId, plan) {
    const contingency = {
      id: `CONT-${this.contingencyPlans.length + 1}`,
      riskId,
      trigger: plan.trigger,
      actions: plan.actions,
      responsibleTeam: plan.team,
      timeline: plan.timeline,
      resources: plan.resources,
      successCriteria: plan.successCriteria,
      communicationPlan: plan.communication,
      status: 'prepared',
      createdDate: new Date().toISOString()
    };

    this.contingencyPlans.push(contingency);

    // Link to risk
    const risk = this.identifiedRisks.find(r => r.id === riskId);
    if (risk) {
      risk.contingencyPlan = contingency.id;
    }

    return contingency;
  }

  // Technical Risk Assessment Methods
  assessTechnologyRisks(techStack) {
    const risks = [];
    
    if (techStack.frontend?.name?.includes('React')) {
      risks.push({
        description: 'React ecosystem changes rapidly, potential breaking changes in updates',
        impact: 'medium',
        probability: 'possible',
        indicators: ['Major version releases', 'Deprecation warnings', 'Breaking changes in dependencies']
      });
    }

    if (techStack.backend?.name?.includes('Node.js')) {
      risks.push({
        description: 'Node.js single-threaded nature may cause performance bottlenecks',
        impact: 'high',
        probability: 'likely',
        indicators: ['CPU-intensive operations', 'High concurrent requests', 'Blocking operations']
      });
    }

    if (techStack.database?.name?.includes('MongoDB')) {
      risks.push({
        description: 'Schema-less design may lead to data inconsistency issues',
        impact: 'medium',
        probability: 'possible',
        indicators: ['Data validation errors', 'Migration complexities', 'Query performance issues']
      });
    }

    return risks;
  }

  assessArchitecturalRisks(architecture) {
    const risks = [];

    if (architecture.pattern === 'microservices') {
      risks.push({
        description: 'Microservices complexity may exceed team capability',
        impact: 'high',
        probability: 'possible',
        indicators: ['Service communication failures', 'Deployment complexity', 'Debugging difficulties']
      });
    }

    if (architecture.pattern === 'monolith') {
      risks.push({
        description: 'Monolithic architecture may limit scalability',
        impact: 'medium',
        probability: 'likely',
        indicators: ['Performance degradation', 'Deployment bottlenecks', 'Technology lock-in']
      });
    }

    return risks;
  }

  // Business Risk Assessment Methods
  assessMarketRisks(marketResearch) {
    const risks = [];
    
    if (marketResearch.competitors?.length > 5) {
      risks.push({
        description: 'High competition may reduce market share and pricing power',
        impact: 'high',
        probability: 'likely',
        indicators: ['Competitor product launches', 'Price wars', 'Feature parity pressure']
      });
    }

    if (marketResearch.marketInsights?.trends?.includes('declining')) {
      risks.push({
        description: 'Market decline may reduce demand for the product',
        impact: 'critical',
        probability: 'possible',
        indicators: ['Declining user acquisition', 'Reduced market size', 'Industry consolidation']
      });
    }

    return risks;
  }

  assessFinancialRisks(financialProjections) {
    const risks = [];

    if (financialProjections.burnRate > financialProjections.runway * 0.8) {
      risks.push({
        description: 'High burn rate may lead to funding shortfall',
        impact: 'critical',
        probability: 'likely',
        indicators: ['Monthly cash flow negative', 'Delayed revenue milestones', 'Extended development time']
      });
    }

    return risks;
  }

  // Security Risk Assessment Methods
  assessDataSecurityRisks(dataTypes) {
    const risks = [];

    if (dataTypes.includes('personal') || dataTypes.includes('financial')) {
      risks.push({
        description: 'Personal/financial data breach could result in legal and financial penalties',
        impact: 'critical',
        probability: 'possible',
        indicators: ['Security vulnerabilities', 'Compliance audit failures', 'Unauthorized access attempts']
      });
    }

    return risks;
  }

  // Risk Calculation Methods
  calculateRiskScore(impact, probability) {
    const impactScore = this.getImpactScore(impact);
    const probabilityScore = this.getProbabilityScore(probability);
    return impactScore * probabilityScore;
  }

  getImpactScore(impact) {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[impact] || 2;
  }

  getProbabilityScore(probability) {
    const scores = { 
      'rare': 0.1, 
      'unlikely': 0.3, 
      'possible': 0.5, 
      'likely': 0.7, 
      'almost-certain': 0.9 
    };
    return scores[probability] || 0.5;
  }

  determineRiskLevel(riskScore) {
    if (riskScore >= 3.0) return 'high';
    if (riskScore >= 1.5) return 'medium';
    return 'low';
  }

  // Matrix and Analysis Methods
  createMatrix() {
    const matrix = {};
    this.config.impactLevels.forEach(impact => {
      matrix[impact] = {};
      this.config.probabilityLevels.forEach(probability => {
        matrix[impact][probability] = this.identifiedRisks.filter(risk => 
          risk.impact === impact && risk.probability === probability
        );
      });
    });
    return matrix;
  }

  identifyPriorityRisks() {
    return this.identifiedRisks
      .filter(risk => risk.riskLevel === 'high')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
  }

  // Reporting Methods
  generateRiskReport() {
    return {
      title: 'Risk Assessment Report',
      version: '1.0',
      date: new Date().toISOString(),
      summary: {
        totalRisks: this.identifiedRisks.length,
        risksByCategory: this.groupRisksByCategory(),
        risksByLevel: this.groupRisksByLevel(),
        mitigationStrategies: this.mitigationStrategies.length,
        contingencyPlans: this.contingencyPlans.length
      },
      riskMatrix: this.riskMatrix,
      priorityRisks: this.identifyPriorityRisks(),
      mitigationStrategies: this.mitigationStrategies,
      contingencyPlans: this.contingencyPlans,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    const highRisks = this.identifiedRisks.filter(r => r.riskLevel === 'high');
    if (highRisks.length > 5) {
      recommendations.push('Consider reducing project scope to minimize high-risk exposure');
    }

    const unmmitigatedRisks = this.identifiedRisks.filter(r => r.mitigationStrategies.length === 0);
    if (unmmitigatedRisks.length > 0) {
      recommendations.push('Develop mitigation strategies for all identified risks');
    }

    const technicalRisks = this.identifiedRisks.filter(r => r.category === 'technical' && r.riskLevel === 'high');
    if (technicalRisks.length > 2) {
      recommendations.push('Consider architectural simplification or technology stack changes');
    }

    return recommendations;
  }

  // Integration methods
  exportForProjectManagement() {
    return {
      priorityRisks: this.identifyPriorityRisks(),
      mitigationStrategies: this.mitigationStrategies,
      contingencyPlans: this.contingencyPlans,
      riskMatrix: this.riskMatrix
    };
  }

  exportForArchitectAgent() {
    return {
      technicalRisks: this.identifiedRisks.filter(r => r.category === 'technical'),
      architecturalRecommendations: this.getArchitecturalRecommendations(),
      securityRequirements: this.getSecurityRequirements()
    };
  }

  exportForBusinessAgent() {
    return {
      businessRisks: this.identifiedRisks.filter(r => r.category === 'business'),
      financialImpact: this.calculateFinancialImpact(),
      marketRisks: this.identifiedRisks.filter(r => r.category === 'business' && r.description.includes('market'))
    };
  }

  // Utility methods
  groupRisksByCategory() {
    return this.identifiedRisks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {});
  }

  groupRisksByLevel() {
    return this.identifiedRisks.reduce((acc, risk) => {
      acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
      return acc;
    }, {});
  }

  normalizeImpact(impact) {
    if (typeof impact === 'string') return impact.toLowerCase();
    if (typeof impact === 'number') {
      if (impact <= 1) return 'low';
      if (impact <= 2) return 'medium';
      if (impact <= 3) return 'high';
      return 'critical';
    }
    return 'medium';
  }

  normalizeProbability(probability) {
    if (typeof probability === 'string') return probability.toLowerCase();
    if (typeof probability === 'number') {
      if (probability <= 0.2) return 'rare';
      if (probability <= 0.4) return 'unlikely';
      if (probability <= 0.6) return 'possible';
      if (probability <= 0.8) return 'likely';
      return 'almost-certain';
    }
    return 'possible';
  }
}

module.exports = RiskAssessmentAgent;