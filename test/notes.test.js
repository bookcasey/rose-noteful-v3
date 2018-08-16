'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API resource', function() {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function () {
    return Note.insertMany(seedNotes);
  });
  
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });
  
  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function() {
    it('should return all existing notes', function() {
      let res;
      return chai.request(app)
        .get('/api/notes')
        .then(function(_res) {
          res = _res; //make res available outside scope of this block
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.countDocuments();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });
    it('should return notes with right field', function() {
      let resNote;
      return chai.request(app)
        .get('/api/notes')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(note) {
            expect(note).to.be.an('object');
            expect(note).to.include.keys(
              'id', 'title', 'content', 'createdAt', 'updatedAt');    
          });
          resNote = res.body[0];
          return Note.findById(resNote.id);
        })
        .then(function(note) {
          expect(resNote.id).to.equal(note.id);
          expect(resNote.title).to.equal(note.title);
          expect(resNote.content).to.equal(note.content);
          expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
          expect(new Date(resNote.updatedAt)).to.eql(note.updatedAt);
          
        });
    });
  });

  // describe('GET /api/notes/:id', function() {
  //   it('should return correct note id', function() {
  //     let resNote; 
  //     return Note.find()
  //       .then(function(res) {
  //         resNote = res;
  //         return chai.request(app)
  //           .get(`/api/notes/${resNote.id}`);
  //       })
  //       .then(function(res) {
  //         expect(res).to.have.status(200);
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.an('object');
  //         expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

  //         expect(res.body.id).to.equal(resNote.id);
  //         expect(res.body.title).to.equal(resNote.title);
  //         expect(res.body.content).to.equal(resNote.content);
  //         // expect(new Date(res.body.createdAt)).to.eql(resNote.createdAt);
  //         // expect(new Date(res.body.updatedAt)).to.eql(resNote.updatedAt);
  //       });
  //   });
  // });  
  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  // describe('POST /api/notes', function() {
  //   it('should create and return a new item when provided valid data', function () {
  //     const newItem = {
  //       'title': 'The best new article by me!',
  //       'content': 'stuufdlkgfjdsjfhgkj'
  //     };
  //     let res;
  //     return chai.request(app)
  //       .post('/api/notes')
  //       .send(newItem)
  //       .then(function (_res) {
  //         res = _res;
  //         expect(res).to.have.status(201);
  //         expect(res).to.have.header('location');
  //         expect(res).to.be.json;
  //         expect(res.body).to.be.an('object');
  //         expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
  //         return Note.findById(res.body.id);
  //       })
  //       .then(data => {
  //         expect(res.body.id).to.eql(data.id);
  //         expect(res.body.title).to.eql(data.title);
  //         expect(res.body.content).to.eql(data.content);
  //         expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
  //         expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
  //       });
  //   });
  // });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/notes/:id', function() {
    it('should update note when passed valid data', function() {
      const updateData = {
        title: 'updated title',
        content: 'updated content'
      };

      let res;
      return Note
        .findOne()
        .then(function(note) {
          updateData.id = note.id;

          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(updateData);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(updateData.id);
          expect(res.body.title).to.equal(updateData.title);
          expect(res.body.content).to.equal(updateData.content);

          return Note.findById(res.body.id);
        })
        .then(function(note) {
          expect(note.id).to.equal(res.body.id);
          expect(note.title).to.equal(res.body.title);
          expect(note.content).to.equal(res.body.content);
          expect(new Date(res.body.createdAt)).to.eql(note.createdAt); //eql (objects or arrays) vs equal (strings or numbers)
          expect(new Date(res.body.updatedAt)).to.eql(note.updatedAt);
        });
    });
  });

  describe('DELETE /api/notes/:id', function() {
    it('should delete a note by id', function() {
      let note;

      return Note
        .findOne()
        .then(function(_note) {
          note = _note;
          return chai.request(app).delete(`/api/notes/${note.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Note.findById(note.id);
        })
        .then(function(_note) {
          expect(_note).to.be.null;
        });
    });
  });

});