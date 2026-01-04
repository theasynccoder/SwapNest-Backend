require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- SEND OTP ----------
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  console.log("OTP requested for:", email);

  if (!email || !email.endsWith('@rvce.edu.in')) {
    return res.status(400).json({ error: 'Only @rvce.edu.in emails allowed' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  await supabase.from('email_otps').upsert({ email, otp, expires_at });

  try {
    const datat = await resend.emails.send({
      from: 'SwapNest <onboarding@resend.dev>',
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}`,
    });

    console.log("OTP sent to:", email);
    console.log("Resend response:", data);
    res.json({ success: true });

  } catch (err) {
    console.error("Resend Error:", err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ---------- VERIFY OTP ----------
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

  const hashedPassword = await bcrypt.hash(password, 10);

  await supabase.from('profiles').insert({
    email,
    full_name: name,
    password: hashedPassword,
  });

  await supabase.from('email_otps').delete().eq('email', email);

  res.json({ success: true });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Email verification server running on port ${PORT}`)
);
