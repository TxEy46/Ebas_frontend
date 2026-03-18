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

  constructor(private http: HttpClient, private router: Router) { }

  login() {
    if (this.loading) return;

    this.loading = true;
    this.error = '';

    this.http.post('http://localhost:3001/api/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        console.log("LOGIN SUCCESS");
        this.loading = false; // ✅ สำคัญ

        // 🔥 ไปหน้า activity
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);
        this.error = 'Username หรือ Password ไม่ถูกต้อง';
        this.loading = false;
      }
    });
  }
}