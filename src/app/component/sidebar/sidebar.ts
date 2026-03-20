import { Component, OnInit } from '@angular/core'; // เพิ่ม OnInit
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  isInitialLoad = true; // ✨ สำหรับปิด animation ตอนเข้าหน้าครั้งแรก
  isLogoutModalOpen = false;

  constructor(private router: Router) { }

  ngOnInit() {
    // 1. ดึงสถานะที่บันทึกไว้
    const savedState = localStorage.getItem('sidebarCollapsed');
    this.isCollapsed = savedState === 'true';

    // 2. ปิดโหมด 'หน้าแรก' หลังจาก Render เสร็จ (100ms) เพื่อให้กด Toggle ปกติมี animation
    setTimeout(() => {
      this.isInitialLoad = false;
    }, 100);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());
  }

  openLogoutModal() { this.isLogoutModalOpen = true; }
  closeLogoutModal() { this.isLogoutModalOpen = false; }

  confirmLogout() {
    this.isLogoutModalOpen = false;
    localStorage.clear();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}