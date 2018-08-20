'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
// const chaiSorted = require('chai-sorted');
// const chaiId = require('chaid');
const mongoose = require('mongoose');

const express = require('express');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tags');
const seedTags = require('../db/seed/tags');
const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);
// chai.use(chaiSorted);
// chai.use(chaiId);

describe('Noteful API resource', function() {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  }); 

  beforeEach(function() {
    return Promise.all([
      Tag.insertMany(seedTags),
      Tag.createIndexes(),
      Note.insertMany(seedNotes)
    ]);
  });
  
  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });
  
  describe('GET /api/tags', function() {
    it('should return all tags sorted by name', function() {
      return Promise.all([
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(data.length);
          expect(res.body).to.be.sortedBy('name'); 
        });
    });

    it('should return tags with correct fields', function() {
      return Promise.all([
        Tag.find().sort('name'),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => { 
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(data.length);
  
          res.body.forEach(function(tag, i) {
            expect(tag).to.be.an('object');
            expect(tag).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(tag.id).to.equal(data[i].id);
            expect(tag.name).to.equal(data[i].name);
            expect(new Date(tag.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(tag.updatedAt)).to.eql(data[i].updatedAt);
          }); 
        });
    });  

  });

  describe('GET /api/tags/:id', function() {
    it('should return the correct tag(s)', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        }); 
    }); 

    it('should respond with status 400 for invalid id', function() {
      return chai.request(app).get('/api/tags/NOT-A-VALID-ID') //12 bytes is Mongo ObjectId?
        .then(res => {
          expect(res).to.have.status(400);  //failing because actual status is 404
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with status 404 for nonexistent id', function() {
      return chai.request(app).get('/api/tags/DOESNOTEXIST') //Mongo ObjectId?
        .then(res => {
          expect(res).to.have.status(404);  //failing because actual status is 200
        });
    }); 

  });

  describe('POST /api/tags', function() {
    it('should create and return a new tag when provided valid data', function() {
      const newItem = { 'name': 'newTag'};
      let res;
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when name field is missing', function() {
      const newItem = { 'foo': 'bar' };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res).to.be.an('object');
          expect(res.body.message).to.equal('Missing name in request body');
        });
    });

    it('should return an error when name field is empty string', function() {
      const newItem = { 'name': '' };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res).to.be.an('object');
          expect(res.body.message).to.equal('Missing name in request body');
        });
    });

    it('should return an error for duplicate name', function() {
      return Tag.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app)
            .post('/api/tags')
            .send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

    it('should return an error for duplicate name', function() {
      return Tag.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app)
            .post('/api/tags')
            .send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });


  });

  describe('PUT /api/tags/:id', function() {
    it('should update tag when passed valid data', function() {
      const updateData = {
        name: 'updated name',
      };

      let res;
      return Tag
        .findOne()
        .then(function(tag) {
          updateData.id = tag.id;

          return chai.request(app)
            .put(`/api/tags/${tag.id}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(updateData.id);
          expect(res.body.name).to.equal(updateData.name);

          return Tag.findById(res.body.id);
        })
        .then(function(tag) {
          expect(tag.id).to.equal(res.body.id);
          expect(tag.name).to.equal(res.body.name);
          expect(new Date(res.body.createdAt)).to.eql(tag.createdAt); //eql (objects or arrays) vs equal (strings or numbers)
          expect(new Date(res.body.updatedAt)).to.eql(tag.updatedAt);
        });
    });

    it('should return an error when name field is missing', function() {
      const newItem = { 'foo': 'bar' };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res).to.be.an('object');
          expect(res.body.message).to.equal('Missing name in request body');
        });
    });

    it('should return an error when name field is empty string', function() {
      const newItem = { 'name': '' };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res).to.be.an('object');
          expect(res.body.message).to.equal('Missing name in request body');
        });
    });

    it('should return an error for duplicate name', function() {
      return Tag.findOne()
        .then(data => {
          const newItem = { 'name': data.name };
          return chai.request(app)
            .post('/api/tags')
            .send(newItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const updateItem = { name: 'Blah' };
      return chai.request(app)
        .put('/api/tags/NOT-A-VALID-ID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      const updateItem = { name: 'Blah' };
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .put('/api/tags/DOESNOTEXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('DELETE /api/tag/:id', function() {
    it('should delete a tag when passed an id', function() {
      let tag;

      return Tag
        .findOne()
        .then(function(_tag) {
          tag = _tag;
          return chai.request(app).delete(`/api/tags/${tag.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Tag.findById(tag.id);
        })
        .then(function(_tag) {
          expect(_tag).to.be.null;
        });
    });

    it('should delete an existing tag and remove tag reference from note', function () {
      let tagId;
      return Note.findOne({ tags: { $exists: true, $ne: [] } })
        .then(data => {
          tagId = data.tags[0];

          return chai.request(app)
            .delete(`/api/tags/${tagId}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Note.count({ tags: tagId });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const updateItem = { name: 'Blah' };
      return chai.request(app)
        .put('/api/tags/NOT-A-VALID-ID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

  });


});  