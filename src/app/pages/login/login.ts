import { Component } from '@angular/core';
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

  // แนะนำให้แยก URL ไว้เป็นตัวแปรกลาง
  serverUrl = 'https://ebas-backend.onrender.com';

  constructor(private http: HttpClient, private router: Router) { }

  login() {
    if (this.loading) return;

    this.loading = true;
    this.error = '';

    this.http.post<any>(this.serverUrl + '/api/login', {
      username: this.username.trim(), // ตัดช่องว่างออก
      password: this.password
    }).subscribe({
      next: (res) => {
        console.log("LOGIN SUCCESS", res);

        // 📌 เก็บข้อมูล User ไว้ใน LocalStorage เพื่อให้หน้าอื่นดึงไปใช้ได้
        localStorage.setItem('user', JSON.stringify(res.user));

        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error("LOGIN ERROR", err);
        this.loading = false;

        // แสดง Error ตามที่ Backend ส่งมา หรือค่าเริ่มต้น
        if (err.status === 401) {
          this.error = 'Username หรือ Password ไม่ถูกต้อง';
        } else if (err.status === 0) {
          this.error = 'ไม่สามารถเชื่อมต่อ Server ได้';
        } else {
          this.error = 'เกิดข้อผิดพลาดกรุณาลองใหม่';
        }
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
    // หมายเหตุ: อย่าลืมไปตั้งค่า path ใน app.routes.ts ด้วยนะ
  }
}