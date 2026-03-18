import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { FormsModule } from '@angular/forms';

interface Transaction {
  _id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  createdate: string; // 🔹 ใช้ createdate ตาม DB
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, FormsModule],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss']
})
export class TransactionsComponent {
  transactions$!: Observable<Transaction[]>;
  months: string[] = [];
  selectedMonth: string = 'All';

  constructor(private http: HttpClient) {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.transactions$ = this.http.get<Transaction[]>('https://ebas-backend.onrender.com/api/transactions')
      .pipe(
        catchError(err => {
          console.error('Error fetching transactions', err);
          return of([]);
        })
      );

    // เตรียมเดือนอัตโนมัติ จาก data
    this.transactions$.subscribe(data => {
      const monthSet = new Set<string>();
      data.forEach(tx => {
        // 🔹 แปลง createdate เป็น Date object ก่อนใช้
        const month = new Date(tx.createdate).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthSet.add(month);
      });
      this.months = ['All', ...Array.from(monthSet)];
    });
  }

  filterByMonth(tx: Transaction) {
    if (this.selectedMonth === 'All') return true;
    const month = new Date(tx.createdate).toLocaleString('default', { month: 'long', year: 'numeric' });
    return month === this.selectedMonth;
  }
}