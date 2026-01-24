# API Examples & Integration Guide

Practical examples for integrating the Unified Backend API with your Flutter app.

## Table of Contents
- [Setup](#setup)
- [Authentication](#authentication)
- [Agora Video Calls](#agora-video-calls)
- [File Upload](#file-upload)
- [Job Search](#job-search)
- [AI Content Analysis](#ai-content-analysis)
- [Firestore Operations](#firestore-operations)
- [Error Handling](#error-handling)

## Setup

### 1. Add Configuration Class

Create `lib/unified_api_config.dart`:

```dart
import 'package:firebase_auth/firebase_auth.dart';

class UnifiedAPIConfig {
  // Update this with your deployed Render URL
  static const String baseUrl = 'https://your-unified-backend.onrender.com';
  
  // Your API secret key (optional, use Firebase tokens instead)
  static const String apiKey = 'your-api-secret-key';
  
  // Headers with API key
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };
  
  // Headers with Firebase token
  static Future<Map<String, String>> get authHeaders async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }
    
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
  
  // Headers for multipart requests
  static Future<Map<String, String>> get authHeadersMultipart async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }
    
    final token = await user.getIdToken();
    return {
      'Authorization': 'Bearer $token',
    };
  }
}
```

## Authentication

### Verify Firebase Token

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> verifyToken(String firebaseToken) async {
  final response = await http.post(
    Uri.parse('${UnifiedAPIConfig.baseUrl}/api/auth/verify'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'token': firebaseToken,
    }),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Token verification failed: ${response.body}');
  }
}
```

### Get User Information

```dart
Future<Map<String, dynamic>> getUserInfo(String firebaseToken) async {
  final response = await http.post(
    Uri.parse('${UnifiedAPIConfig.baseUrl}/api/auth/user'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'token': firebaseToken,
    }),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to get user info: ${response.body}');
  }
}
```

## Agora Video Calls

### Get RTC Token for Video/Audio Call

Replace your existing `AgoraTokenService` with this:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'unified_api_config.dart';

class UnifiedAgoraTokenService {
  static Future<String> fetchRtcToken({
    required String channelName,
    required int uid,
    String role = 'publisher',
    int expireSeconds = 3600,
  }) async {
    try {
      final headers = await UnifiedAPIConfig.authHeaders;
      
      final response = await http.get(
        Uri.parse(
          '${UnifiedAPIConfig.baseUrl}/api/agora/rtc-token'
          '?channelName=$channelName'
          '&uid=$uid'
          '&role=$role'
          '&expiry=$expireSeconds'
        ),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['token'];
      } else {
        throw Exception('Failed to get RTC token: ${response.body}');
      }
    } catch (e) {
      print('Error fetching RTC token: $e');
      rethrow;
    }
  }
  
  static Future<String> fetchRtmToken({
    required int uid,
    int expireSeconds = 3600,
  }) async {
    try {
      final headers = await UnifiedAPIConfig.authHeaders;
      
      final response = await http.get(
        Uri.parse(
          '${UnifiedAPIConfig.baseUrl}/api/agora/rtm-token'
          '?uid=$uid'
          '&expiry=$expireSeconds'
        ),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['token'];
      } else {
        throw Exception('Failed to get RTM token: ${response.body}');
      }
    } catch (e) {
      print('Error fetching RTM token: $e');
      rethrow;
    }
  }
}
```

## File Upload

### Upload to Supabase via Unified API

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'dart:convert';

Future<Map<String, dynamic>> uploadFile({
  required File file,
  String bucket = 'profile-images',
  String folder = '',
  String? fileName,
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeadersMultipart;
    
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/storage/upload'),
    );
    
    // Add headers
    request.headers.addAll(headers);
    
    // Add file
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        filename: fileName ?? p.basename(file.path),
      ),
    );
    
    // Add fields
    request.fields['bucket'] = bucket;
    if (folder.isNotEmpty) {
      request.fields['folder'] = folder;
    }
    if (fileName != null) {
      request.fields['fileName'] = fileName;
    }
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Upload failed: ${response.body}');
    }
  } catch (e) {
    print('Error uploading file: $e');
    rethrow;
  }
}

// Example usage:
Future<void> uploadProfilePicture(File imageFile) async {
  try {
    final result = await uploadFile(
      file: imageFile,
      bucket: 'profile-images',
      folder: 'avatars',
      fileName: 'user_${FirebaseAuth.instance.currentUser!.uid}.jpg',
    );
    
    print('Upload successful!');
    print('URL: ${result['data']['url']}');
    
    // Update user profile with new image URL
    // ...
  } catch (e) {
    print('Upload error: $e');
  }
}
```

### Upload Multiple Files

```dart
Future<Map<String, dynamic>> uploadMultipleFiles({
  required List<File> files,
  String bucket = 'profile-images',
  String folder = '',
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeadersMultipart;
    
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/storage/upload-multiple'),
    );
    
    request.headers.addAll(headers);
    request.fields['bucket'] = bucket;
    if (folder.isNotEmpty) {
      request.fields['folder'] = folder;
    }
    
    // Add all files
    for (var file in files) {
      request.files.add(
        await http.MultipartFile.fromPath(
          'files',
          file.path,
          filename: p.basename(file.path),
        ),
      );
    }
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Upload failed: ${response.body}');
    }
  } catch (e) {
    print('Error uploading files: $e');
    rethrow;
  }
}
```

## Job Search

### Fetch Jobs

```dart
Future<List<dynamic>> fetchJobs({
  int limit = 100,
  int offset = 0,
  String? search,
  String? category,
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    var params = {
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    
    if (search != null && search.isNotEmpty) {
      params['search'] = search;
    }
    if (category != null && category.isNotEmpty) {
      params['category'] = category;
    }
    
    final uri = Uri.parse('${UnifiedAPIConfig.baseUrl}/api/jobs')
        .replace(queryParameters: params);
    
    final response = await http.get(uri, headers: headers);
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['jobs'] ?? [];
    } else if (response.statusCode == 503) {
      // Service sleeping, retry after delay
      await Future.delayed(Duration(seconds: 2));
      return fetchJobs(
        limit: limit,
        offset: offset,
        search: search,
        category: category,
      );
    } else {
      throw Exception('Failed to fetch jobs: ${response.body}');
    }
  } catch (e) {
    print('Error fetching jobs: $e');
    rethrow;
  }
}
```

### Search Jobs

```dart
Future<List<dynamic>> searchJobs({
  required String query,
  String? category,
  String? location,
  String? type,
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    var params = {'q': query};
    if (category != null) params['category'] = category;
    if (location != null) params['location'] = location;
    if (type != null) params['type'] = type;
    
    final uri = Uri.parse('${UnifiedAPIConfig.baseUrl}/api/jobs/search')
        .replace(queryParameters: params);
    
    final response = await http.get(uri, headers: headers);
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['jobs'] ?? [];
    } else {
      throw Exception('Search failed: ${response.body}');
    }
  } catch (e) {
    print('Error searching jobs: $e');
    rethrow;
  }
}
```

## AI Content Analysis

### Analyze File

```dart
Future<Map<String, dynamic>> analyzeFile(File file) async {
  try {
    final headers = await UnifiedAPIConfig.authHeadersMultipart;
    
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/ai/extract'),
    );
    
    request.headers.addAll(headers);
    request.files.add(
      await http.MultipartFile.fromPath('file', file.path),
    );
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Analysis failed: ${response.body}');
    }
  } catch (e) {
    print('Error analyzing file: $e');
    rethrow;
  }
}
```

### Analyze URL

```dart
Future<Map<String, dynamic>> analyzeUrl(String url) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    final response = await http.post(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/ai/analyze-url'),
      headers: headers,
      body: json.encode({'url': url}),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Analysis failed: ${response.body}');
    }
  } catch (e) {
    print('Error analyzing URL: $e');
    rethrow;
  }
}
```

### Chat with AI

```dart
Future<String> chatWithAI({
  required String message,
  String? context,
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    final response = await http.post(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/ai/chat'),
      headers: headers,
      body: json.encode({
        'message': message,
        if (context != null) 'context': context,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['response'] ?? '';
    } else {
      throw Exception('Chat failed: ${response.body}');
    }
  } catch (e) {
    print('Error in AI chat: $e');
    rethrow;
  }
}
```

## Firestore Operations

### Add Document

```dart
Future<String> addDocument(String collection, Map<String, dynamic> data) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    final response = await http.post(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/firestore/collection/$collection'),
      headers: headers,
      body: json.encode(data),
    );
    
    if (response.statusCode == 200) {
      final result = json.decode(response.body);
      return result['id'];
    } else {
      throw Exception('Failed to add document: ${response.body}');
    }
  } catch (e) {
    print('Error adding document: $e');
    rethrow;
  }
}
```

### Get Document

```dart
Future<Map<String, dynamic>> getDocument(String collection, String id) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    final response = await http.get(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/firestore/collection/$collection/$id'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final result = json.decode(response.body);
      return result['data'];
    } else if (response.statusCode == 404) {
      throw Exception('Document not found');
    } else {
      throw Exception('Failed to get document: ${response.body}');
    }
  } catch (e) {
    print('Error getting document: $e');
    rethrow;
  }
}
```

### Query Collection

```dart
Future<List<Map<String, dynamic>>> queryCollection({
  required String collection,
  int limit = 100,
  String? orderBy,
  String? orderDirection,
  List<String>? whereConditions,
}) async {
  try {
    final headers = await UnifiedAPIConfig.authHeaders;
    
    var params = {'limit': limit.toString()};
    if (orderBy != null) params['orderBy'] = orderBy;
    if (orderDirection != null) params['orderDirection'] = orderDirection;
    if (whereConditions != null) {
      params['where'] = whereConditions.join(',');
    }
    
    final uri = Uri.parse('${UnifiedAPIConfig.baseUrl}/api/firestore/collection/$collection')
        .replace(queryParameters: params);
    
    final response = await http.get(uri, headers: headers);
    
    if (response.statusCode == 200) {
      final result = json.decode(response.body);
      return List<Map<String, dynamic>>.from(result['documents'] ?? []);
    } else {
      throw Exception('Query failed: ${response.body}');
    }
  } catch (e) {
    print('Error querying collection: $e');
    rethrow;
  }
}
```

## Error Handling

### Centralized Error Handler

```dart
class APIException implements Exception {
  final int statusCode;
  final String message;
  final dynamic details;
  
  APIException(this.statusCode, this.message, [this.details]);
  
  @override
  String toString() => 'APIException($statusCode): $message';
}

Future<T> handleAPIRequest<T>(Future<http.Response> Function() request) async {
  try {
    final response = await request();
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body) as T;
    } else if (response.statusCode == 401) {
      throw APIException(401, 'Authentication required');
    } else if (response.statusCode == 403) {
      throw APIException(403, 'Access forbidden');
    } else if (response.statusCode == 404) {
      throw APIException(404, 'Resource not found');
    } else if (response.statusCode == 503) {
      throw APIException(503, 'Service temporarily unavailable');
    } else {
      final error = json.decode(response.body);
      throw APIException(
        response.statusCode,
        error['message'] ?? 'Unknown error',
        error['details'],
      );
    }
  } on SocketException {
    throw APIException(0, 'No internet connection');
  } on TimeoutException {
    throw APIException(0, 'Request timed out');
  } catch (e) {
    if (e is APIException) rethrow;
    throw APIException(0, 'Unexpected error: $e');
  }
}

// Usage example:
Future<void> example() async {
  try {
    final jobs = await handleAPIRequest<Map<String, dynamic>>(() async {
      final headers = await UnifiedAPIConfig.authHeaders;
      return http.get(
        Uri.parse('${UnifiedAPIConfig.baseUrl}/api/jobs'),
        headers: headers,
      );
    });
    
    print('Jobs fetched: ${jobs['count']}');
  } on APIException catch (e) {
    if (e.statusCode == 503) {
      // Retry logic
      await Future.delayed(Duration(seconds: 30));
      // Retry request...
    } else {
      // Show error to user
      print('Error: ${e.message}');
    }
  }
}
```

---

## Complete Integration Example

Here's a complete example of updating your app to use the unified backend:

### 1. Create a Service Class

Create `lib/services/unified_backend_service.dart`:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import '../unified_api_config.dart';

class UnifiedBackendService {
  // Agora
  static Future<String> getAgoraRTCToken({
    required String channelName,
    required int uid,
  }) async {
    final headers = await UnifiedAPIConfig.authHeaders;
    final response = await http.get(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/agora/rtc-token?channelName=$channelName&uid=$uid'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['token'];
    }
    throw Exception('Failed to get Agora token');
  }
  
  // Storage
  static Future<String> uploadFile(File file, {String folder = ''}) async {
    final headers = await UnifiedAPIConfig.authHeadersMultipart;
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/storage/upload'),
    );
    
    request.headers.addAll(headers);
    request.files.add(await http.MultipartFile.fromPath('file', file.path));
    request.fields['bucket'] = 'profile-images';
    if (folder.isNotEmpty) request.fields['folder'] = folder;
    
    final response = await http.Response.fromStream(await request.send());
    if (response.statusCode == 200) {
      return json.decode(response.body)['data']['url'];
    }
    throw Exception('Upload failed');
  }
  
  // Jobs
  static Future<List<dynamic>> getJobs({int limit = 100}) async {
    final headers = await UnifiedAPIConfig.authHeaders;
    final response = await http.get(
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/jobs?limit=$limit'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['jobs'] ?? [];
    }
    throw Exception('Failed to fetch jobs');
  }
  
  // AI
  static Future<Map<String, dynamic>> analyzeContent(File file) async {
    final headers = await UnifiedAPIConfig.authHeadersMultipart;
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('${UnifiedAPIConfig.baseUrl}/api/ai/extract'),
    );
    
    request.headers.addAll(headers);
    request.files.add(await http.MultipartFile.fromPath('file', file.path));
    
    final response = await http.Response.fromStream(await request.send());
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Analysis failed');
  }
}
```

### 2. Update Your Existing Code

Replace direct API calls with unified backend calls:

**Before:**
```dart
// Old: Direct Supabase upload
await supabase.storage.from('bucket').upload('path', file);

// Old: Direct Agora token server
await http.get('https://render-agora-token-server-app.onrender.com/...');

// Old: Direct Job API
await http.get('https://bd-job-api.onrender.com/api/jobs');
```

**After:**
```dart
// New: Via unified backend
final url = await UnifiedBackendService.uploadFile(file, folder: 'avatars');
final token = await UnifiedBackendService.getAgoraRTCToken(channelName: 'room', uid: 123);
final jobs = await UnifiedBackendService.getJobs(limit: 50);
```

---

**That's it! Your Flutter app now uses the unified backend API for all services.** 🎉
