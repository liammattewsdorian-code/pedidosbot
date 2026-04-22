const rateLimit = require('express-rate-limit');
const express = require('express');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Authentication middleware example
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || token !== 'your_auth_token') {
    return res.status(401).send('Unauthorized');
  }
  next();
};

module.exports = { limiter, authenticate };