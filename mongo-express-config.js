module.exports = {
  mongodb: {
    server: 'localhost',
    port: 27017,
    
    // Database credentials (none for local development)
    admin: false,
    
    // Database settings
    autoReconnect: true,
    poolSize: 4,
    
    // SSL settings
    ssl: false,
    
    // Connection options
    connectionOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    
    // Default database to show on startup
    defaultDatabase: 'driving_training_db'
  },
  
  site: {
    baseUrl: '/db-admin/',
    cookieKeyName: 'mongo-express',
    cookieSecret: 'mddrc-training-secret-key',
    host: '0.0.0.0',
    port: 8082,
    requestSizeLimit: '50mb',
    sessionSecret: 'mddrc-session-secret',
    sslEnabled: false,
    
    // Set to true to enable Admin in read-only mode
    readOnly: false,
    
    // Grid FS options
    gridFSEnabled: true
  },
  
  // Authentication settings
  useBasicAuth: true,
  basicAuth: {
    username: 'admin',
    password: 'mddrc2024'
  },
  
  options: {
    // Log options
    console: true,
    logger: {},
    
    // Update check
    noDelete: false,
    
    // Maximum number of documents per page
    documentsPerPage: 10,
    
    // Editor theme
    editorTheme: 'default',
    
    // Maximum size of a single document
    maxAllowedDocumentSize: 10000000
  },
  
  // Blacklist for databases (hide these)
  blacklist: {
    databases: ['admin', 'local', 'config'],
    collections: []
  },
  
  // Whitelist for databases (only show these)
  whitelist: {
    databases: ['driving_training_db'],
    collections: []
  }
};
