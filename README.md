# 🏥 PRESCRIPTO

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-success)
![React](https://img.shields.io/badge/react-19-blue)
![MongoDB](https://img.shields.io/badge/mongodb-latest-green)

> A modern, comprehensive healthcare appointment booking and clinic management platform.

---

## 📖 Introduction

**PRESCRIPTO** is a full-stack web application designed to bridge the gap between healthcare providers and patients. It offers a seamless experience for patients to find local doctors, book appointments, and manage their health history, while providing clinic administrators and doctors with powerful tools to manage their schedules, patients, and digital prescriptions.

Built with performance, scalability, and exceptional user experience in mind, PRESCRIPTO uses the latest technologies in the JavaScript ecosystem to deliver a premium healthcare solution.

---

## ✨ Key Features

### For Patients (Frontend App)
*   **🩺 Doctor Discovery:** Search and filter doctors by specialty, availability, and consultation fees.
*   **📅 Easy Scheduling:** Intuitive interface to book, reschedule, or cancel appointments in real-time.
*   **💳 Secure Payments:** Integrated online payment processing via PayPal for consultation fees.
*   **👤 Patient Dashboard:** Complete overview of medical history, upcoming appointments, and prescriptions.

### For Administrators & Doctors (Admin App)
*   **📊 Comprehensive Dashboard:** High-level analytics of clinic performance, patient flow, and revenue.
*   **👨‍⚕️ Doctor Management:** Onboard new doctors, manage their profiles, specialties, and schedules.
*   **📑 Digital Prescriptions:** Generate and download PDF prescriptions directly from the platform.
*   **⚙️ Role-Based Access:** Secure authentication with distinct admin and doctor permission levels.

### Core Architecture
*   **AI Integrations:** Powered by Google Generative AI for smart medical data summarization and assistance.
*   **Cloud Storage:** Seamless media handling for doctor profiles and documents using Cloudinary.
*   **Automated Services:** Background cron jobs for appointment reminders and system maintenance via Node-cron.
*   **Email Notifications:** Automated state-change emails powered by Nodemailer.

---

## 🏗️ Overall Architecture

PRESCRIPTO utilizes a modular **Monorepo-style** architecture consisting of three main environments, built entirely on the MERN stack.

```mermaid
graph TD;
    Client[Patient Browser] -->|HTTP/HTTPS| Frontend;
    AdminUser[Admin/Doctor Browser] -->|HTTP/HTTPS| AdminPanel;
    
    Frontend[Frontend (React/Vite)] -->|REST API| Backend[Backend (Node/Express)];
    AdminPanel[Admin Panel (React/Vite)] -->|REST API| Backend;

    Backend -->|Mongoose| Database[(MongoDB)];
    Backend -->|Media Storage| Cloudinary[(Cloudinary)];
    Backend -->|Email Service| SMTP[Nodemailer/SMTP];
    Backend -->|Payments| PayPal[PayPal Gateway];
    Backend -->|AI Features| Gemini[Google Generative AI];
```

*   **Frontend**: React (v19) application powered by Vite, styled with TailwindCSS for the public patient portal.
*   **Admin**: React (v19) application powered by Vite, focused on administrative operations, featuring `pdfkit` for document generation.
*   **Backend**: Node.js and Express server handling routing, business logic, authentication (JWT), and external service integrations.
*   **Database**: MongoDB serving as the primary NoSQL data store, modeled with Mongoose.

---

## 🚀 Installation

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster URL)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/PRESCRIPTO.git
   cd PRESCRIPTO
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Install Admin Dependencies:**
   ```bash
   cd ../admin
   npm install
   ```

---

## ⚙️ Env Configuration

To run the application locally, you must create a `.env` file in each respective directory (`/backend`, `/frontend`, `/admin`).

### Backend (`/backend/.env`)
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/prescripto

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary (Image Storage)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret_key

# External Services
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
GEMINI_API_KEY=your_google_gemini_api_key
SMTP_EMAIL=your_smtp_email
SMTP_PASS=your_smtp_app_password
```

### Frontend (`/frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Admin (`/admin/.env`)
```env
VITE_BACKEND_URL=http://localhost:4000
```

---

## 🏃 Running the project

Once your environment variables are configured, you can start the application servers. It is recommended to run each process in a separate terminal window.

### Start the Backend Server
```bash
cd backend
npm run server
```

### Start the Frontend Application (Patient Portal)
```bash
cd frontend
npm run dev
```

### Start the Admin Dashboard
```bash
cd admin
npm run dev
```

The applications will typically be available at:
*   **Backend API**: `http://localhost:4000`
*   **Frontend**: `http://localhost:5173`
*   **Admin Panel**: `http://localhost:5174`

---

## 📁 Folder Structure

```text
PRESCRIPTO/
├── admin/                  # Clinic Administrators & Doctors Portal
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images, global styles
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context API state management
│   │   ├── pages/          # Application routes/views
│   │   └── App.jsx         # Root component
│   └── package.json
├── backend/                # Primary Node.js REST API
│   ├── config/             # Database and external service configs
│   ├── controllers/        # Request handling logic
│   ├── middlewares/        # Custom Express middlewares (Auth, Multer)
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # API endpoint definitions
│   └── server.js           # Express application entry point
└── frontend/               # Patient Facing Application
    ├── public/             # Static assets
    ├── src/
    │   ├── assets/         # Images, global styles
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React Context API state management
    │   ├── pages/          # Application routes/views
    │   └── App.jsx         # Root component
    └── package.json
```

---

## 🛣️ Roadmap

- [x] Initial full-stack MERN setup
- [x] Doctor and patient authentication modules
- [x] Appointment scheduling engine
- [x] Admin dashboard analytics integration
- [ ] Implement integrated video consultations (WebRTC)
- [ ] Add push notifications for appointment reminders
- [ ] Expand AI capabilities for smarter symptom checking
- [ ] Native mobile application endpoints (React Native)

---

## 🤝 Contribution Guidelines

We welcome contributions to make PRESCRIPTO even better!

1. **Fork the repository**
2. **Create your feature branch:** `git checkout -b feature/AmazingFeature`
3. **Commit your changes:** `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch:** `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

Please ensure your code follows the existing style, includes appropriate tests, and updates documentation as needed.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---
*Built with ❤️ for modern healthcare.*
