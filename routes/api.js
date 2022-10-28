'use strict';

const mongoose = require('mongoose');

mongoose.connect(process.env.DB, ({useNewUrlParser: true, useUnifiedTopology: true}));

module.exports = function (app) {

  const replySchema = new mongoose.Schema({
    created_on: String,
    text: String,
    delete_password: String,
    reported: Boolean
  });

  const Message = mongoose.model('Message', new mongoose.Schema({
    board: String,
    created_on: String,
    bumped_on: String,
    reported: Boolean,
    text: String,
    delete_password: String,
    replycount: Number,
    replies: [replySchema],
    password: String
  }));
  const Reply = mongoose.model('Reply', replySchema);
  
  app.route('/api/threads/:board')
    .get((req, res) => {
      Message.find({ board: req.params.board })
        .select('-board')
        .sort({ bumped_on: -1 })
        .limit(10)
        .exec((err, messages) => {
          if (err) {
            console.log(err);
          }
          const messagesConsolidate = messages.map(message => {
            const container = {};

            container._id = message._id;
            container.created_on = message.created_on;
            container.bumped_on = message.bumped_on;
            container.reported = message.reported;
            container.text = message.text;
            container.delete_password = message.delete_password;
            container.replycount = message.replycount;
            container.replies = message.replies.slice(0, 3);

            return container;
          });
          res.json(messagesConsolidate);
        });
    })
    .post(async (req, res) => {
      const newMessage = new Message({
        board: req.body.board,
        created_on: new Date().toISOString(),
        bumped_on: new Date().toISOString(),
        reported: false,
        text: req.body.text,
        delete_password: req.body.delete_password,
        replycount: 0,
        replies: []
      });
      await newMessage.save();
      res.json({
        _id: newMessage._id,
        created_on: newMessage.created_on,
        bumped_on: newMessage.bumped_on,
        reported: newMessage.reported,
        text: newMessage.text,
        delete_password: newMessage.delete_password,
        replycount: newMessage.replycount,
        replies: newMessage.replies
      });
    })
    .put((req, res) => {
      Message.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.thread_id), { reported: true }, { useFindAndModify: false }, (err, docs) => {
        if (err) {
          throw err;
        }
        if (!docs) {
          res.send('invalid id');
        } else {
          res.send('success');
        }
      });
    })
    .delete((req, res) => {
      Message.findOneAndDelete({ _id: mongoose.Types.ObjectId(req.body.thread_id), delete_password: req.body.delete_password }, (err, doc) => {
        if (err) {
          throw err;
        }
        if (!doc) {
          res.send('incorrect password')
        } else {
          res.send('success');
        }
      });
    });
    
  app.route('/api/replies/:board')
    .get((req, res) => {
      Message.find({ board: req.params.board })
        .select('-board')
        .sort({ bumped_on: -1 })
        .limit(1)
        .exec((err, messages) => {
          if (err) {
            console.log(err);
          }
          res.json(messages[0]);
        });
    })
    .post((req, res) => {
      Message.findOne({ board: req.body.board, _id: mongoose.Types.ObjectId(req.body.thread_id) }, async (err, doc) => {
        try {
          if (err) {
            console.log(err);
          }
          const newReply = {
            created_on: new Date().toISOString(),
            text: req.body.text,
            delete_password: req.body.delete_password,
            reported: false
          };
          doc.replycount = doc.replycount + 1;
          doc.replies.push(newReply);
          await doc.save();
          res.json(doc);
        } catch (err) {
          console.error(err);
        }
      });
    })
    .put((req, res) => {
      Message.findOne({ board: req.body.board, _id: mongoose.Types.ObjectId(req.body.thread_id) }, async (err, doc) => {
        if (err) {
          throw err;
        }
        if (!doc) {
          res.send("invalid thread ID");
        } else {
          const result = doc.replies.findIndex(({ _id }) => {
            return JSON.stringify(_id) === `"${req.body.reply_id}"`;
          });
          if (isNaN(result)) {
            res.send('invalid reply ID');
          } else {
            doc.replies[result].reported = true;
            await doc.save();
            res.send('success');
          }
        }
      });
    })
    .delete((req, res) => {
      Message.findOne({ board: req.body.board, _id: mongoose.Types.ObjectId(req.body.thread_id) }, async (err, doc) => {
        if (err) {
          throw err;
        }
        if (!doc) {
          res.send('invalid thread ID');
        } else {
          const result = doc.replies.findIndex(({ _id }) => {
            return JSON.stringify(_id) === `"${req.body.reply_id}"`;
          });
          if (isNaN(result)) {
            res.send('invalid reply ID');
          } else if (doc.replies[result].delete_password === req.body.delete_password) {
            doc.replies[result].text = '[deleted]';
            await doc.save();
            res.send('success');
          } else {
            res.send('incorrect password');
          }
        }
      });
    });

};
