'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Tag = require('..models/tags');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  return Tag.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    }); 
});

/* ========== GET/READ ONE ITEM BY ID ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Id not found');
    err.status = 404;
    return next(err);
  }
  Tag
    .findById(id)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const {name} = req.body;

  if(!name) {
    const err = new Error('Missing name in request body');
    err.status = 400;
    return next(err);
  }

  const newTag = {name};
  
  Tag 
    .create(newTag)
    .then(result => {
      if(result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result);
      } else {
        next();
      }
    })    
    .catch(err => {
      if(err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});
