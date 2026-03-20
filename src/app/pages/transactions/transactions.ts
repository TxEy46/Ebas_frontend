import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 🔹 เพิ่ม Router สำหรับเช็ค Login
import { ThaiDatePipe } from '../../thai-date-pipe';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface Transaction {
  id: string;
  name: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  createdate: string;
  user_id?: string; // 🔹 เพิ่มรองรับ user_id
  categories?: {
    name: string;
    color: string;
  };
  showMenu?: boolean;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, FormsModule, ThaiDatePipe],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss']
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading: boolean = true;
  userData: any = null; // 🔹 เก็บข้อมูล User ที่ Login

  categoriesList: Category[] = [];
  filteredCategories: Category[] = [];

  months: string[] = [];
  selectedMonth: string = 'All';

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalFilteredItems: number = 0;

  isModalOpen = false;
  editFormData: Partial<Transaction> = {};

  readonly serverUrl = 'https://ebas-backend.onrender.com/api/transactions';
  readonly categoryUrl = 'https://ebas-backend.onrender.com/api/categories';

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private router: Router // 🔹 Inject Router
  ) { }

  ngOnInit() {
    // 1. ตรวจสอบการ Login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userData = JSON.parse(savedUser);
      this.loadAllData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // 📋 ดึงข้อมูลทั้งหมดตามลำดับ
  loadAllData() {
    if (!this.userData?.id) return;
    this.isLoading = true;

    // 2. ดึง Categories (ส่ง userId ไปด้วยเพื่อให้ได้หมวดหมู่ของตัวเอง)
    this.http.get<Category[]>(`${this.categoryUrl}?userId=${this.userData.id}`).subscribe({
      next: (catData) => {
        this.categoriesList = catData.sort((a, b) => {
          if (a.name.trim() === 'อื่นๆ') return 1;
          if (b.name.trim() === 'อื่นๆ') return -1;
          return a.name.localeCompare(b.name, 'th');
        });

        // 3. ดึง Transactions ต่อ
        this.fetchTransactions();
      },
      error: (err) => {
        console.error('Categories error:', err);
        this.isLoading = false;
      }
    });
  }

  fetchTransactions() {
    if (!this.userData?.id) return;

    // 🔹 ส่ง userId ผ่าน Query String
    this.http.get<Transaction[]>(`${this.serverUrl}?userId=${this.userData.id}`).subscribe({
      next: (data) => {
        this.transactions = data.map(tx => ({
          ...tx,
          categories: tx.categories || { name: 'อื่นๆ', color: '#cbd5e1' }
        }));

        const monthSet = new Set<string>();
        this.transactions.forEach(tx => {
          const date = new Date(tx.createdate);
          if (!isNaN(date.getTime())) {
            const month = date.toLocaleString('th-TH', { month: 'long', year: 'numeric' });
            monthSet.add(month);
          }
        });

        this.months = ['All', ...Array.from(monthSet)];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Fetch transactions error:', err);
        this.isLoading = false;
      }
    });
  }

  onTypeChange() {
    if (!this.editFormData.type) return;
    this.filteredCategories = this.categoriesList.filter(c => c.type === this.editFormData.type);
    const isValid = this.filteredCategories.some(c => c.id === this.editFormData.category_id);
    if (!isValid && this.filteredCategories.length > 0) {
      this.editFormData.category_id = this.filteredCategories[0].id;
    }
  }

  editTransaction(tx: Transaction) {
    this.editFormData = { ...tx };
    this.onTypeChange();
    this.isModalOpen = true;
  }

  saveEdit() {
    if (!this.editFormData.id || !this.userData?.id) return;

    // 🔹 แนบ user_id ไปใน Payload สำหรับการ Update (เพื่อความปลอดภัยที่ Backend)
    const payload = {
      name: this.editFormData.name,
      amount: this.editFormData.amount,
      type: this.editFormData.type,
      category_id: this.editFormData.category_id,
      user_id: this.userData.id 
    };

    this.http.put(`${this.serverUrl}/${this.editFormData.id}`, payload).subscribe({
      next: () => {
        alert('แก้ไขรายการสำเร็จ');
        this.closeModal();
        this.fetchTransactions();
      },
      error: (err) => alert('Error updating data')
    });
  }

  deleteTransaction(id: string) {
    if (!this.userData?.id) return;
    
    if (confirm('ยืนยันการลบ?')) {
      // 🔹 ส่ง user_id ไปใน Body ของ DELETE request (ตามที่ Backend เราเขียนไว้)
      const options = {
        body: { user_id: this.userData.id }
      };

      this.http.delete(`${this.serverUrl}/${id}`, options).subscribe({
        next: () => { 
          alert('ลบสำเร็จ'); 
          this.fetchTransactions(); 
        },
        error: (err) => alert('ไม่สามารถลบรายการได้')
      });
    }
  }

  closeModal() { this.isModalOpen = false; this.editFormData = {}; }
  onMonthChange() { this.currentPage = 1; }

  getPaginatedTransactions(): Transaction[] {
    const filtered = this.transactions.filter(tx => {
      if (this.selectedMonth === 'All') return true;
      const month = new Date(tx.createdate).toLocaleString('th-TH', { month: 'long', year: 'numeric' });
      return month === this.selectedMonth;
    });
    this.totalFilteredItems = filtered.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.totalFilteredItems / this.itemsPerPage) || 1; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
}