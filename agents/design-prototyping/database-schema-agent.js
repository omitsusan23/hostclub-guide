/**
 * Database Schema Agent
 * Designs optimal database structure, handles migrations, optimizes queries
 */

class DatabaseSchemaAgent {
  constructor(config = {}) {
    this.name = 'Database Schema Agent';
    this.config = {
      dbType: 'postgresql',
      normalizationLevel: '3NF',
      indexingStrategy: 'performance-optimized',
      partitioningEnabled: false,
      ...config
    };
    this.tables = [];
    this.relationships = [];
    this.indexes = [];
    this.migrations = [];
    this.views = [];
    this.triggers = [];
  }

  analyzeDataRequirements(functionalRequirements, userStories, architecture) {
    const analysis = {
      entities: this.identifyEntities(functionalRequirements, userStories),
      dataVolume: this.estimateDataVolume(architecture),
      accessPatterns: this.analyzeAccessPatterns(userStories),
      transactionRequirements: this.identifyTransactionRequirements(functionalRequirements),
      performanceRequirements: this.extractPerformanceRequirements(architecture),
      complianceRequirements: this.extractComplianceRequirements(functionalRequirements),
      analysisDate: new Date().toISOString()
    };

    return analysis;
  }

  designSchema(dataRequirements, businessRules) {
    const schema = {
      version: '1.0',
      database: this.config.dbType,
      tables: this.designTables(dataRequirements.entities, businessRules),
      relationships: this.defineRelationships(dataRequirements.entities),
      indexes: this.designIndexes(dataRequirements.accessPatterns),
      constraints: this.defineConstraints(businessRules),
      views: this.createViews(dataRequirements.accessPatterns),
      storedProcedures: this.designStoredProcedures(businessRules),
      triggers: this.designTriggers(businessRules),
      partitioning: this.designPartitioning(dataRequirements.dataVolume),
      createdAt: new Date().toISOString()
    };

    this.tables = schema.tables;
    this.relationships = schema.relationships;
    this.indexes = schema.indexes;
    this.views = schema.views;
    this.triggers = schema.triggers;

    return schema;
  }

  // Core table design for Hostclub Guide system
  designTables(entities, businessRules) {
    const tables = [];

    // Users table (multi-role support)
    tables.push({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'email', type: 'varchar(255)', unique: true, notNull: true },
        { name: 'password_hash', type: 'varchar(255)', notNull: true },
        { name: 'role', type: 'varchar(50)', notNull: true, check: "role IN ('admin', 'staff', 'customer')" },
        { name: 'name', type: 'varchar(255)', notNull: true },
        { name: 'phone', type: 'varchar(20)' },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'last_login', type: 'timestamp' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['email', 'role', 'is_active'],
      triggers: ['update_timestamp']
    });

    // Stores table
    tables.push({
      name: 'stores',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'owner_id', type: 'uuid', references: 'users(id)', notNull: true },
        { name: 'name', type: 'varchar(255)', notNull: true },
        { name: 'subdomain', type: 'varchar(63)', unique: true, notNull: true },
        { name: 'address', type: 'text' },
        { name: 'phone', type: 'varchar(20)' },
        { name: 'business_hours', type: 'jsonb', default: '{}' },
        { name: 'settings', type: 'jsonb', default: '{}' },
        { name: 'status', type: 'varchar(50)', default: 'active' },
        { name: 'subscription_plan', type: 'varchar(50)' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['owner_id', 'subdomain', 'status'],
      partitioning: null
    });

    // Staff members table
    tables.push({
      name: 'staff_members',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', references: 'users(id)', notNull: true },
        { name: 'store_id', type: 'uuid', references: 'stores(id)', notNull: true },
        { name: 'employee_code', type: 'varchar(50)' },
        { name: 'position', type: 'varchar(100)' },
        { name: 'hire_date', type: 'date' },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'permissions', type: 'jsonb', default: '{}' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['user_id', 'store_id', 'is_active'],
      uniqueConstraints: [['user_id', 'store_id']]
    });

    // Customer visits table (partitioned by date)
    tables.push({
      name: 'customer_visits',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'store_id', type: 'uuid', references: 'stores(id)', notNull: true },
        { name: 'staff_id', type: 'uuid', references: 'staff_members(id)' },
        { name: 'customer_name', type: 'varchar(255)', notNull: true },
        { name: 'customer_phone', type: 'varchar(20)' },
        { name: 'visit_date', type: 'timestamp', notNull: true, default: 'CURRENT_TIMESTAMP' },
        { name: 'duration_minutes', type: 'integer' },
        { name: 'amount', type: 'decimal(10,2)' },
        { name: 'payment_method', type: 'varchar(50)' },
        { name: 'notes', type: 'text' },
        { name: 'status', type: 'varchar(50)', default: 'completed' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['store_id', 'staff_id', 'visit_date', 'customer_phone'],
      partitioning: {
        type: 'range',
        column: 'visit_date',
        interval: 'monthly'
      }
    });

    // Store schedules table
    tables.push({
      name: 'store_schedules',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'store_id', type: 'uuid', references: 'stores(id)', notNull: true },
        { name: 'date', type: 'date', notNull: true },
        { name: 'open_time', type: 'time' },
        { name: 'close_time', type: 'time' },
        { name: 'is_holiday', type: 'boolean', default: false },
        { name: 'special_notes', type: 'text' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['store_id', 'date'],
      uniqueConstraints: [['store_id', 'date']]
    });

    // Subscription management tables
    tables.push({
      name: 'subscription_plans',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'varchar(100)', notNull: true },
        { name: 'code', type: 'varchar(50)', unique: true, notNull: true },
        { name: 'price_monthly', type: 'decimal(10,2)', notNull: true },
        { name: 'price_annual', type: 'decimal(10,2)', notNull: true },
        { name: 'features', type: 'jsonb', default: '{}' },
        { name: 'limits', type: 'jsonb', default: '{}' },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['code', 'is_active']
    });

    tables.push({
      name: 'store_subscriptions',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'store_id', type: 'uuid', references: 'stores(id)', notNull: true },
        { name: 'plan_id', type: 'uuid', references: 'subscription_plans(id)', notNull: true },
        { name: 'status', type: 'varchar(50)', notNull: true },
        { name: 'billing_cycle', type: 'varchar(20)', notNull: true },
        { name: 'current_period_start', type: 'timestamp', notNull: true },
        { name: 'current_period_end', type: 'timestamp', notNull: true },
        { name: 'trial_end', type: 'timestamp' },
        { name: 'canceled_at', type: 'timestamp' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      indexes: ['store_id', 'status', 'current_period_end']
    });

    // Analytics and monitoring tables
    tables.push({
      name: 'usage_metrics',
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'store_id', type: 'uuid', references: 'stores(id)', notNull: true },
        { name: 'metric_type', type: 'varchar(50)', notNull: true },
        { name: 'metric_value', type: 'decimal(10,2)', notNull: true },
        { name: 'recorded_at', type: 'timestamp', notNull: true, default: 'CURRENT_TIMESTAMP' },
        { name: 'metadata', type: 'jsonb', default: '{}' }
      ],
      indexes: ['store_id', 'metric_type', 'recorded_at'],
      partitioning: {
        type: 'range',
        column: 'recorded_at',
        interval: 'daily'
      }
    });

    return tables;
  }

  defineRelationships(entities) {
    return [
      {
        name: 'users_stores',
        type: 'one-to-many',
        parent: 'users',
        child: 'stores',
        parentKey: 'id',
        childKey: 'owner_id',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      {
        name: 'stores_staff',
        type: 'one-to-many',
        parent: 'stores',
        child: 'staff_members',
        parentKey: 'id',
        childKey: 'store_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        name: 'stores_visits',
        type: 'one-to-many',
        parent: 'stores',
        child: 'customer_visits',
        parentKey: 'id',
        childKey: 'store_id',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      {
        name: 'staff_visits',
        type: 'one-to-many',
        parent: 'staff_members',
        child: 'customer_visits',
        parentKey: 'id',
        childKey: 'staff_id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    ];
  }

  designIndexes(accessPatterns) {
    const indexes = [];

    // Performance-critical indexes
    indexes.push({
      name: 'idx_visits_store_date',
      table: 'customer_visits',
      columns: ['store_id', 'visit_date'],
      type: 'btree',
      description: 'Optimize store visit queries by date'
    });

    indexes.push({
      name: 'idx_visits_customer_phone',
      table: 'customer_visits',
      columns: ['customer_phone'],
      type: 'hash',
      description: 'Fast customer lookup by phone'
    });

    indexes.push({
      name: 'idx_users_email_lower',
      table: 'users',
      expression: 'LOWER(email)',
      type: 'btree',
      description: 'Case-insensitive email search'
    });

    indexes.push({
      name: 'idx_stores_active_plan',
      table: 'stores',
      columns: ['status', 'subscription_plan'],
      where: "status = 'active'",
      type: 'btree',
      description: 'Active stores by plan'
    });

    // Full-text search indexes
    indexes.push({
      name: 'idx_stores_search',
      table: 'stores',
      columns: ['name', 'address'],
      type: 'gin',
      using: 'to_tsvector',
      description: 'Full-text search on stores'
    });

    // JSON indexes
    indexes.push({
      name: 'idx_stores_settings',
      table: 'stores',
      expression: "(settings->>'notifications')",
      type: 'btree',
      description: 'Index on notification settings'
    });

    this.indexes = indexes;
    return indexes;
  }

  createViews(accessPatterns) {
    const views = [];

    // Store overview with current metrics
    views.push({
      name: 'v_store_overview',
      definition: `
        SELECT 
          s.id,
          s.name,
          s.subdomain,
          s.status,
          sp.name as plan_name,
          COUNT(DISTINCT sm.id) as staff_count,
          COUNT(DISTINCT cv.id) FILTER (WHERE cv.visit_date >= CURRENT_DATE) as visits_today,
          SUM(cv.amount) FILTER (WHERE cv.visit_date >= CURRENT_DATE) as revenue_today
        FROM stores s
        LEFT JOIN subscription_plans sp ON s.subscription_plan = sp.code
        LEFT JOIN staff_members sm ON s.id = sm.store_id AND sm.is_active = true
        LEFT JOIN customer_visits cv ON s.id = cv.store_id
        GROUP BY s.id, s.name, s.subdomain, s.status, sp.name
      `,
      materialized: false
    });

    // Staff performance view
    views.push({
      name: 'v_staff_performance',
      definition: `
        SELECT 
          sm.id,
          u.name as staff_name,
          s.name as store_name,
          DATE_TRUNC('month', cv.visit_date) as month,
          COUNT(cv.id) as visit_count,
          SUM(cv.amount) as total_revenue,
          AVG(cv.duration_minutes) as avg_duration
        FROM staff_members sm
        JOIN users u ON sm.user_id = u.id
        JOIN stores s ON sm.store_id = s.id
        LEFT JOIN customer_visits cv ON sm.id = cv.staff_id
        WHERE sm.is_active = true
        GROUP BY sm.id, u.name, s.name, DATE_TRUNC('month', cv.visit_date)
      `,
      materialized: true,
      refreshInterval: 'hourly'
    });

    // Subscription usage view
    views.push({
      name: 'v_subscription_usage',
      definition: `
        WITH monthly_usage AS (
          SELECT 
            s.id as store_id,
            DATE_TRUNC('month', cv.visit_date) as month,
            COUNT(cv.id) as visit_count,
            COUNT(DISTINCT sm.id) as active_staff
          FROM stores s
          LEFT JOIN customer_visits cv ON s.id = cv.store_id
          LEFT JOIN staff_members sm ON s.id = sm.store_id AND sm.is_active = true
          GROUP BY s.id, DATE_TRUNC('month', cv.visit_date)
        )
        SELECT 
          mu.*,
          sp.limits->>'visits_per_month' as visit_limit,
          sp.limits->>'staff' as staff_limit,
          CASE 
            WHEN mu.visit_count > (sp.limits->>'visits_per_month')::int THEN true
            ELSE false
          END as exceeds_visit_limit
        FROM monthly_usage mu
        JOIN stores s ON mu.store_id = s.id
        JOIN subscription_plans sp ON s.subscription_plan = sp.code
      `,
      materialized: true,
      refreshInterval: 'daily'
    });

    this.views = views;
    return views;
  }

  designTriggers(businessRules) {
    const triggers = [];

    // Update timestamp trigger
    triggers.push({
      name: 'update_timestamp',
      function: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
      trigger: `
        CREATE TRIGGER update_{table}_timestamp
        BEFORE UPDATE ON {table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `,
      tables: ['users', 'stores', 'staff_members', 'customer_visits']
    });

    // Audit trail trigger
    triggers.push({
      name: 'audit_trail',
      function: `
        CREATE OR REPLACE FUNCTION create_audit_trail()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO audit_logs (
            table_name, 
            record_id, 
            action, 
            changed_by, 
            changed_at, 
            old_values, 
            new_values
          )
          VALUES (
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            TG_OP,
            current_user,
            CURRENT_TIMESTAMP,
            to_jsonb(OLD),
            to_jsonb(NEW)
          );
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
      trigger: `
        CREATE TRIGGER audit_{table}_changes
        AFTER INSERT OR UPDATE OR DELETE ON {table}
        FOR EACH ROW
        EXECUTE FUNCTION create_audit_trail();
      `,
      tables: ['stores', 'customer_visits', 'store_subscriptions']
    });

    // Usage limit check trigger
    triggers.push({
      name: 'check_usage_limits',
      function: `
        CREATE OR REPLACE FUNCTION check_subscription_limits()
        RETURNS TRIGGER AS $$
        DECLARE
          current_visits integer;
          visit_limit integer;
        BEGIN
          -- Get current month visits
          SELECT COUNT(*) INTO current_visits
          FROM customer_visits
          WHERE store_id = NEW.store_id
          AND visit_date >= DATE_TRUNC('month', CURRENT_DATE);
          
          -- Get plan limit
          SELECT (sp.limits->>'visits_per_month')::int INTO visit_limit
          FROM stores s
          JOIN subscription_plans sp ON s.subscription_plan = sp.code
          WHERE s.id = NEW.store_id;
          
          IF current_visits >= visit_limit THEN
            RAISE EXCEPTION 'Monthly visit limit exceeded';
          END IF;
          
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,
      trigger: `
        CREATE TRIGGER enforce_visit_limits
        BEFORE INSERT ON customer_visits
        FOR EACH ROW
        EXECUTE FUNCTION check_subscription_limits();
      `,
      tables: ['customer_visits']
    });

    this.triggers = triggers;
    return triggers;
  }

  generateMigrations(schema, previousSchema = null) {
    const migrations = [];

    if (!previousSchema) {
      // Initial migration
      migrations.push({
        version: '001_initial_schema',
        up: this.generateCreateTableSQL(schema),
        down: this.generateDropTableSQL(schema),
        description: 'Initial database schema',
        createdAt: new Date().toISOString()
      });
    } else {
      // Diff-based migration
      const changes = this.compareSchemas(previousSchema, schema);
      if (changes.length > 0) {
        migrations.push({
          version: `${Date.now()}_schema_update`,
          up: this.generateAlterTableSQL(changes),
          down: this.generateRollbackSQL(changes),
          description: 'Schema updates',
          changes: changes,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Add index migrations
    const indexMigration = {
      version: '002_performance_indexes',
      up: this.generateCreateIndexSQL(schema.indexes),
      down: this.generateDropIndexSQL(schema.indexes),
      description: 'Performance optimization indexes',
      createdAt: new Date().toISOString()
    };
    migrations.push(indexMigration);

    // Add view migrations
    const viewMigration = {
      version: '003_reporting_views',
      up: this.generateCreateViewSQL(schema.views),
      down: this.generateDropViewSQL(schema.views),
      description: 'Reporting and analytics views',
      createdAt: new Date().toISOString()
    };
    migrations.push(viewMigration);

    this.migrations = migrations;
    return migrations;
  }

  optimizeQueries(commonQueries, performanceMetrics) {
    const optimizations = [];

    commonQueries.forEach(query => {
      const analysis = this.analyzeQueryPerformance(query, performanceMetrics);
      
      if (analysis.estimatedCost > 1000) {
        optimizations.push({
          originalQuery: query,
          issues: analysis.issues,
          suggestions: this.generateOptimizationSuggestions(analysis),
          optimizedQuery: this.rewriteQuery(query, analysis),
          expectedImprovement: this.calculateExpectedImprovement(analysis)
        });
      }
    });

    return optimizations;
  }

  // Helper methods
  generateCreateTableSQL(schema) {
    const sql = [];
    
    schema.tables.forEach(table => {
      let createSQL = `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
      
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.name} ${col.type}`;
        if (col.primary) def += ' PRIMARY KEY';
        if (col.default) def += ` DEFAULT ${col.default}`;
        if (col.notNull) def += ' NOT NULL';
        if (col.unique) def += ' UNIQUE';
        if (col.references) def += ` REFERENCES ${col.references}`;
        if (col.check) def += ` CHECK (${col.check})`;
        return def;
      });
      
      createSQL += columnDefs.join(',\n');
      
      if (table.uniqueConstraints) {
        table.uniqueConstraints.forEach(constraint => {
          createSQL += `,\n  UNIQUE (${constraint.join(', ')})`;
        });
      }
      
      createSQL += '\n);';
      sql.push(createSQL);
      
      // Add partitioning if needed
      if (table.partitioning) {
        sql.push(this.generatePartitioningSQL(table));
      }
    });
    
    return sql.join('\n\n');
  }

  generatePartitioningSQL(table) {
    const { type, column, interval } = table.partitioning;
    
    if (type === 'range' && interval === 'monthly') {
      return `
-- Create partitioned table
CREATE TABLE ${table.name}_partitioned (LIKE ${table.name} INCLUDING ALL) PARTITION BY RANGE (${column});

-- Create monthly partitions for the next 12 months
DO $$
DECLARE
  start_date date := DATE_TRUNC('month', CURRENT_DATE);
  end_date date;
  partition_name text;
BEGIN
  FOR i IN 0..11 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := '${table.name}_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE %I PARTITION OF ${table.name}_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date);
    
    start_date := end_date;
  END LOOP;
END $$;

-- Rename tables
ALTER TABLE ${table.name} RENAME TO ${table.name}_old;
ALTER TABLE ${table.name}_partitioned RENAME TO ${table.name};
      `;
    }
    
    return '';
  }

  generateCreateIndexSQL(indexes) {
    return indexes.map(index => {
      let sql = `CREATE INDEX `;
      if (index.unique) sql += 'UNIQUE ';
      sql += `${index.name} ON ${index.table}`;
      
      if (index.expression) {
        sql += ` (${index.expression})`;
      } else if (index.using) {
        sql += ` USING ${index.type} (${index.using}('english', ${index.columns.join(', ')}))`;
      } else {
        sql += ` USING ${index.type} (${index.columns.join(', ')})`;
      }
      
      if (index.where) {
        sql += ` WHERE ${index.where}`;
      }
      
      sql += ';';
      return sql;
    }).join('\n');
  }

  generateCreateViewSQL(views) {
    return views.map(view => {
      let sql = `CREATE`;
      if (view.materialized) sql += ' MATERIALIZED';
      sql += ` VIEW ${view.name} AS\n${view.definition};\n`;
      
      if (view.materialized && view.refreshInterval) {
        sql += `\n-- Schedule refresh: ${view.refreshInterval}`;
      }
      
      return sql;
    }).join('\n\n');
  }

  // Performance optimization methods
  analyzeQueryPerformance(query, metrics) {
    // Simplified query analysis
    const analysis = {
      query: query,
      estimatedCost: 0,
      issues: [],
      missingIndexes: [],
      statistics: {}
    };

    // Check for common performance issues
    if (query.toLowerCase().includes('select *')) {
      analysis.issues.push('Using SELECT * - specify needed columns');
      analysis.estimatedCost += 500;
    }

    if (!query.toLowerCase().includes('limit') && query.toLowerCase().includes('select')) {
      analysis.issues.push('No LIMIT clause - consider pagination');
      analysis.estimatedCost += 300;
    }

    if (query.toLowerCase().includes('join') && !query.toLowerCase().includes('index')) {
      analysis.issues.push('JOIN without proper indexes');
      analysis.estimatedCost += 800;
    }

    return analysis;
  }

  // Integration methods
  exportForDevelopmentAgent() {
    return {
      schema: {
        tables: this.tables,
        relationships: this.relationships,
        indexes: this.indexes
      },
      migrations: this.migrations,
      ormModels: this.generateORMModels(),
      queryBuilders: this.generateQueryBuilders()
    };
  }

  exportForTestingAgent() {
    return {
      testSchema: this.generateTestSchema(),
      seedData: this.generateSeedData(),
      performanceTests: this.generatePerformanceTests()
    };
  }

  generateORMModels() {
    // Generate TypeORM/Prisma models
    const models = {};
    
    this.tables.forEach(table => {
      models[table.name] = {
        name: this.toPascalCase(table.name),
        fields: table.columns.map(col => ({
          name: col.name,
          type: this.mapSQLTypeToORM(col.type),
          decorators: this.getORMDecorators(col)
        })),
        relations: this.getTableRelations(table.name)
      };
    });

    return models;
  }

  // Utility methods
  toPascalCase(str) {
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  mapSQLTypeToORM(sqlType) {
    const typeMap = {
      'uuid': 'string',
      'varchar': 'string',
      'text': 'string',
      'integer': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'timestamp': 'Date',
      'date': 'Date',
      'jsonb': 'object'
    };

    const baseType = sqlType.split('(')[0];
    return typeMap[baseType] || 'any';
  }

  generateSchemaReport() {
    return {
      title: 'Database Schema Design Report',
      version: '1.0',
      date: new Date().toISOString(),
      summary: {
        totalTables: this.tables.length,
        totalColumns: this.tables.reduce((sum, t) => sum + t.columns.length, 0),
        totalIndexes: this.indexes.length,
        totalRelationships: this.relationships.length,
        totalViews: this.views.length,
        totalTriggers: this.triggers.length
      },
      details: {
        tables: this.tables,
        relationships: this.relationships,
        indexes: this.indexes,
        views: this.views,
        triggers: this.triggers
      },
      optimizations: this.generateOptimizationRecommendations(),
      securityConsiderations: this.generateSecurityRecommendations()
    };
  }

  generateOptimizationRecommendations() {
    return [
      'Implement table partitioning for customer_visits and usage_metrics tables',
      'Add composite indexes for frequently joined columns',
      'Use materialized views for complex reporting queries',
      'Implement connection pooling for better resource utilization',
      'Set up automatic VACUUM and ANALYZE schedules',
      'Monitor and adjust autovacuum settings based on workload'
    ];
  }

  generateSecurityRecommendations() {
    return [
      'Implement Row Level Security (RLS) policies for multi-tenant data isolation',
      'Encrypt sensitive columns (password_hash, payment details) at rest',
      'Use SSL/TLS for all database connections',
      'Implement audit logging for all data modifications',
      'Regular security audits and penetration testing',
      'Implement least-privilege access control for database users'
    ];
  }
}

module.exports = DatabaseSchemaAgent;