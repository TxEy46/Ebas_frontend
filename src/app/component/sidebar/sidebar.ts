import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  isCollapsed = false;

  constructor(private router: Router) { }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  onLogout() {
    // 1. 🛑 สำคัญมาก: ต้องลบข้อมูล user ออกจาก localStorage
    localStorage.clear()

    // ถ้ามีการเก็บ token หรือข้อมูลอื่นๆ ให้ล้างออกให้หมด
    // localStorage.clear(); // หรือจะใช้คำสั่งนี้เพื่อล้างทั้งหมดในทีเดียวก็ได้

    // 2. ดีดผู้ใช้ออกไปหน้า Login
    // Note: เมื่อไม่มี 'user' ใน localStorage แล้ว Auth Guard จะยอมให้เราอยู่ที่หน้า Login
    this.router.navigate(['/login']).then(() => {
      // 3. (ทางเลือก) สั่ง Reload เพื่อเคลียร์ State ค้างคาใน Memory ของ Angular
      window.location.reload();
    });

    console.log('User logged out successfully');
  }
}