import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'] // ใช้ไฟล์เดิมร่วมกับ login ได้ หรือสร้างใหม่ที่มีเนื้อหาเหมือนกัน
})
export class RegisterComponent {
  username = '';
  password = '';
  loading = false;
  
  // 🟢 เพิ่ม/แก้ไข 2 ตัวแปรนี้ให้ตรงกับหน้า HTML
  error = '';    // สำหรับเก็บข้อความ Error
  success = false; // สำหรับเช็คสถานะว่าสมัครสำเร็จหรือยัง

  serverUrl = 'https://ebas-backend.onrender.com';

  constructor(private http: HttpClient, private router: Router) { }

  register() {
    if (this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = false;

    this.http.post<any>(this.serverUrl + '/api/register', {
      username: this.username.trim(),
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true; // 🟢 เปลี่ยนสถานะเป็นสำเร็จ
        
        // รอ 2 วินาทีแล้วไปหน้า login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        // 🟢 เก็บข้อความ error ไว้แสดงในหน้า HTML
        this.error = err.error?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}