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
  
  // 🌟 เพิ่มตัวแปรเช็คสถานะการเปิด/ปิด Modal
  isLogoutModalOpen = false;

  constructor(private router: Router) { }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  // ฟังก์ชันเปิด Modal
  openLogoutModal() {
    this.isLogoutModalOpen = true;
  }

  // ฟังก์ชันปิด Modal
  closeLogoutModal() {
    this.isLogoutModalOpen = false;
  }

  // ฟังก์ชันเมื่อกดยืนยันออกจากระบบในหน้า Modal
  confirmLogout() {
    // 1. ปิด Modal ก่อน
    this.isLogoutModalOpen = false;

    // 2. เคลียร์ข้อมูลใน localStorage
    localStorage.clear();

    // 3. นำทางกลับไปหน้า Login
    this.router.navigate(['/login']).then(() => {
      // 4. (ทางเลือก) สั่งรีเฟรช 1 ครั้งเพื่อเคลียร์ State ทั้งหมด
      window.location.reload();
    });

    console.log('User logged out successfully');
  }
}