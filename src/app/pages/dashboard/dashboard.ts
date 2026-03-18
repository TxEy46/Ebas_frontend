import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { SidebarComponent } from '../../component/sidebar/sidebar';

interface Transaction {
  id: number;
  name: string;
  createdate?: Date;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {

  transactions: Transaction[] = [];
  loading = true;

  income = 0;
  expense = 0;
  balance = 0;

  chartData: { name: string, income: number, expense: number }[] = [];
  chart: Chart | undefined;

  constructor(private http: HttpClient, private router: Router, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.http.get<Transaction[]>('https://ebas-backend.onrender.com/api/transactions')
      .subscribe({
        next: (res) => {
          console.log("API RESPONSE:", res);

          // แปลง createdate เป็น Date object และป้องกัน undefined
          this.transactions = res.map(t => ({
            ...t,
            createdate: t.createdate ? new Date(t.createdate) : undefined
          }));

          // อัพเดตสรุปและกราฟ
          this.updateSummary();
          this.updateChartData();

          this.loading = false;

          // 🔥 บังคับ Angular update UI หลังเปลี่ยนข้อมูล
          this.cd.detectChanges();

          // สร้าง Chart หลังข้อมูลพร้อม
          this.createChart();
        },
        error: (err) => {
          console.error('Error fetching transactions:', err);
          this.loading = false;
        }
      });
  }

  updateSummary() {
    this.income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.expense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.balance = this.income - this.expense; // Balance = income - expense
  }

  updateChartData() {
    const map = new Map<string, { name: string, income: number, expense: number }>();
    const today = new Date();

    // เตรียม 6 เดือนล่าสุด
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map.set(key, { name: d.toLocaleString('default', { month: 'short' }), income: 0, expense: 0 });
    }

    // รวมยอดรายรับ-รายจ่าย แยก type
    this.transactions.forEach(t => {
      if (!t.createdate) return;
      const key = `${t.createdate.getFullYear()}-${t.createdate.getMonth() + 1}`;
      if (map.has(key)) {
        const current = map.get(key)!;
        if (t.type === 'income') current.income += t.amount;
        else if (t.type === 'expense') current.expense += t.amount;
      }
    });

    this.chartData = Array.from(map.values());
  }

  createChart() {
    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    if (!ctx) return;

    // ล้าง chart เก่า
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartData.map(d => d.name),
        datasets: [
          {
            label: 'Income',
            data: this.chartData.map(d => d.income),
            backgroundColor: '#10b981'
          },
          {
            label: 'Expense',
            data: this.chartData.map(d => d.expense),
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  formatMoney(amount: number) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}