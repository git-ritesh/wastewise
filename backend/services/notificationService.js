/*
  Notification Service
  Handles creating notifications in DB, sending via Socket.io, and Emails
*/
const Notification = require('../models/Notification.js');
const { sendEmail } = require('../utils/emailService.js');
const User = require('../models/User.js');

let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const sendNotification = async ({
  recipientId,
  title,
  message,
  type = 'info',
  relatedId = null,
  link = null,
  sendEmailAlert = false
}) => {
  try {
    // 1. Save to Database
    const notification = new Notification({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId,
      link
    });
    await notification.save();

    // 2. Send via Socket.io (Real-time)
    if (io) {
      io.to(recipientId.toString()).emit('notification', notification);
    }

    // 3. Send Email (Optional)
    if (sendEmailAlert) {
      const user = await User.findById(recipientId);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: `WasteWise Alert: ${title}`,
          message: `<p>${message}</p>`
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Notification Service Error:', error);
  }
};

const emitSocketEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  setSocketIO,
  sendNotification,
  emitSocketEvent
};
