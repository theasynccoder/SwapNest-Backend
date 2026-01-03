// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { createClient } = require('@supabase/supabase-js');
// const nodemailer = require('nodemailer');
// const bcrypt = require('bcryptjs');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// // 1. Send OTP
// app.post('/send-otp', async (req, res) => {
//   const { email } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
//   await supabase.from('email_otps').upsert({ email, otp, expires_at });
//   try {
//     await transporter.sendMail({
//       from: process.env.SMTP_USER,
//       to: email,
//       subject: 'Your Verification Code',
//       text: `Your verification code is: ${otp}`,
//     });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to send email' });
//   }
// });

// // 2. Verify OTP and create user
// app.post('/verify-otp', async (req, res) => {
//   const { email, otp, name, password } = req.body;
//   const { data } = await supabase
//     .from('email_otps')
//     .select('otp, expires_at')
//     .eq('email', email)
//     .single();
//   if (!data || data.otp !== otp || new Date() > new Date(data.expires_at)) {
//     return res.status(400).json({ error: 'Invalid verification code' });
//   }
//   // Hash password
//   const hashedPassword = await bcrypt.hash(password, 10);
//   // Create user in your users table (not Supabase Auth)
//   await supabase.from('profiles').insert({ email, full_name: name, password: hashedPassword });
//   // Delete OTP
//   await supabase.from('email_otps').delete().eq('email', email);
//   res.json({ success: true });
// });

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`Email verification server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 1. Send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
  await supabase.from('email_otps').upsert({ email, otp, expires_at });
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 2. Verify OTP and create user
app.post('/verify-otp', async (req, res) => {
  const { email, otp, name, password } = req.body;
  const { data } = await supabase
    .from('email_otps')
    .select('otp, expires_at')
    .eq('email', email)
    .single();
  if (!data || data.otp !== otp || new Date() > new Date(data.expires_at)) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Create user in your users table (not Supabase Auth)
  await supabase.from('profiles').insert({ email, full_name: name, password: hashedPassword });
  // Delete OTP
  await supabase.from('email_otps').delete().eq('email', email);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Email verification server running on port ${PORT}`));