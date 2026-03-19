import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  serverUrl = 'https://ebas-backend.onrender.com';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef // เพิ่มตัวจัดการการวาดหน้าจอใหม่
  ) { }

  login() {
    if (this.loading) return;

    this.loading = true;
    this.error = '';

    // บังคับ Update UI ให้แสดงสถานะ Loading
    this.cdr.detectChanges();

    const payload = {
      username: this.username.trim(),
      password: this.password
    };

    this.http.post<any>(`${this.serverUrl}/api/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.detectChanges(); // บังคับ Update ก่อนย้ายหน้า
        
        localStorage.setItem('user', JSON.stringify(res.user));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log("เข้าสู่ Error Block แล้ว");
        this.loading = false;

        // ดักจับ Status 401 หรืออื่นๆ
        if (err.status === 401) {
          this.error = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        } else if (err.status === 404) {
          this.error = 'ไม่พบผู้ใช้งานนี้ในระบบ';
        } else if (err.status === 0) {
          this.error = 'ไม่สามารถเชื่อมต่อ Server ได้';
        } else {
          this.error = err.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        }

        // --- จุดสำคัญ: สั่งให้ Angular วาดหน้าจอใหม่ทันที ---
        // ปุ่มจะหายหมุน และ Error จะแสดงทันที
        this.cdr.detectChanges(); 
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}