'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();


router.post('/users', (req,res) => {
  const {fullname = '',username, password} = req.body;

  return User.find({username})
    .count()
    .then(count =>{
      if(count > 0){
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already exists',
          location: 'username',
        });
      }
      return User.create({
        fullname,
        username,
        password
      });
    })
    .then(user => {
      return res.status(201).location(`api/users/${user.id}`).json(user); 
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });

}); 

module.exports = router;