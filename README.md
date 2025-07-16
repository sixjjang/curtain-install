# Curtain Installation Platform

A comprehensive web platform for matching curtain installation jobs between sellers and contractors, with integrated payment processing, photo/video management, and contractor grading systems.

## Features

### 🔐 Authentication
- **Kakao Login Integration**: Seamless social login using Kakao SDK
- **Firebase Authentication**: Secure user management and role-based access
- **Admin Panel**: Comprehensive admin dashboard for platform management

### 📱 Push Notifications
- **Firebase Cloud Messaging (FCM)**: Real-time push notifications
- **Job Notifications**: Instant alerts for new jobs, status changes, and updates
- **Custom Notification Types**: Tailored notifications for different user roles

### 💼 Job Management
- **Job Posting**: Sellers can post installation jobs with detailed requirements
- **Job Assignment**: Contractors can browse and accept available jobs
- **Status Tracking**: Real-time job status updates (open, assigned, in-progress, completed)
- **Urgent Fee System**: Dynamic pricing based on job urgency and time elapsed

### 📸 Media Management
- **Photo/Video Upload**: Contractors can upload installation photos and videos
- **Watermarking**: Automatic watermark addition for content protection
- **Download System**: Secure paid download system for sellers
- **Preview System**: Thumbnail previews and full-screen viewing

### 💰 Payment & Billing
- **Pricing Management**: Flexible pricing system with base prices and urgent multipliers
- **Payment Processing**: Integration with payment gateways (Iamport)
- **Earnings Tracking**: Detailed earnings history for contractors
- **Withdrawal System**: Secure withdrawal requests and admin approval workflow

### 📊 Contractor System
- **Grading System**: Multi-level contractor grading based on performance
- **Evaluation System**: Photo quality evaluation and rating system
- **Earnings Calculation**: Automatic earnings calculation based on level and downloads
- **Appeal System**: Process for contractors to appeal evaluations

### 🏗️ Construction Management
- **Pricing Items**: Configurable pricing for different construction services
- **Urgent Fee Calculation**: Dynamic fee increases based on time and demand
- **Schedule Management**: Job scheduling and timeline tracking

## Tech Stack

### Frontend
- **React**: Modern UI framework
- **Firebase**: Authentication, Firestore database, Cloud Functions
- **React Router**: Client-side routing
- **React Modal**: Modal dialogs and overlays

### Backend
- **Firebase Cloud Functions**: Serverless backend functions
- **Firestore**: NoSQL database for real-time data
- **Firebase Storage**: File storage for photos and videos
- **Firebase Authentication**: User authentication and authorization

### External Integrations
- **Kakao SDK**: Social login integration
- **Iamport**: Payment processing
- **Sharp**: Image processing and watermarking

## Project Structure

```
curtain-install/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── firebase/        # Firebase configuration
│   ├── public/              # Static assets
│   └── docs/                # Frontend documentation
├── functions/               # Firebase Cloud Functions
│   ├── src/                 # Function source code
│   └── package.json         # Function dependencies
├── docs/                    # Project documentation
└── package.json             # Root package.json
```

## Key Components

### Authentication Components
- `KakaoLogin.js`: Kakao social login integration
- `AuthComponent.js`: Authentication state management
- `AdminRoleManager.js`: Admin role management

### Job Management
- `JobList.js`: Job listing and filtering
- `JobDetail.js`: Detailed job view with status management
- `JobAssignment.js`: Job assignment workflow
- `UrgentFeeManager.js`: Dynamic fee calculation

### Media Management
- `PhotoUpload.js`: Photo upload with progress tracking
- `PhotoDownloadList.js`: Download interface for sellers
- `PhotoPreviewList.js`: Photo preview with modal viewing
- `VideoDownloadList.js`: Video download management

### Payment & Billing
- `PricingManager.js`: Pricing item management
- `PaymentProcessor.js`: Payment processing integration
- `WithdrawalManager.js`: Withdrawal request management
- `EarningsCalculator.js`: Earnings calculation and tracking

### Admin Dashboard
- `AdminDashboard.js`: Main admin interface
- `ContractorManagement.js`: Contractor oversight
- `PaymentManagement.js`: Payment and withdrawal approval
- `MediaAdmin.js`: Media content management

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Firebase CLI
- Kakao Developer Account
- Iamport Account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sixjjang/curtain-install.git
   cd curtain-install
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../functions && npm install
   ```

3. **Firebase Setup**
   ```bash
   firebase login
   firebase init
   ```

4. **Environment Configuration**
   - Create `.env` files with your Firebase and Kakao credentials
   - Configure Firebase project settings

5. **Deploy**
   ```bash
   firebase deploy
   ```

## Configuration

### Firebase Configuration
- Set up Firestore security rules
- Configure Firebase Storage rules
- Set up Cloud Functions triggers

### Kakao Integration
- Register your application with Kakao Developers
- Configure redirect URIs
- Set up JavaScript key

### Payment Integration
- Configure Iamport credentials
- Set up webhook endpoints
- Test payment flows

## Security Considerations

- **Firestore Rules**: Implement proper read/write rules
- **Authentication**: Role-based access control
- **File Upload**: Validate file types and sizes
- **Payment Security**: Server-side payment verification
- **Data Privacy**: Secure handling of user data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the GitHub repository.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced payment options
- [ ] AI-powered contractor matching
- [ ] Real-time chat system 