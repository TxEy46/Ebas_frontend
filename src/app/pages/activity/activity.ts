import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity.html',
  styleUrls: ['./activity.scss']
})
export class ActivityComponent implements OnInit {

  transactions: any[] = [];
  loading = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3001/api/transactions')
      .subscribe({
        next: (res) => {
          this.transactions = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}