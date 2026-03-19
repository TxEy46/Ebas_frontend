import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = localStorage.getItem('user');

  // รายชื่อหน้าที่เข้าได้ "เฉพาะตอนที่ยังไม่ได้ Login"
  const authRoutes = ['/login', '/register'];

  if (user) {
    // ✅ ถ้า Login อยู่แล้ว...
    if (authRoutes.includes(state.url)) {
      // ...แต่พยายามจะไปหน้า Login/Register ให้เด้งไป Dashboard แทน
      router.navigate(['/dashboard']);
      return false;
    }
    return true; // เข้าหน้าอื่นๆ (Dashboard, Transactions) ได้ปกติ
  } else {
    // ❌ ถ้ายังไม่ได้ Login...
    if (authRoutes.includes(state.url)) {
      return true; // ยอมให้เข้าหน้า Login/Register ได้
    }
    // ...แต่พยายามจะไปหน้าอื่น ให้เตะกลับไปหน้า Login
    router.navigate(['/login']);
    return false;
  }
};