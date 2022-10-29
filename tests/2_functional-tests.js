const chaiHttp = require('chai-http');
const chai = require('chai');
const mongoose = require('mongoose');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  const board = 'general';
  suite('The tests', () => {
    test("Creating a new thread: POST request to '/api/threads/{board}'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread: POST request',
          delete_password: 'donotdelete'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.text, 'Creating a new thread: POST request');
          assert.equal(res.body.replycount, 0);
          assert.equal(res.body.delete_password, 'donotdelete');
        });
    }),
    test("Viewing the 10 most recent threads with 3 replies each: GET request to '/api/threads/{board}'", () => {
      chai.request(server)
        .get(`/api/threads/${board}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isAtMost(res.body.length, 10);
          assert.isAtMost(res.body[0].replies.length, 3);
        });
    }),
    test("Deleting a thread with the incorrect password: DELETE request to '/api/threads/{board}' with an invalid 'delete_password'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to delete unsuccessfully: POST request',
          delete_password: 'delete'
        })
        .end((err, res) => {
          chai.request(server)
            .delete(`/api/threads/${board}`)
            .send({
              board: board,
              thread_id: mongoose.Types.ObjectId(res.body._id),
              delete_password: 'delet'
            })
            .end((error, response) => {
              assert.equal(response.text, 'incorrect password');
            });
        });
    }),
    test("Deleting a thread with the correct password: DELETE request to '/api/threads/{board}' with a valid 'delete_password'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to delete successfully: POST request',
          delete_password: 'delete'
        })
        .end((err, res) => {
          chai.request(server)
            .delete(`/api/threads/${board}`)
            .send({
              board: board,
              thread_id: mongoose.Types.ObjectId(res.body._id),
              delete_password: 'delete'
            })
            .end((error, response) => {
              assert.equal(response.text, 'success');
            });
        });
    }),
    test("Reporting a thread: PUT request to '/api/threads/{board}'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to report: POST request',
          delete_password: 'reported'
        })
        .end((err, res) => {
          chai.request(server)
            .put(`/api/threads/${board}`)
            .send({
              board: board,
              report_id: mongoose.Types.ObjectId(res.body._id)
            })
            .end((error, response) => {
              assert.equal(response.text, 'reported');
            });
        });
    }),
    test("Creating a new reply: POST request to '/api/replies/{board}'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          text: 'Creating a new thread to create a new reply with: POST request',
          delete_password: 'replied'
        })
        .end((err, res) => {
          chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
              thread_id: mongoose.Types.ObjectId(res.body._id),
              text: 'This is the new reply to the new thread: POST request',
              delete_password: 'thereply'
            })
            .end((error, response) => {
              const no = response.body.replies.length - 1;
              assert.equal(response.status, 200);
              assert.equal(response.body.replies[no].text, 'This is the new reply to the new thread: POST request');
              assert.equal(response.body.replies[no].delete_password, 'thereply');
              assert.equal(res.body.text, 'Creating a new thread to create a new reply with: POST request');
            });
        });
    }),
    test("Viewing a single thread with all replies: GET request to '/api/replies/{board}'", () => {
      chai.request(server)
        .get(`/api/threads/${board}`)
        .end((err, res) => {
          chai.request(server)
            .get(`/api/replies/${board}`)
            .send({ thread_id: mongoose.Types.ObjectId(res.body[0]._id) })
            .end((err2, res2) => {
              assert.equal(res2.status, 200);
              assert.exists(res2.body.text);
              assert.exists(res2.body.replies);
            });
        });
    }),
    test("Deleting a reply with the incorrect password: DELETE request to '/api/threads/{board}' with an invalid 'delete_password'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to create a new reply with to delete unsuccessfully: POST request',
          delete_password: 'replied'
        })
        .end((err, res) => {
          chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
              board: board,
              thread_id: mongoose.Types.ObjectId(res.body._id),
              text: 'This is the new reply to the new thread that will be deleted unsuccessfully: POST request',
              delete_password: 'thereply'
            })
            .end((err2, res2) => {
              chai.request(server)
                .delete(`/api/replies/${board}`)
                .send({
                  board: board,
                  thread_id: mongoose.Types.ObjectId(res2.body._id),
                  reply_id: mongoose.Types.ObjectId(res2.body.replies[0]._id),
                  delete_password: 'therepl'
                })
                .end((err3, res3) => {
                  assert.equal(res3.text, 'incorrect password');
                });
            });
        });
    }),
    test("Deleting a reply with the correct password: DELETE request to '/api/threads/{board}' with a valid 'delete_password'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to create a new reply with to delete successfully: POST request',
          delete_password: 'replied'
        })
        .end((err, res) => {
          chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
              board: board,
              thread_id: mongoose.Types.ObjectId(res.body._id),
              text: 'This is the new reply to the new thread that will be deleted successfully: POST request',
              delete_password: 'thereply'
            })
            .end((err2, res2) => {
              chai.request(server)
                .delete(`/api/replies/${board}`)
                .send({
                  board: board,
                  thread_id: mongoose.Types.ObjectId(res2.body._id),
                  reply_id: mongoose.Types.ObjectId(res2.body.replies[0]._id),
                  delete_password: 'thereply'
                })
                .end((err3, res3) => {
                  assert.equal(res3.text, 'success');
                });
            });
        });
    }),
    test("Reporting a reply: PUT request to '/api/replies/{board}'", () => {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board: board,
          text: 'Creating a new thread to create a new reply with to report: POST request',
          delete_password: 'replied'
        })
        .end((err, res) => {
          chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
              board: board,
              thread_id: mongoose.Types.ObjectId(res.body._id),
              text: 'This is the new reply to the new thread that will be reported: POST request',
              delete_password: 'thereply'
            })
            .end((err2, res2) => {
              chai.request(server)
                .put(`/api/replies/${board}`)
                .send({
                  board: board,
                  thread_id: mongoose.Types.ObjectId(res2.body._id),
                  reply_id: mongoose.Types.ObjectId(res2.body.replies[0]._id)
                })
                .end((err3, res3) => {
                  assert.equal(res3.text, 'reported');
                });
            });
        });
    })
  });
});
