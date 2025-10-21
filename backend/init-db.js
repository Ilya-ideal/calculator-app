const { Client } = require('pg');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/calculator',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Создание таблицы для вычислений
    await client.query(`
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        expression TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Calculations table created/verified');
    
    // Создание индекса для оптимизации запросов истории
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_calculations_created_at 
      ON calculations(created_at DESC)
    `);
    
    console.log('✅ Database indexes created/verified');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database initialization completed');
  }
}

// Запуск только если файл вызван напрямую
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;