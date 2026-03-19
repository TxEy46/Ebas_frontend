import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // 👈 แนะนำให้ใส่ไว้ที่นี่ที่เดียวเลย

import { LoginComponent } from './app/pages/login/login';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { CreateTransactionComponent } from './app/pages/create-transaction/create-transaction';
import { TransactionsComponent } from './app/pages/transactions/transactions';
import { RegisterComponent } from './app/pages/register/register';
import { authGuard } from './app/guards/auth.guard'; // 👈 Import Guard ที่เราสร้าง

bootstrapApplication(App, {
  providers: [
    provideHttpClient(), // 👈 ทำให้ทุก Component ใช้ HttpClient ได้โดยไม่ต้อง import HttpClientModule ซ้ำๆ
    provideRouter([
      // 🟢 หน้าที่เข้าได้ "เฉพาะตอนไม่ Login" (ถ้า Login แล้วจะโดนดีดไป Dashboard)
      { 
        path: 'login', 
        component: LoginComponent, 
        canActivate: [authGuard] 
      },
      { 
        path: 'register', 
        component: RegisterComponent, 
        canActivate: [authGuard] 
      },

      // 🔴 หน้าที่เข้าได้ "เฉพาะตอน Login แล้ว" (ถ้ายังไม่ Login จะโดนดีดไป Login)
      { 
        path: 'dashboard', 
        component: DashboardComponent, 
        canActivate: [authGuard] 
      },
      { 
        path: 'create-transaction', 
        component: CreateTransactionComponent, 
        canActivate: [authGuard] 
      },
      { 
        path: 'transactions', 
        component: TransactionsComponent, 
        canActivate: [authGuard] 
      },

      // 🔵 เส้นทางอื่นๆ
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
      { path: '**', redirectTo: 'dashboard' } 
    ])
  ]
});