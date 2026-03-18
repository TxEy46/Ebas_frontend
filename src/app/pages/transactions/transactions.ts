import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: string; // 👈 แก้ตรงนี้จาก _id เป็น id ให้ตรงกับ Supabase
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
  transactions$!: Observable<Transaction[]>;
  months: string[] = [];
  selectedMonth: string = 'All';

  // 🔹 ตัวแปรสำหรับ Modal แก้ไข
  isModalOpen = false;
  editFormData: Partial<Transaction> = {};

  // ⚠️ เปลี่ยน URL ตรงนี้ให้ตรงกับ Backend ของคุณ (ถ้าทดสอบเครื่องตัวเองใช้ http://localhost:3001)
  private apiUrl = 'https://ebas-backend.onrender.com/api/transactions'; 

  constructor(private http: HttpClient) {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.transactions$ = this.http.get<Transaction[]>(this.apiUrl)
      .pipe(
        catchError(err => {
          console.error('Error fetching transactions', err);
          return of([]);
        })
      );

    this.transactions$.subscribe(data => {
      const monthSet = new Set<string>();
      data.forEach(tx => {
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

  // 🔹 เปิด Modal และคัดลอกข้อมูลเดิมลงฟอร์ม
  editTransaction(tx: Transaction) {
    this.editFormData = { ...tx }; // Copy ข้อมูลกันการผูกค่าตรงๆ (Two-way binding issue)
    this.isModalOpen = true;
  }

  // 🔹 ปิด Modal
  closeModal() {
    this.isModalOpen = false;
    this.editFormData = {};
  }

  // 🔹 บันทึกข้อมูลที่แก้ไขไปยัง Backend (PUT)
  saveEdit() {
    if (!this.editFormData.id) return;

    this.http.put(`${this.apiUrl}/${this.editFormData.id}`, this.editFormData)
      .subscribe({
        next: () => {
          alert('แก้ไขรายการสำเร็จ');
          this.closeModal();
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
      this.http.delete(`${this.apiUrl}/${id}`)
        .subscribe({
          next: () => {
            alert('ลบรายการสำเร็จ');
            this.fetchTransactions();
          },
          error: (err) => {
            console.error('Error deleting transaction', err);
            alert('เกิดข้อผิดพลาดในการลบรายการ');
          }
        });
    }
  }
}