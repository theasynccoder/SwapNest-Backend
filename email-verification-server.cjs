// This file is intentionally left blank. The backend code has been moved to backend/email-verification-server.cjs for deployment and GitHub organization.
// This file is intentionally left blank. The backend code has been moved to backend/email-verification-server.cjs for deployment and GitHub organization.
// Express server for email verification (Node.js)
// Install dependencies: express, @supabase/supabase-js, @sendgrid/mail, cors, dotenv

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ===================== Send Code Endpoint =====================

app.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith('@rvce.edu.in')) {
    return res.status(400).json({ error: 'Only @rvce.edu.in emails allowed' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await supabase
    .from('email_verifications')
    .upsert({ email, code });

  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Your SwapNest Verification Code',
      text: `Your verification code is: ${code}`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ===================== Verify Code Endpoint =====================

app.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  const { data } = await supabase
    .from('email_verifications')
    .select('code')
    .eq('email', email)
    .single();

  if (data && data.code === code) {

    // Optional: delete after verification
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email);

    res.json({ verified: true });

  } else {
    res.status(400).json({ verified: false, error: 'Invalid code' });
  }
});

// ===================== Start Server =====================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>
  console.log(`Email verification server running on port ${PORT}`)
);
