import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './app/pages/login/login';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { CreateTransactionComponent } from './app/pages/create-transaction/create-transaction';
import { TransactionsComponent } from './app/pages/transactions/transactions';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      { path: '', component: LoginComponent }, // Login page
      { path: 'dashboard', component: DashboardComponent },
      { path: 'create-transaction', component: CreateTransactionComponent },
      { path: 'transactions', component: TransactionsComponent }
    ])
  ]
});