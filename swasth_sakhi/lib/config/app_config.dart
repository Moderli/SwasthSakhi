import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get appName => dotenv.env['APP_NAME'] ?? 'Swasth Sakhi';
  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';
  
  // Supabase Configuration
  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? '';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  
  // API Configuration
  static int get apiTimeout => int.tryParse(dotenv.env['API_TIMEOUT'] ?? '30000') ?? 30000;
  static int get apiRetryCount => int.tryParse(dotenv.env['API_RETRY_COUNT'] ?? '3') ?? 3;
  
  // Feature Flags
  static bool get enableAnalytics => dotenv.env['ENABLE_ANALYTICS']?.toLowerCase() == 'true';
  static bool get enableCrashReporting => dotenv.env['ENABLE_CRASH_REPORTING']?.toLowerCase() == 'true';
} 