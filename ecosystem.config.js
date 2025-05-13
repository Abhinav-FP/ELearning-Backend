module.exports = {
    apps: [
      {
        watch: true,
        name: 'ELearning-Backend',
        script: './app.js',
        cwd: '/home/ubuntu/ELearning-Backend',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };