# 💈 Lovely Mens Beauty Parlour — Full Stack Website

Owner: Maharajan R | Phone: 9442887267
Branches: 92/241 & 92/242, Mudalur Road, Sathankulam

==========================================================
HOW TO RUN IN VS CODE
==========================================================

STEP 1 — Add your Fast2SMS API key
────────────────────────────────────
1. Open:  backend/.env
2. Replace  YOUR_FAST2SMS_KEY_HERE  with your actual key

   How to get your key:
   a) Go to https://www.fast2sms.com
   b) Sign Up → verify your phone
   c) Login → click "Dev API" in the left sidebar
   d) Copy the API key shown there
   e) Paste it in backend/.env like this:
      FAST2SMS_API_KEY=AbCdEfGhIj1234567890abcdefgh

STEP 2 — Start the Backend
────────────────────────────
Open Terminal 1 in VS Code:

   cd backend
   npm install
   node server.js

You should see:
   ✅ Server running on http://localhost:5000

STEP 3 — Start the Frontend
─────────────────────────────
Open Terminal 2 in VS Code:

   cd frontend
   npm install
   npm start

Website opens at: http://localhost:3000

==========================================================
HOW SMS WORKS
==========================================================

When a customer clicks "Confirm Booking":

1. Booking is saved to backend/data/bookings.json
2. Backend automatically calls Fast2SMS API
3. SMS is sent to owner's phone: 9442887267
4. Customer sees a confirmation screen with:
   - "SMS Sent to Owner" green notice
   - WhatsApp button (optional, for customer to also WhatsApp)
   - Payment section (GPay / PhonePe)

SMS content example:
────────────────────
New Booking - Lovely Mens Beauty Parlour
Customer: Rajan
Phone: 9876543210
Branch: AC Branch — 92/242, Mudalur Road
Services: Hair Cut (18+) (Rs.100), Shaving (Rs.60)
Total: Rs.160
Date: 2025-01-15
Time: 10:00 AM
Booked via website

==========================================================
FOLDER STRUCTURE
==========================================================

lovely-salon/
├── backend/
│   ├── controllers/
│   │   ├── bookingsController.js  ← SMS logic here
│   │   └── servicesController.js
│   ├── data/
│   │   ├── bookings.json          ← All bookings stored here
│   │   └── services.json          ← Service list + prices
│   ├── routes/
│   │   ├── bookings.js
│   │   └── services.js
│   ├── server.js
│   ├── .env                       ← ADD YOUR SMS KEY HERE
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── logo.png               ← Shop logo (included)
    │   ├── owner.png              ← Owner photo (included)
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── components/
        │   ├── Navbar.js + .css
        │   ├── Footer.js + .css
        │   └── ServiceCard.js + .css
        ├── pages/
        │   ├── Home.js + .css
        │   ├── About.js + .css
        │   ├── Services.js + .css
        │   ├── Branches.js + .css
        │   ├── CartPage.js + .css  ← Booking + SMS + WhatsApp
        │   ├── Contact.js + .css
        │   ├── AdminLogin.js + .css
        │   └── AdminDashboard.js + .css
        └── styles/
            └── global.css

==========================================================
ADMIN PANEL
==========================================================

URL:   http://localhost:3000/admin
Login: Phone number 9442887267

Features:
- View all bookings
- Delete bookings
- Edit service names, prices, descriptions
- Logout

==========================================================
API ENDPOINTS
==========================================================

GET    /api/services        → List all services
PUT    /api/services/:id    → Update a service (admin)
GET    /api/bookings        → List all bookings (admin)
POST   /api/bookings        → Create booking + send SMS
DELETE /api/bookings/:id    → Delete a booking (admin)

==========================================================
PAYMENT INFO (shown to customers)
==========================================================

GPay:     9442887267
PhonePe:  9442887267
Cash:     Accepted at shop

==========================================================
TROUBLESHOOTING
==========================================================

Problem: SMS not sending
Fix:
  - Check that FAST2SMS_API_KEY is set correctly in backend/.env
  - Make sure you restarted the backend after editing .env
  - Check the terminal — it prints [SMS] logs
  - Your Fast2SMS account needs credits (free plan gives some on signup)
  - Check fast2sms.com dashboard for delivery reports

Problem: "Cannot connect to server" on website
Fix:
  - Make sure backend is running (node server.js in backend/ folder)
  - Backend must be on port 5000
  - Check backend terminal for any error messages

Problem: npm install fails
Fix:
  - Make sure you have Node.js installed: https://nodejs.org
  - Download Node.js LTS version and reinstall

==========================================================
