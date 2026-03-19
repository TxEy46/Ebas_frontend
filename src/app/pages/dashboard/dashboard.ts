import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { RouterModule, Router } from '@angular/router';

interface Transaction {
  id: string | number;
  name: string;
  createdate?: Date;
  category_id?: string;
  amount: number;
  type: 'income' | 'expense';
  categories?: {
    name: string;
    color: string;
  };
  showMenu?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- Data Properties ---
  transactions: Transaction[] = [];
  recentTransactions: Transaction[] = [];
  loading = true;
  userData: any = null; // เก็บข้อมูลผู้ใช้ที่ Login

  // --- Summary Properties ---
  currentMonthIncome = 0;
  currentMonthExpense = 0;
  currentMonthBalance = 0;

  // --- Budget Properties ---
  budgetAmount = 0;
  budgetUsedPercent = 0;
  budgetStatusColor = '#10b981';
  isBudgetModalOpen = false;
  newBudgetAmount = 0;

  // --- Charts ---
  barChart: Chart | undefined;
  doughnutChart: Chart | undefined;
  barChartData: { name: string, income: number, expense: number }[] = [];

  readonly serverUrl = 'https://ebas-backend.onrender.com';

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    // 1. ตรวจสอบการ Login จาก localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userData = JSON.parse(savedUser);
      this.fetchData();
    } else {
      // ถ้าไม่มี User ให้เด้งกลับหน้า Login
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
  }

  private fetchData() {
    this.loading = true;
    this.fetchBudget();
    this.fetchTransactions();
  }

  // 📋 ดึงข้อมูลงบประมาณ (ระบุรายเดือน และ userId)
  fetchBudget() {
    if (!this.userData?.id) return;

    const today = new Date();
    const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // ส่ง userId ผ่าน Query String
    this.http.get<any>(`${this.serverUrl}/api/budgets/${monthYear}?userId=${this.userData.id}`).subscribe({
      next: (res) => {
        this.budgetAmount = res?.amount || 0;
        this.calculateBudgetProgress();
        this.cd.detectChanges();
      },
      error: (err) => console.error('Budget error:', err)
    });
  }

  // 📋 ดึงรายการธุรกรรม (ระบุ userId)
  fetchTransactions() {
    if (!this.userData?.id) return;

    // ส่ง userId ผ่าน Query String
    this.http.get<any[]>(`${this.serverUrl}/api/transactions?userId=${this.userData.id}`).subscribe({
      next: (res) => {
        this.transactions = res.map(t => ({
          ...t,
          createdate: t.createdate ? new Date(t.createdate) : undefined,
          categories: {
            name: t.categories?.name || 'อื่นๆ',
            color: t.categories?.color || '#cbd5e1'
          }
        })).sort((a, b) => (b.createdate?.getTime() || 0) - (a.createdate?.getTime() || 0));

        this.recentTransactions = this.transactions.slice(0, 5);
        this.updateDashboard();
      },
      error: (err) => {
        console.error('Transaction error:', err);
        this.loading = false;
      }
    });
  }

  private updateDashboard() {
    this.calculateCurrentMonthSummary();
    this.calculateBudgetProgress();
    this.prepareBarChartData();

    this.loading = false;
    this.cd.detectChanges();

    // Render กราฟหลังจากข้อมูลพร้อม
    setTimeout(() => {
      this.createBarChart();
      this.createDoughnutChart();
    }, 100);
  }

  // --- Logic Calculations ---

  calculateCurrentMonthSummary() {
    const today = new Date();
    const currentTx = this.transactions.filter(t =>
      t.createdate &&
      t.createdate.getMonth() === today.getMonth() &&
      t.createdate.getFullYear() === today.getFullYear()
    );

    this.currentMonthIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    this.currentMonthExpense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    this.currentMonthBalance = this.currentMonthIncome - this.currentMonthExpense;
  }

  calculateBudgetProgress() {
    if (this.budgetAmount <= 0) {
      this.budgetUsedPercent = 0;
      this.budgetStatusColor = '#10b981';
      return;
    }
    this.budgetUsedPercent = (this.currentMonthExpense / this.budgetAmount) * 100;

    if (this.budgetUsedPercent >= 100) this.budgetStatusColor = '#ef4444';
    else if (this.budgetUsedPercent >= 75) this.budgetStatusColor = '#f59e0b';
    else this.budgetStatusColor = '#10b981';
  }

  // --- Modal Actions ---

  openBudgetModal() {
    this.newBudgetAmount = this.budgetAmount;
    this.isBudgetModalOpen = true;
  }

  closeBudgetModal() {
    this.isBudgetModalOpen = false;
  }

  saveBudget() {
    if (this.newBudgetAmount < 0 || !this.userData?.id) return;

    const today = new Date();
    const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // ส่งข้อมูลไปบันทึกพร้อม user_id
    const payload = {
      month_year: monthYear,
      amount: this.newBudgetAmount,
      user_id: this.userData.id
    };

    this.http.post(`${this.serverUrl}/api/budgets`, payload).subscribe({
      next: () => {
        this.budgetAmount = this.newBudgetAmount;
        this.calculateBudgetProgress();
        this.closeBudgetModal();
        this.cd.detectChanges();
      },
      error: (err) => alert('ไม่สามารถบันทึกงบประมาณได้')
    });
  }

  // --- Chart Preparation ---

  prepareBarChartData() {
    const map = new Map<string, { name: string, income: number, expense: number }>();
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map.set(key, { name: d.toLocaleString('th-TH', { month: 'short' }), income: 0, expense: 0 });
    }

    this.transactions.forEach(t => {
      if (!t.createdate) return;
      const key = `${t.createdate.getFullYear()}-${t.createdate.getMonth() + 1}`;
      if (map.has(key)) {
        const item = map.get(key)!;
        t.type === 'income' ? item.income += t.amount : item.expense += t.amount;
      }
    });
    this.barChartData = Array.from(map.values());
  }

  createBarChart() {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.barChart?.destroy();
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.barChartData.map(d => d.name),
        datasets: [
          { label: 'รายรับ', data: this.barChartData.map(d => d.income), backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'รายจ่าย', data: this.barChartData.map(d => d.expense), backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createDoughnutChart() {
    const ctx = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.doughnutChart?.destroy();

    const today = new Date();
    const monthlyExpenses = this.transactions.filter(t =>
      t.type === 'expense' &&
      t.createdate &&
      t.createdate.getMonth() === today.getMonth() &&
      t.createdate.getFullYear() === today.getFullYear()
    );

    const categoryMap = new Map<string, { total: number, color: string }>();

    monthlyExpenses.forEach(t => {
      const name = t.categories?.name || 'อื่นๆ';
      const color = t.categories?.color || '#cbd5e1';
      categoryMap.set(name, {
        total: (categoryMap.get(name)?.total || 0) + t.amount,
        color: color
      });
    });

    const sortedData = Array.from(categoryMap.entries()).sort((a, b) => {
      if (a[0] === 'อื่นๆ') return 1;
      if (b[0] === 'อื่นๆ') return -1;
      return a[0].localeCompare(b[0], 'th');
    });

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sortedData.length ? sortedData.map(d => d[0]) : ['ไม่มีข้อมูล'],
        datasets: [{
          data: sortedData.length ? sortedData.map(d => d[1].total) : [1],
          backgroundColor: sortedData.length ? sortedData.map(d => d[1].color) : ['#f1f5f9'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  formatMoney(amount: number) {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  editTransaction(transaction: any) {
    console.log('Editing transaction:', transaction);
    // TODO: ใส่ Logic ของคุณตรงนี้ เช่น เปิด Modal แก้ไข หรือ Router ไปหน้า Edit
  }

  deleteTransaction(id: string | number) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      console.log('Deleting transaction ID:', id);
      // TODO: ใส่ Logic เรียก API ลบข้อมูลที่นี่

      // ตัวอย่างการอัปเดต UI ชั่วคราวหลังลบสำเร็จ:
      // this.recentTransactions = this.recentTransactions.filter(t => t.id !== id);
    }
  }
}