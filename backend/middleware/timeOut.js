const express = require("express");
const timeOutMiddleware = express();

timeOutMiddleware.use((req, res, next) => {
  setTimeout(() => {
    next();
  }, 500);
});

module.exports = timeOutMiddleware;
