# PRESCRIPTO - AI Coding Agent Instructions

## Architecture Overview

**PRESCRIPTO** is a three-tier full-stack healthcare appointment booking system:

- **Backend** (Node.js/Express): REST API with MongoDB, JWT auth, Cloudinary image uploads
- **Frontend** (React/Vite): Patient-facing appointment booking and doctor browsing
- **Admin** (React/Vite): Administrative dashboard for managing doctors and appointments

Data flows: Frontend/Admin → Backend API → MongoDB. Context API manages client-side state.

## Key Architectural Patterns

### Authentication
- **Admin**: JWT token stored in `localStorage.aToken`. Generated in `loginAdmin` controller by signing `email+password` with `process.env.JWT_SECRET`.
- **Middleware**: `authAdmin` verifies JWT and checks if decoded value matches `ADMIN_EMAIL+ADMIN_PASSWORD` concatenation.
- **Patient**: Not yet implemented (placeholder patterns in `AppContext.jsx`).

### Data Models (MongoDB)
- **Doctor** (`backend/models/doctorModels.js`): name, email, password (bcrypt-hashed), image (Cloudinary URL), speciality, degree, experience, fees, address, slots_booked.
- **User**: Basic schema exists but not fully integrated.

### File Uploads
- **Cloudinary Integration**: Images uploaded via `multer` middleware, then pushed to Cloudinary. Returns `secure_url` for storage in DB.
- **Multer Config** (`backend/middlewares/multer.js`): Disk storage, preserves original filename.

### API Response Pattern
All endpoints return: `{ success: boolean, message: string, [data]: any }`

## Project Structure & Key Files

```
backend/
  ├── server.js                 # Entry point; sets up Express, DB, routes
  ├── config/
  │   ├── mongodb.js            # Mongoose connection to MONGODB_URI/prescripto
  │   └── cloudinary.js         # Cloudinary SDK init
  ├── controllers/
  │   ├── adminController.js    # addDoctor, loginAdmin, allDoctors (JWT signing done here)
  │   └── doctorController.js   # (stub)
  ├── middlewares/
  │   ├── authAdmin.js          # JWT verification for protected routes
  │   └── multer.js             # File upload handler
  ├── models/
  │   └── doctorModels.js       # Mongoose schema with slots_booked tracking
  └── routes/
      └── adminRoute.js         # POST /add-doctor, /login, /all-doctors

admin/
  ├── src/
  │   ├── App.jsx               # Route guards by checking aToken from context
  │   ├── context/
  │   │   └── AdminContext.jsx  # aToken state, backendUrl from VITE_BACKEND_URL
  │   ├── pages/
  │   │   ├── Login.jsx         # Admin login page
  │   │   └── Admin/
  │   │       ├── AddDoctor.jsx # Form posts to /api/admin/add-doctor with FormData
  │   │       ├── DoctorList.jsx
  │   │       └── AllAppointment.jsx
  │   └── components/
  │       ├── NavBar.jsx
  │       └── Sidebar.jsx       # Navigation for admin routes
  └── .env                      # VITE_BACKEND_URL=http://localhost:4000

frontend/
  ├── src/
  │   ├── App.jsx               # Routes: /, /doctors, /doctors/:speciality, /appointment/:docId, etc.
  │   ├── context/
  │   │   └── AppContext.jsx    # currencySymbol, doctors (from assets.js)
  │   ├── pages/
  │   │   ├── Home.jsx          # Lists top doctors via TopDoctors component
  │   │   ├── Doctors.jsx       # Speciality filtering
  │   │   ├── Appointment.jsx   # Book appointment for doctor
  │   │   └── Login.jsx         # Patient login (stub)
  │   └── components/
  │       ├── SpecialityMenu.jsx # Doctor specialty filters
  │       └── RelatedDoctors.jsx # Shows similar specialty doctors
  └── assets/
      └── assets.js             # Static doctors list (temporary; should fetch from API)
```

## Critical Development Workflows

### Starting Development
```powershell
# Terminal 1: Backend
cd backend
npm install
npm run server          # Runs with nodemon on port 4000
```

```powershell
# Terminal 2: Frontend (if needed)
cd frontend
npm install
npm run dev            # Vite dev server (typically port 5173)
```

```powershell
# Terminal 3: Admin (if needed)
cd admin
npm install
npm run dev            # Vite dev server (typically port 5174)
```

### Environment Setup
Create `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
PORT=4000
```

Create `admin/.env`:
```
VITE_BACKEND_URL=http://localhost:4000
```

### Running Tests
No test suite currently configured. Recommend adding Jest/Vitest for backend and frontend.

## Code Conventions & Patterns

### Form Submissions (Admin)
1. Use FormData for multipart/form-data (required for image uploads)
2. POST to backend with axios, include auth token in headers: `{ atoken: token }`
3. Example: `AddDoctor.jsx` sends FormData to `/api/admin/add-doctor`

### React Components
- Use Context API for global state (AdminContext, AppContext)
- No TypeScript; use JSX with standard prop patterns
- Tailwind CSS for styling (see `tailwind.config.js` and `postcss.config.js`)
- Use `react-toastify` for notifications (`ToastContainer` in App.jsx)

### Backend Controllers
- Always wrap in try-catch
- Validate required fields early
- Use `validator` library for email/password checks
- Hash passwords with bcrypt (salt rounds: 10)
- Return consistent JSON response object

### Password Validation
Minimum 8 characters enforced in `addDoctor`. No complexity rules currently (consider adding).

## Integration Points & External Dependencies

### Cloudinary
- Initialized in `backend/config/cloudinary.js`
- Upload happens in `adminController.addDoctor` after multer processes file
- Images stored as URLs in doctor.image field

### MongoDB
- Connected in `backend/config/mongodb.js` to database `prescripto`
- Schemas use `minimize: false` in doctor model to preserve empty objects (e.g., slots_booked)

### JWT
- Token format: `sign(email+password)` (consider changing to payload object for security)
- Verified against `ADMIN_EMAIL+ADMIN_PASSWORD` (poor practice; should use user ID)

## Common Pitfalls & Patterns to Avoid

1. **JWT Security**: Current implementation signs/verifies literal `email+password` string. Should use user ID in token payload.
2. **Admin Auth**: Hardcoded admin credentials in env vars. For multi-admin, move to user table.
3. **Incomplete Features**: `AppContext` and `DoctorContext` have stub methods. Implementation needed for patient flows.
4. **Static Data**: Frontend still uses `assets.js` mock doctors; should fetch from API.
5. **Image Storage**: Multer disk storage persists to filesystem. Ensure cleanup or use memory storage in production.

## Notes for AI Agents

- When adding endpoints, follow the existing response pattern: `{ success, message, [data] }`
- Protect admin routes with `authAdmin` middleware
- For patient authentication, implement similar pattern but store user ID in token payload
- Always validate and sanitize input before DB operations
- Update both `AdminContext` and `AppContext` when adding new state or API calls
- Test with Postman or curl before integrating into React components
