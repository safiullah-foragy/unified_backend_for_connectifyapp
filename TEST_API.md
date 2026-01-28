# Testing Your Deployed Unified Backend API

Your API is successfully deployed at: **https://unified-backend-for-connectifyapp.onrender.com**

## Quick Tests

### 1. Test Root Endpoint (Browser)
Simply open this URL in your browser:
```
https://unified-backend-for-connectifyapp.onrender.com/
```

### 2. Test with PowerShell
```powershell
# Test root endpoint
curl https://unified-backend-for-connectifyapp.onrender.com/

# Test with API key
$headers = @{
    "X-API-Key" = "f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c"
}
Invoke-RestMethod -Uri "https://unified-backend-for-connectifyapp.onrender.com/api/firestore/collection/users" -Headers $headers
```

### 3. Test with Postman

#### A. Root Endpoint
- **Method**: GET
- **URL**: `https://unified-backend-for-connectifyapp.onrender.com/`
- **Headers**: None required

#### B. Generate Agora Token
- **Method**: POST
- **URL**: `https://unified-backend-for-connectifyapp.onrender.com/api/agora/token`
- **Headers**:
  - `X-API-Key`: `f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "channelName": "test-channel",
  "uid": 12345,
  "role": "publisher"
}
```

#### C. Verify Firebase Token
- **Method**: POST
- **URL**: `https://unified-backend-for-connectifyapp.onrender.com/api/auth/verify`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "token": "YOUR_FIREBASE_ID_TOKEN_HERE"
}
```

#### D. Firestore - Add Document
- **Method**: POST
- **URL**: `https://unified-backend-for-connectifyapp.onrender.com/api/firestore/collection/test`
- **Headers**:
  - `X-API-Key`: `f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "status": "active"
}
```

#### E. Firestore - Query Collection
- **Method**: GET
- **URL**: `https://unified-backend-for-connectifyapp.onrender.com/api/firestore/collection/test?limit=10`
- **Headers**:
  - `X-API-Key`: `f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c`

## Available Endpoints

### Public Endpoints (No Auth Required)
- `GET /` - API information
- `POST /api/auth/verify` - Verify Firebase token
- `POST /api/auth/user` - Get user info

### Protected Endpoints (Require X-API-Key or Firebase Token)
- `POST /api/agora/token` - Generate Agora RTC token
- `POST /api/firestore/collection/:collection` - Add document
- `GET /api/firestore/collection/:collection` - Query collection
- `GET /api/firestore/collection/:collection/:id` - Get document
- `PUT /api/firestore/collection/:collection/:id` - Update document
- `DELETE /api/firestore/collection/:collection/:id` - Delete document
- `POST /api/storage/*` - Storage operations
- `POST /api/jobs/*` - Job API proxy
- `POST /api/ai/*` - AI service proxy

## Testing from Flutter App

In your Flutter app, update the API base URL:

```dart
const String API_BASE_URL = 'https://unified-backend-for-connectifyapp.onrender.com';
const String API_KEY = 'f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c';

// Example API call
Future<void> generateAgoraToken() async {
  final response = await http.post(
    Uri.parse('$API_BASE_URL/api/agora/token'),
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'channelName': 'my-channel',
      'uid': userId,
      'role': 'publisher',
    }),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    print('Token: ${data['token']}');
  }
}
```

## Notes

⚠️ **Important**: 
- The free Render instance may spin down after inactivity (causes 50+ second delays on first request)
- External API dependencies (Agora Token Server, Job API, AI Reader API) may be sleeping too
- Consider upgrading to a paid plan for production use

✅ **Your API is working correctly!**
