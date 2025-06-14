import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final supabase = Supabase.instance.client;

  Future<AuthResponse> signup(String name, String email, String password) async {
    try {
      final response = await supabase.auth.signUp(
        email: email,
        password: password,
        data: {'name': name},
      );
      return response;
    } catch (e) {
      throw Exception('Failed to sign up: $e');
    }
  }

  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      return response;
    } catch (e) {
      throw Exception('Failed to login: $e');
    }
  }

  Future<void> logout() async {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      throw Exception('Failed to logout: $e');
    }
  }

  User? get currentUser => supabase.auth.currentUser;

  Stream<AuthState> get authStateChanges => supabase.auth.onAuthStateChange;
} 