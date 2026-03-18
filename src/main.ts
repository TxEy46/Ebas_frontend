import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import { provideRouter } from '@angular/router';
import { LoginComponent } from './app/pages/login/login';
import { ActivityComponent } from './app/pages/activity/activity';
import { DashboardComponent } from './app/pages/dashboard/dashboard';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      { path: '', component: LoginComponent },
      { path: 'dashboard', component: DashboardComponent }
    ])
  ]
});