import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  createdate: string; 
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SidebarComponent, FormsModule],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss']
})
export class TransactionsComponent {
  // 🔹 เปลี่ยนจาก Observable เป็น Array เก็บข้อมูลโดยตรง และเพิ่มสถานะโหลด
  transactions: Transaction[] = [];
  isLoading: boolean = true; 
  
  months: string[] = [];
  selectedMonth: string = 'All';

  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalFilteredItems: number = 0;

  isModalOpen = false;
  editFormData: Partial<Transaction> = {};

  private apiUrl = 'https://ebas-backend.onrender.com/api/transactions'; 

  // 🔹 เพิ่ม ChangeDetectorRef เข้ามาใน constructor
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.isLoading = true;
    this.http.get<Transaction[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.transactions = data;
        const monthSet = new Set<string>();
        data.forEach(tx => {
          const month = new Date(tx.createdate).toLocaleString('default', { month: 'long', year: 'numeric' });
          monthSet.add(month);
        });
        this.months = ['All', ...Array.from(monthSet)];
        this.isLoading = false;
        
        // 🔹 สั่งให้ Angular รีเฟรชหน้าจอทันที
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error fetching transactions', err);
        this.transactions = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onMonthChange() {
    this.currentPage = 1;
  }

  // 🔹 เอาพารามิเตอร์ออก แล้วดึงข้อมูลจาก this.transactions โดยตรง
  getPaginatedTransactions(): Transaction[] {
    const filtered = this.transactions.filter(tx => {
      if (this.selectedMonth === 'All') return true;
      const month = new Date(tx.createdate).toLocaleString('default', { month: 'long', year: 'numeric' });
      return month === this.selectedMonth;
    });

    this.totalFilteredItems = filtered.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalFilteredItems / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  editTransaction(tx: Transaction) {
    this.editFormData = { ...tx }; 
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editFormData = {};
  }

  saveEdit() {
    if (!this.editFormData.id) return;

    this.http.put(`${this.apiUrl}/${this.editFormData.id}`, this.editFormData).subscribe({
      next: () => {
        alert('แก้ไขรายการสำเร็จ');
        this.closeModal(); // ปิด Modal
        this.fetchTransactions(); // โหลดข้อมูลใหม่
      },
      error: (err) => {
        console.error('Error updating transaction', err);
        alert('เกิดข้อผิดพลาดในการแก้ไขรายการ');
      }
    });
  }

  deleteTransaction(id: string) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          alert('ลบรายการสำเร็จ');
          
          if (this.totalFilteredItems - 1 <= (this.currentPage - 1) * this.itemsPerPage && this.currentPage > 1) {
            this.currentPage--;
          }
          
          this.fetchTransactions(); // โหลดข้อมูลใหม่
        },
        error: (err) => {
          console.error('Error deleting transaction', err);
          alert('เกิดข้อผิดพลาดในการลบรายการ');
        }
      });
    }
  }
}