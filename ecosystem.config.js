module.exports = {
  apps: [{
    name: 'cadastro-pet',
    script: './Cadastro_pet/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT 
    }
  }]
};
