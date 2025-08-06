/**
 * UX/UI Design Agent
 * Creates wireframes, prototypes, user journey maps, design systems
 */

class UXUIDesignAgent {
  constructor(config = {}) {
    this.name = 'UX/UI Design Agent';
    this.config = {
      designSystem: 'material-design-3',
      targetDevices: ['mobile', 'tablet', 'desktop'],
      accessibilityLevel: 'WCAG-2.1-AA',
      brandGuidelines: null,
      ...config
    };
    this.wireframes = [];
    this.prototypes = [];
    this.userJourneys = [];
    this.designSystem = null;
    this.usabilityTests = [];
  }

  analyzeUserRequirements(userStories, stakeholderInsights) {
    const analysis = {
      userPersonas: this.createUserPersonas(stakeholderInsights),
      userNeeds: this.extractUserNeeds(userStories),
      useCases: this.identifyUseCases(userStories),
      painPoints: this.identifyDesignPainPoints(stakeholderInsights),
      designGoals: this.defineDesignGoals(userStories, stakeholderInsights),
      analysisDate: new Date().toISOString()
    };

    return analysis;
  }

  createUserPersonas(stakeholderInsights) {
    const personas = [];

    // Admin persona
    personas.push({
      id: 'persona-admin',
      name: 'Administrative Manager',
      role: 'admin',
      demographics: {
        age: '35-45',
        techSavvy: 'medium-high',
        deviceUsage: 'desktop-primary'
      },
      goals: [
        'Efficiently manage multiple stores',
        'Monitor staff performance',
        'Generate business reports',
        'Ensure compliance'
      ],
      painPoints: [
        'Complex interfaces slow down operations',
        'Need quick access to critical information',
        'Difficulty tracking multiple locations'
      ],
      behavior: {
        frequency: 'daily',
        sessionDuration: '2-4 hours',
        primaryTasks: ['monitoring', 'reporting', 'staff-management']
      }
    });

    // Staff persona
    personas.push({
      id: 'persona-staff',
      name: 'Guidance Staff',
      role: 'staff',
      demographics: {
        age: '25-35',
        techSavvy: 'medium',
        deviceUsage: 'mobile-primary'
      },
      goals: [
        'Quickly log customer visits',
        'Access store information',
        'Communicate with team',
        'Track personal performance'
      ],
      painPoints: [
        'Need fast, one-handed operation',
        'Limited time between customers',
        'Require offline capability'
      ],
      behavior: {
        frequency: 'hourly',
        sessionDuration: '2-5 minutes',
        primaryTasks: ['logging', 'communication', 'quick-lookup']
      }
    });

    // Customer persona
    personas.push({
      id: 'persona-customer',
      name: 'Hostclub Customer',
      role: 'customer',
      demographics: {
        age: '25-40',
        techSavvy: 'medium',
        deviceUsage: 'mobile-primary'
      },
      goals: [
        'Find suitable hostclub',
        'Check store availability',
        'Make appointments',
        'View special events'
      ],
      painPoints: [
        'Unclear store information',
        'Difficulty finding availability',
        'Language barriers'
      ],
      behavior: {
        frequency: 'weekly',
        sessionDuration: '10-20 minutes',
        primaryTasks: ['browsing', 'booking', 'information-seeking']
      }
    });

    return personas;
  }

  createUserJourneyMaps(personas, userStories) {
    const journeys = [];

    personas.forEach(persona => {
      const relevantStories = userStories.filter(story => 
        story.role === persona.role || story.role === persona.id
      );

      const journey = {
        personaId: persona.id,
        journeyName: `${persona.name} - Primary Journey`,
        stages: this.mapJourneyStages(persona, relevantStories),
        touchpoints: this.identifyTouchpoints(persona),
        emotions: this.mapEmotionalJourney(persona),
        opportunities: this.identifyDesignOpportunities(persona),
        createdDate: new Date().toISOString()
      };

      journeys.push(journey);
    });

    this.userJourneys = journeys;
    return journeys;
  }

  createWireframes(userJourneys, designGoals) {
    const wireframes = [];

    userJourneys.forEach(journey => {
      journey.stages.forEach((stage, stageIndex) => {
        const wireframe = {
          id: `WF-${journey.personaId}-${stageIndex + 1}`,
          title: `${stage.name} - ${journey.personaId}`,
          persona: journey.personaId,
          stage: stage.name,
          fidelity: 'low', // low, medium, high
          device: this.determineTargetDevice(journey.personaId),
          layout: this.designLayout(stage, journey.personaId),
          components: this.identifyComponents(stage),
          interactions: this.defineInteractions(stage),
          annotations: this.createAnnotations(stage),
          createdDate: new Date().toISOString()
        };

        wireframes.push(wireframe);
      });
    });

    this.wireframes = wireframes;
    return wireframes;
  }

  createPrototype(wireframes, interactionDesign) {
    const prototype = {
      id: `PROTO-${this.prototypes.length + 1}`,
      name: 'Interactive Prototype v1.0',
      fidelity: 'medium', // low, medium, high
      tools: ['figma', 'principle', 'invision'],
      screens: this.convertWireframesToScreens(wireframes),
      flow: this.designUserFlow(wireframes),
      interactions: this.definePrototypeInteractions(interactionDesign),
      animations: this.defineAnimations(),
      responsive: this.createResponsiveSpecs(),
      createdDate: new Date().toISOString()
    };

    this.prototypes.push(prototype);
    return prototype;
  }

  developDesignSystem() {
    this.designSystem = {
      name: 'Hostclub Guide Design System',
      version: '1.0',
      foundation: {
        colors: this.defineColorPalette(),
        typography: this.defineTypography(),
        spacing: this.defineSpacing(),
        grid: this.defineGridSystem(),
        iconography: this.defineIconSystem(),
        elevation: this.defineElevationSystem()
      },
      components: {
        buttons: this.designButtonComponents(),
        inputs: this.designInputComponents(),
        navigation: this.designNavigationComponents(),
        cards: this.designCardComponents(),
        modals: this.designModalComponents(),
        forms: this.designFormComponents()
      },
      patterns: {
        layouts: this.defineLayoutPatterns(),
        interactions: this.defineInteractionPatterns(),
        navigation: this.defineNavigationPatterns(),
        feedback: this.defineFeedbackPatterns()
      },
      guidelines: {
        accessibility: this.defineAccessibilityGuidelines(),
        responsive: this.defineResponsiveGuidelines(),
        motion: this.defineMotionGuidelines(),
        content: this.defineContentGuidelines()
      },
      createdDate: new Date().toISOString()
    };

    return this.designSystem;
  }

  // Design System Components
  defineColorPalette() {
    return {
      primary: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444', // Main brand color
        600: '#dc2626',
        900: '#991b1b'
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        500: '#64748b',
        600: '#475569',
        900: '#0f172a'
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717'
      }
    };
  }

  defineTypography() {
    return {
      fontFamily: {
        primary: '"Noto Sans JP", "Hiragino Sans", sans-serif',
        secondary: '"Inter", sans-serif',
        mono: '"JetBrains Mono", monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    };
  }

  defineSpacing() {
    return {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem'
    };
  }

  designButtonComponents() {
    return {
      primary: {
        base: {
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          background: 'var(--color-primary-500)',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        },
        hover: {
          background: 'var(--color-primary-600)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        },
        active: {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
          transform: 'none'
        }
      },
      secondary: {
        base: {
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          background: 'transparent',
          color: 'var(--color-primary-500)',
          border: '2px solid var(--color-primary-500)',
          cursor: 'pointer'
        },
        hover: {
          background: 'var(--color-primary-50)',
          borderColor: 'var(--color-primary-600)'
        }
      }
    };
  }

  // Usability Testing
  planUsabilityTest(prototype, testGoals) {
    const usabilityTest = {
      id: `UT-${this.usabilityTests.length + 1}`,
      prototype: prototype.id,
      goals: testGoals,
      methodology: 'moderated-remote',
      participants: this.defineTestParticipants(),
      tasks: this.createTestTasks(testGoals),
      metrics: this.defineUsabilityMetrics(),
      timeline: this.createTestTimeline(),
      equipment: this.specifyTestEquipment(),
      createdDate: new Date().toISOString()
    };

    this.usabilityTests.push(usabilityTest);
    return usabilityTest;
  }

  defineTestParticipants() {
    return [
      {
        persona: 'admin',
        count: 3,
        criteria: 'Experience with management software',
        demographics: 'Age 30-50, business background'
      },
      {
        persona: 'staff',
        count: 5,
        criteria: 'Mobile-first users',
        demographics: 'Age 20-35, service industry experience'
      },
      {
        persona: 'customer',
        count: 4,
        criteria: 'Entertainment service users',
        demographics: 'Age 25-45, regular service users'
      }
    ];
  }

  createTestTasks(testGoals) {
    return [
      {
        id: 'task-1',
        description: 'Register a new visit for a customer',
        persona: 'staff',
        expectedTime: '2 minutes',
        successCriteria: 'Completes without assistance'
      },
      {
        id: 'task-2',
        description: 'Find store availability for tonight',
        persona: 'customer',
        expectedTime: '3 minutes',
        successCriteria: 'Finds correct information'
      },
      {
        id: 'task-3',
        description: 'Generate weekly staff performance report',
        persona: 'admin',
        expectedTime: '5 minutes',
        successCriteria: 'Successfully generates report'
      }
    ];
  }

  // Helper Methods
  mapJourneyStages(persona, userStories) {
    const commonStages = {
      admin: ['Login', 'Dashboard Overview', 'Store Management', 'Staff Monitoring', 'Report Generation'],
      staff: ['Quick Login', 'Customer Check-in', 'Visit Logging', 'Status Update', 'Shift Summary'],
      customer: ['Store Discovery', 'Information Review', 'Availability Check', 'Appointment Booking', 'Confirmation']
    };

    return (commonStages[persona.role] || []).map((stageName, index) => ({
      name: stageName,
      order: index + 1,
      actions: this.identifyStageActions(stageName, persona),
      touchpoints: this.identifyStageTouch points(stageName),
      painPoints: this.identifyStagePainPoints(stageName, persona),
      opportunities: []
    }));
  }

  determineTargetDevice(personaId) {
    const deviceMap = {
      'persona-admin': 'desktop',
      'persona-staff': 'mobile',
      'persona-customer': 'mobile'
    };
    return deviceMap[personaId] || 'mobile';
  }

  // Integration Methods
  exportForDevelopmentAgent() {
    return {
      designSystem: this.designSystem,
      wireframes: this.wireframes,
      prototypes: this.prototypes,
      componentSpecs: this.generateComponentSpecs(),
      styleGuide: this.generateStyleGuide()
    };
  }

  exportForTestingAgent() {
    return {
      usabilityTests: this.usabilityTests,
      userJourneys: this.userJourneys,
      accessibilityRequirements: this.extractAccessibilityRequirements(),
      testScenarios: this.generateTestScenarios()
    };
  }

  exportForBusinessAgent() {
    return {
      userPersonas: this.createUserPersonas([]),
      designDecisions: this.documentDesignDecisions(),
      businessImpact: this.assessBusinessImpact()
    };
  }

  // Report Generation
  generateDesignReport() {
    return {
      title: 'UX/UI Design Report',
      version: '1.0',
      date: new Date().toISOString(),
      summary: {
        wireframes: this.wireframes.length,
        prototypes: this.prototypes.length,
        userJourneys: this.userJourneys.length,
        usabilityTests: this.usabilityTests.length
      },
      designSystem: this.designSystem,
      userResearch: {
        personas: this.createUserPersonas([]),
        journeys: this.userJourneys
      },
      wireframes: this.wireframes,
      prototypes: this.prototypes,
      recommendations: this.generateDesignRecommendations(),
      nextSteps: this.defineNextSteps()
    };
  }

  generateDesignRecommendations() {
    return [
      'Prioritize mobile-first design for staff and customer interfaces',
      'Implement progressive disclosure for complex admin features',
      'Use consistent Japanese typography and cultural design patterns',
      'Ensure accessibility compliance for diverse user base',
      'Plan for offline functionality in staff mobile interface'
    ];
  }
}

module.exports = UXUIDesignAgent;