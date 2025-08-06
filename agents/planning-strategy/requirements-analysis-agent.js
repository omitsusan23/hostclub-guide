/**
 * Requirements Analysis Agent
 * Conducts stakeholder interviews, creates user stories, defines acceptance criteria
 */

class RequirementsAnalysisAgent {
  constructor(config = {}) {
    this.name = 'Requirements Analysis Agent';
    this.config = {
      stakeholderTypes: ['admin', 'staff', 'customer', 'business_owner'],
      priorityLevels: ['high', 'medium', 'low'],
      storyTemplate: 'As a {role}, I want {functionality} so that {benefit}',
      ...config
    };
    this.stakeholderInsights = new Map();
    this.userStories = [];
    this.acceptanceCriteria = new Map();
  }

  async conductStakeholderInterview(stakeholderType, responses) {
    const interview = {
      stakeholder: stakeholderType,
      timestamp: new Date().toISOString(),
      responses: responses,
      painPoints: this.extractPainPoints(responses),
      needs: this.extractNeeds(responses),
      goals: this.extractGoals(responses)
    };

    this.stakeholderInsights.set(stakeholderType, interview);
    return interview;
  }

  createUserStory(role, functionality, benefit, priority = 'medium') {
    const story = {
      id: `US-${this.userStories.length + 1}`,
      role,
      functionality,
      benefit,
      priority,
      status: 'draft',
      createdAt: new Date().toISOString(),
      template: this.config.storyTemplate
        .replace('{role}', role)
        .replace('{functionality}', functionality)
        .replace('{benefit}', benefit)
    };

    this.userStories.push(story);
    return story;
  }

  defineAcceptanceCriteria(userStoryId, criteria) {
    const formattedCriteria = criteria.map((criterion, index) => ({
      id: `AC-${userStoryId}-${index + 1}`,
      description: criterion,
      testable: this.isTestable(criterion),
      priority: 'must-have'
    }));

    this.acceptanceCriteria.set(userStoryId, formattedCriteria);
    return formattedCriteria;
  }

  generateRequirementsDocument() {
    return {
      title: 'Software Requirements Specification',
      version: '1.0',
      date: new Date().toISOString(),
      stakeholderInsights: Object.fromEntries(this.stakeholderInsights),
      userStories: this.userStories,
      acceptanceCriteria: Object.fromEntries(this.acceptanceCriteria),
      summary: this.generateSummary(),
      nextSteps: this.recommendNextSteps()
    };
  }

  extractPainPoints(responses) {
    return responses.filter(r => r.type === 'pain_point').map(r => r.content);
  }

  extractNeeds(responses) {
    return responses.filter(r => r.type === 'need').map(r => r.content);
  }

  extractGoals(responses) {
    return responses.filter(r => r.type === 'goal').map(r => r.content);
  }

  isTestable(criterion) {
    const testableKeywords = ['should', 'must', 'will', 'displays', 'validates', 'prevents'];
    return testableKeywords.some(keyword => 
      criterion.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  generateSummary() {
    return {
      totalStories: this.userStories.length,
      storiesByPriority: this.groupStoriesByPriority(),
      stakeholdersInterviewed: this.stakeholderInsights.size,
      commonPainPoints: this.identifyCommonPainPoints()
    };
  }

  groupStoriesByPriority() {
    return this.userStories.reduce((acc, story) => {
      acc[story.priority] = (acc[story.priority] || 0) + 1;
      return acc;
    }, {});
  }

  identifyCommonPainPoints() {
    const allPainPoints = Array.from(this.stakeholderInsights.values())
      .flatMap(insight => insight.painPoints);
    
    const frequency = allPainPoints.reduce((acc, point) => {
      acc[point] = (acc[point] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([point, count]) => ({ painPoint: point, frequency: count }));
  }

  recommendNextSteps() {
    return [
      'Validate user stories with stakeholders',
      'Prioritize stories using MoSCoW method',
      'Create detailed wireframes for high-priority stories',
      'Estimate development effort for each story',
      'Plan sprint backlog based on priorities'
    ];
  }

  // Integration methods for other agents
  exportForDesignAgent() {
    return {
      userStories: this.userStories.filter(s => s.priority === 'high'),
      acceptanceCriteria: Object.fromEntries(this.acceptanceCriteria),
      stakeholderInsights: Object.fromEntries(this.stakeholderInsights)
    };
  }

  exportForArchitectAgent() {
    return {
      functionalRequirements: this.extractFunctionalRequirements(),
      nonFunctionalRequirements: this.extractNonFunctionalRequirements(),
      integrationNeeds: this.extractIntegrationNeeds()
    };
  }

  extractFunctionalRequirements() {
    return this.userStories.map(story => ({
      id: story.id,
      description: story.template,
      priority: story.priority,
      acceptanceCriteria: this.acceptanceCriteria.get(story.id) || []
    }));
  }

  extractNonFunctionalRequirements() {
    return Array.from(this.stakeholderInsights.values())
      .flatMap(insight => insight.responses)
      .filter(r => r.type === 'performance' || r.type === 'security' || r.type === 'usability')
      .map(r => ({ type: r.type, requirement: r.content }));
  }

  extractIntegrationNeeds() {
    return Array.from(this.stakeholderInsights.values())
      .flatMap(insight => insight.responses)
      .filter(r => r.type === 'integration')
      .map(r => r.content);
  }
}

module.exports = RequirementsAnalysisAgent;