const mongoose = require('mongoose')
const mongoPath = process.env.mongoPath

module.exports = {
  init: () => {
    const dbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    //   autoIndex: false,
    //   reconnectTries: Number.MAX_VALUE,
    //   reconnectInterval: 500,
    //   poolSize: 5,
    //   connectTimeoutMS: 2147483647,
    //   family: 4,
    };
      
    mongoose.connect(mongoPath, dbOptions);
    mongoose.Promise = global.Promise;
    
    mongoose.connection.on('connected', () => {
        console.log('Connected to database');
    });
    
    mongoose.connection.on('err', err => {
        console.error(`Database connection error: \n ${err.stack}`);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.log('Database connection disconnected');
    })
  }
};