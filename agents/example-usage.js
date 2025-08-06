/**
 * Example Usage of Multi-Agent SaaS Development System
 * Demonstrates how to use the agent orchestrator for various development scenarios
 */

const AgentOrchestrator = require('./agent-orchestrator');

async function exampleFullDevelopmentCycle() {
  console.log('🎯 Example: Full SaaS Development Cycle\n');

  // Initialize orchestrator for Japanese hostclub management SaaS
  const orchestrator = new AgentOrchestrator({
    projectName: 'Hostclub Guide Management SaaS',
    projectType: 'saas-platform',
    developmentMode: 'agile'
  });

  // Project requirements for hostclub management system
  const projectRequirements = {
    // Business requirements
    targetMarket: 'japanese-hostclub-industry',
    expectedUsers: 500, // stores
    expectedStaffPerStore: 10,
    expectedCustomersPerStore: 100,
    
    // Functional requirements
    coreFeatures: [
      'store-management',
      'staff-scheduling',
      'customer-visit-tracking',
      'billing-invoicing',
      'analytics-reporting',
      'mobile-staff-app',
      'customer-booking-portal'
    ],
    
    // Non-functional requirements
    performance: {
      responseTime: '<200ms',
      concurrentUsers: 1000,
      availability: '99.9%'
    },
    
    // Technical requirements
    platforms: ['web', 'mobile'],
    languages: ['japanese', 'english'],
    integrations: ['payment-gateways', 'sms-services', 'email-services'],
    
    // Business model
    pricingModel: 'subscription',
    billingCycles: ['monthly', 'annual'],
    currency: 'JPY',
    
    // Timeline
    phases: {
      mvp: '3-months',
      beta: '4-months', 
      launch: '6-months'
    }
  };

  try {
    // Run complete development cycle
    const results = await orchestrator.runFullDevelopmentCycle(projectRequirements);
    
    console.log('📊 Development Cycle Results:');
    console.log(`- Duration: ${Math.round(results.totalDuration / 1000 / 60)} minutes`);
    console.log(`- Completed Phases: ${results.summary.completedPhases}/${results.summary.totalPhases}`);
    console.log(`- Executed Agents: ${results.summary.executedAgents}/${results.summary.totalAgents}`);
    console.log(`- Key Deliverables: ${results.summary.keyDeliverables.length}`);
    
    // Show deliverables by phase
    console.log('\n📋 Key Deliverables by Phase:');
    results.summary.keyDeliverables.forEach(deliverable => {
      console.log(`- ${deliverable.phase}: ${deliverable.deliverable} (${deliverable.agent})`);
    });
    
    console.log('\n🚀 Next Steps:');
    results.summary.nextSteps.forEach(step => console.log(`- ${step}`));
    
    return results;
    
  } catch (error) {
    console.error('❌ Development cycle failed:', error.message);
    throw error;
  }
}

async function exampleSpecificWorkflows() {
  console.log('\n🔧 Example: Specific Workflow Execution\n');

  const orchestrator = new AgentOrchestrator();

  // Example 1: Planning phase for feature enhancement
  console.log('📋 Running Planning Phase for New Feature...');
  const planningInputs = {
    featureRequest: 'Add AI-powered staff scheduling optimization',
    stakeholders: ['store-managers', 'staff', 'customers'],
    constraints: {
      timeline: '2-months',
      budget: '¥2,000,000',
      team_size: 3
    }
  };

  const planningResults = await orchestrator.executeWorkflow('Planning Phase', planningInputs);
  console.log(`Planning completed with ${Object.keys(planningResults.results).length} agent results`);

  // Example 2: SaaS-specific implementation
  console.log('\n💰 Running SaaS Implementation Phase...');
  const saasInputs = {
    businessModel: 'subscription',
    plans: ['basic', 'professional', 'enterprise'],
    paymentMethods: ['credit_card', 'bank_transfer', 'convenience_store'],
    multiTenancy: {
      isolation: 'database-per-tenant',
      features: 'plan-based'
    }
  };

  const saasResults = await orchestrator.executeWorkflow('SaaS Implementation Phase', saasInputs);
  console.log(`SaaS implementation completed with ${Object.keys(saasResults.results).length} components`);

  // Example 3: Quality assurance for critical features
  console.log('\n🧪 Running QA Phase for Critical Features...');
  const qaInputs = {
    criticalFeatures: ['payment-processing', 'user-authentication', 'data-backup'],
    testTypes: ['unit', 'integration', 'e2e', 'security', 'performance'],
    coverage_target: 90,
    performance_targets: {
      response_time: '< 200ms',
      throughput: '1000 req/min',
      availability: '99.9%'
    }
  };

  const qaResults = await orchestrator.executeWorkflow('Quality Assurance Phase', qaInputs);
  console.log(`QA phase completed with ${Object.keys(qaResults.results).length} test suites`);
}

async function exampleIndividualAgents() {
  console.log('\n🤖 Example: Individual Agent Execution\n');

  const orchestrator = new AgentOrchestrator();

  // Example 1: Requirements Analysis Agent
  console.log('📊 Requirements Analysis for Mobile Staff App...');
  const requirementsAgent = orchestrator.agents.get('RequirementsAnalysisAgent');
  
  if (requirementsAgent && requirementsAgent.conductStakeholderInterview) {
    const stakeholderResponses = [
      { type: 'pain_point', content: 'Current system is too slow on mobile' },
      { type: 'need', content: 'Quick customer check-in process' },
      { type: 'goal', content: 'Complete visit logging in under 30 seconds' },
      { type: 'need', content: 'Offline capability for poor network areas' }
    ];

    const interview = await requirementsAgent.conductStakeholderInterview('staff', stakeholderResponses);
    console.log('Requirements analysis completed:', interview.painPoints.length, 'pain points identified');
  }

  // Example 2: Subscription Management Agent  
  console.log('\n💳 Subscription Management Setup...');
  const subscriptionAgent = orchestrator.agents.get('SubscriptionManagementAgent');
  
  if (subscriptionAgent && subscriptionAgent.createSubscriptionPlans) {
    const marketResearch = {
      competitors: [
        { name: 'Competitor A', pricing: { monthly: 15000 } },
        { name: 'Competitor B', pricing: { monthly: 25000 } }
      ]
    };

    const plans = await subscriptionAgent.createSubscriptionPlans(marketResearch, { strategy: 'competitive' });
    console.log('Created', plans.length, 'subscription plans');
    
    // Create a test subscription
    if (subscriptionAgent.createSubscription) {
      const subscription = await subscriptionAgent.createSubscription('customer-123', 'professional', 'monthly');
      console.log('Test subscription created:', subscription.id);
    }
  }

  // Example 3: Frontend Development Agent
  console.log('\n⚛️ Frontend Component Generation...');
  const frontendAgent = orchestrator.agents.get('FrontendDevelopmentAgent');
  
  if (frontendAgent && frontendAgent.generateReactComponent) {
    const componentSpec = {
      name: 'StoreStatusCard',
      props: ['storeName', 'status', 'staffCount', 'onStatusChange'],
      complexity: 'medium',
      styling: 'tailwindcss'
    };

    const designSystem = {
      colors: { primary: '#ef4444', secondary: '#64748b' },
      spacing: { sm: '0.5rem', md: '1rem', lg: '1.5rem' }
    };

    const component = await frontendAgent.generateReactComponent(componentSpec, designSystem);
    console.log('Generated React component:', component.name);
    console.log('Component includes:', component.hooks.length, 'hooks and', component.styling ? 'custom styling' : 'default styling');
  }
}

async function exampleCustomWorkflow() {
  console.log('\n🔄 Example: Custom Workflow Creation\n');

  const orchestrator = new AgentOrchestrator();

  // Create custom workflow for MVP development
  const mvpWorkflow = {
    name: 'MVP Development Workflow',
    phase: 'mvp',
    agents: [
      'RequirementsAnalysisAgent',
      'UXUIDesignAgent',
      'FrontendDevelopmentAgent',
      'BackendDevelopmentAgent',
      'TestingAgent'
    ],
    parallel: ['RequirementsAnalysisAgent', 'UXUIDesignAgent'],
    sequential: ['FrontendDevelopmentAgent', 'BackendDevelopmentAgent', 'TestingAgent']
  };

  // Add to orchestrator
  orchestrator.workflows.push(mvpWorkflow);

  // Execute MVP workflow
  const mvpInputs = {
    scope: 'core-features-only',
    timeline: '8-weeks',
    features: ['user-auth', 'store-listing', 'basic-booking'],
    quality: 'acceptable-for-testing',
    scalability: 'not-required'
  };

  const mvpResults = await orchestrator.executeWorkflow('MVP Development Workflow', mvpInputs);
  console.log('MVP workflow completed successfully');
  console.log('Generated deliverables for', Object.keys(mvpResults.results).length, 'agents');
}

async function exampleMonitoringAndReporting() {
  console.log('\n📊 Example: Monitoring and Reporting\n');

  const orchestrator = new AgentOrchestrator();

  // Get system status
  const status = orchestrator.getSystemStatus();
  console.log('🔍 System Status:');
  console.log(`- Total Agents: ${status.orchestrator.totalAgents}`);
  console.log(`- Placeholder Agents: ${status.orchestrator.placeholderAgents.length}`);
  console.log(`- Available Workflows: ${status.workflows.length}`);

  // Generate comprehensive report
  const report = orchestrator.generateReport();
  console.log('\n📋 System Report Generated:');
  console.log(`- Implementation Progress: ${report.agentSummary.implementationProgress}`);
  console.log(`- Longest Workflow: ${report.workflowSummary.longestWorkflow}`);
  console.log(`- Total Workflow Steps: ${report.workflowSummary.totalSteps}`);

  console.log('\n💡 System Recommendations:');
  report.recommendations.forEach(rec => console.log(`- ${rec}`));

  return report;
}

async function exampleErrorHandling() {
  console.log('\n⚠️ Example: Error Handling\n');

  const orchestrator = new AgentOrchestrator();

  try {
    // Try to execute non-existent workflow
    await orchestrator.executeWorkflow('Non-existent Workflow', {});
  } catch (error) {
    console.log('✅ Correctly caught workflow error:', error.message);
  }

  try {
    // Try to execute agent with missing dependencies
    // This will show how dependency checking works
    const result = await orchestrator.executeAgent('TechnicalArchitectureAgent', {});
    console.log('⚠️ Agent execution result (may be simulated):', result.status);
  } catch (error) {
    console.log('✅ Correctly caught dependency error:', error.message);
  }
}

// Main execution function
async function runAllExamples() {
  console.log('🚀 Multi-Agent SaaS Development System Examples\n');
  console.log('='.repeat(60));

  try {
    // Run all examples
    await exampleFullDevelopmentCycle();
    await exampleSpecificWorkflows();
    await exampleIndividualAgents();
    await exampleCustomWorkflow();
    await exampleMonitoringAndReporting();
    await exampleErrorHandling();

    console.log('\n✅ All examples completed successfully!');
    console.log('\n📖 Next Steps:');
    console.log('1. Implement the placeholder agents you need');
    console.log('2. Customize agent configurations for your project');
    console.log('3. Add proper error handling and logging');
    console.log('4. Set up external integrations');
    console.log('5. Create project-specific workflows');

  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  exampleFullDevelopmentCycle,
  exampleSpecificWorkflows,
  exampleIndividualAgents,
  exampleCustomWorkflow,
  exampleMonitoringAndReporting,
  exampleErrorHandling,
  runAllExamples
};