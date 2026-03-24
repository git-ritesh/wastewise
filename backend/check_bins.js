const mongoose = require('mongoose');
const Dustbin = require('./models/Dustbin.js');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const bins = await Dustbin.find();
  console.log('TOTAL BINS:', bins.length);
  console.log(JSON.stringify(bins, null, 2));
  process.exit(0);
}
check();
