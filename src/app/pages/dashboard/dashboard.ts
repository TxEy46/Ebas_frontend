import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🔹 นำเข้า FormsModule สำหรับใช้งาน Input
import { Chart } from 'chart.js/auto';
import { SidebarComponent } from '../../component/sidebar/sidebar';

interface Transaction {
  id: string | number;
  name: string;
  createdate?: Date | string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, FormsModule], // 🔹 เพิ่ม FormsModule ที่นี่
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  recentTransactions: Transaction[] = [];
  loading = true;

  currentMonthIncome = 0;
  currentMonthExpense = 0;
  currentMonthBalance = 0;

  // ตัวแปรงบประมาณ (Budget)
  budgetAmount = 10000;
  budgetUsedPercent = 0;
  budgetStatusColor = '#10b981';

  // 🔹 ตัวแปรสำหรับคุม Modal ตั้งงบประมาณ
  isBudgetModalOpen = false;
  newBudgetAmount = 0;

  barChartData: { name: string, income: number, expense: number }[] = [];
  barChart: Chart | undefined;
  doughnutChart: Chart | undefined;

  serverUrl = 'https://ebas-backend.onrender.com'; // เปลี่ยนเป็น URL ของ Backend จริง

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.fetchTransactions();
    this.fetchBudget();
  }

  ngOnDestroy() {
    if (this.barChart) this.barChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
  }

  // 🔹 ฟังก์ชันใหม่: ดึงข้อมูลงบประมาณจาก API
  fetchBudget() {
    const today = new Date();
    // สร้างรูปแบบ YYYY-MM เช่น '2026-03'
    const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    this.http.get<any>(`${this.serverUrl}/api/budgets/${monthYear}`)
      .subscribe({
        next: (res) => {
          this.budgetAmount = res.amount; // เอาค่าที่ได้จาก Backend มาใส่
          this.calculateBudgetProgress(); // คำนวณเปอร์เซ็นต์หลอดสีใหม่
          this.cd.detectChanges();
        },
        error: (err) => console.error('Error fetching budget:', err)
      });
  }

  fetchTransactions() {
    this.http.get<Transaction[]>(`${this.serverUrl}/api/transactions`)
      .subscribe({
        next: (res) => {
          this.transactions = res.map(t => ({
            ...t,
            createdate: t.createdate ? new Date(t.createdate) : undefined
          })).sort((a, b) => {
            const dateA = a.createdate ? new Date(a.createdate).getTime() : 0;
            const dateB = b.createdate ? new Date(b.createdate).getTime() : 0;
            return dateB - dateA;
          });

          this.recentTransactions = this.transactions.slice(0, 5);

          this.calculateCurrentMonthSummary();
          this.calculateBudgetProgress();
          this.prepareBarChartData();

          this.loading = false;
          this.cd.detectChanges();

          this.createBarChart();
          this.createDoughnutChart();
        },
        error: (err) => {
          console.error('Error fetching transactions:', err);
          this.loading = false;
        }
      });
  }

  calculateCurrentMonthSummary() {
    const today = new Date();
    const currentMonthTx = this.transactions.filter(t => {
      if (!t.createdate) return false;
      const d = new Date(t.createdate);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    this.currentMonthIncome = currentMonthTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.currentMonthExpense = currentMonthTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.currentMonthBalance = this.currentMonthIncome - this.currentMonthExpense;
  }

  calculateBudgetProgress() {
    if (this.budgetAmount === 0) {
      this.budgetUsedPercent = 0;
      return;
    }
    this.budgetUsedPercent = (this.currentMonthExpense / this.budgetAmount) * 100;

    if (this.budgetUsedPercent >= 100) {
      this.budgetStatusColor = '#ef4444'; // แดง
    } else if (this.budgetUsedPercent >= 75) {
      this.budgetStatusColor = '#f59e0b'; // ส้ม
    } else {
      this.budgetStatusColor = '#10b981'; // เขียว
    }
  }

  // 🔹 ฟังก์ชันสำหรับเปิด-ปิด และบันทึก Modal
  openBudgetModal() {
    this.newBudgetAmount = this.budgetAmount; // ดึงค่าเดิมมาแสดงในช่องกรอก
    this.isBudgetModalOpen = true;
  }

  closeBudgetModal() {
    this.isBudgetModalOpen = false;
  }

  // 🔹 อัปเดตฟังก์ชันนี้ เพื่อส่งข้อมูลไปเซฟที่ Backend
  saveBudget() {
    if (this.newBudgetAmount >= 0) {
      const today = new Date();
      const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const payload = {
        month_year: monthYear,
        amount: this.newBudgetAmount
      };

      // ยิง API ไปบันทึกข้อมูล
      this.http.post(`${this.serverUrl}/api/budgets`, payload)
        .subscribe({
          next: (res: any) => {
            console.log('Budget saved:', res);
            this.budgetAmount = this.newBudgetAmount; 
            this.calculateBudgetProgress(); 
            this.closeBudgetModal(); // สั่งปิด Popup
            
            // 🌟 เพิ่มบรรทัดนี้ครับ! เป็นการปลุก Angular ให้รีเฟรชหน้าจอทันที
            this.cd.detectChanges(); 
          },
          error: (err) => {
            console.error('Error saving budget:', err);
            alert('Failed to save budget. Please try again.');
          }
        });
    }
  }

  // (ฟังก์ชันกราฟเดิม ย่อไว้เพื่อความกระชับ)
  prepareBarChartData() { /* โค้ดเดิม */
    const map = new Map<string, { name: string, income: number, expense: number }>();
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map.set(key, { name: d.toLocaleString('default', { month: 'short' }), income: 0, expense: 0 });
    }
    this.transactions.forEach(t => {
      if (!t.createdate) return;
      const d = new Date(t.createdate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (map.has(key)) {
        const current = map.get(key)!;
        if (t.type === 'income') current.income += t.amount;
        else if (t.type === 'expense') current.expense += t.amount;
      }
    });
    this.barChartData = Array.from(map.values());
  }

  createBarChart() { /* โค้ดเดิม */
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.barChart) this.barChart.destroy();
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.barChartData.map(d => d.name),
        datasets: [
          { label: 'Income', data: this.barChartData.map(d => d.income), backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Expense', data: this.barChartData.map(d => d.expense), backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
    });
  }

  createDoughnutChart() { /* โค้ดเดิม */
    const ctx = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.doughnutChart) this.doughnutChart.destroy();
    const today = new Date();
    const expensesThisMonth = this.transactions.filter(t => t.type === 'expense' && t.createdate && new Date(t.createdate).getMonth() === today.getMonth() && new Date(t.createdate).getFullYear() === today.getFullYear());
    const categoryTotals: { [key: string]: number } = {};
    expensesThisMonth.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];
    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No Expenses'],
        datasets: [{ data: data.length > 0 ? data : [1], backgroundColor: data.length > 0 ? colors : ['#e2e8f0'], borderWidth: 0, hoverOffset: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } } } }
    });
  }

  formatMoney(amount: number) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}