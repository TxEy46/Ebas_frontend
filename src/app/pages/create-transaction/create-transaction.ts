import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router'; // 🔹 เพิ่ม Router

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, HttpClientModule],
  templateUrl: './create-transaction.html',
  styleUrls: ['./create-transaction.scss']
})
export class CreateTransactionComponent implements OnInit {
  form: FormGroup;
  type: 'income' | 'expense' = 'income';
  userData: any = null; // 🔹 เก็บข้อมูล User

  // State สำหรับ Categories
  categories: any[] = [];
  isCategoryModalOpen: boolean = false;
  isManageModalOpen: boolean = false;
  isEditMode: boolean = false;

  // Data สำหรับ Create/Edit Category
  newCategoryName: string = '';
  newCategoryColor: string = '#10b981';
  editingCategoryId: number | null = null;
  isDropdownOpen = false;
  selectedCategory: any = null;

  // API URL
  serverUrl = 'https://ebas-backend.onrender.com';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router // 🔹 Inject Router
  ) {
    this.form = this.fb.group({
      type: [this.type, Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      category_id: ['', Validators.required],
      name: ['', Validators.required],
      user_id: [''] // 🔹 เพิ่ม user_id ในฟอร์ม
    });
  }

  ngOnInit() {
    // 1. ตรวจสอบการ Login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.userData = JSON.parse(savedUser);
      this.form.patchValue({ user_id: this.userData.id }); // ใส่ userId รอไว้ในฟอร์ม
      this.loadCategories();
    } else {
      this.router.navigate(['/login']);
    }
  }

  // 📋 โหลดข้อมูล Categories (ปรับ Query ให้ Backend ส่งทั้งกลางและส่วนตัวมา)
  loadCategories() {
    if (!this.userData?.id) return;

    // ส่ง userId ไปเพื่อให้ Backend รู้ว่าต้องดึง "NULL" + "userId นี้"
    this.http.get<any[]>(`${this.serverUrl}/api/categories?userId=${this.userData.id}`).subscribe({
      next: (res) => {
        this.categories = [...res];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Fetch Error:', err)
    });
  }

  // เพิ่มฟังก์ชันสำหรับเช็คว่าเป็นหมวดหมู่กลางหรือไม่ (ใช้ใน HTML)
  isGlobalCategory(cat: any): boolean {
    return cat.user_id === null;
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  get filteredCategories() {
    return this.categories.filter(c => c.type === this.type);
  }

  // ฟังก์ชันสลับเปิด/ปิด Dropdown
  toggleDropdown(event: Event) {
    event.stopPropagation(); // ป้องกันไม่ให้ Event วิ่งไปที่ HostListener
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.detectChanges();
  }

  // ฟังก์ชันเลือกหมวดหมู่
  selectCategory(cat: any) {
    this.selectedCategory = cat;
    this.form.get('category_id')?.setValue(cat.id); // อัปเดตค่าเข้า Form หลัก
    this.isDropdownOpen = false; // ปิด Dropdown
  }

  setType(type: 'income' | 'expense') {
    this.type = type;
    this.form.get('type')?.setValue(type);
    this.form.get('category_id')?.setValue('');
    this.newCategoryColor = type === 'income' ? '#22c55e' : '#ef4444';
    this.cdr.detectChanges();
    this.selectedCategory = null; // ล้างค่าหน้าจอ
    this.isDropdownOpen = false;
  }

  // --- Modal Management ---
  openCategoryModal() {
    this.isCategoryModalOpen = true;
    this.isEditMode = false;
    this.newCategoryName = '';
    if (!this.newCategoryColor || !this.newCategoryColor.startsWith('#')) {
      this.newCategoryColor = this.type === 'income' ? '#10b981' : '#ef4444';
    }
    this.cdr.detectChanges();
  }

  closeCategoryModal() {
    this.isCategoryModalOpen = false;
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.newCategoryName = '';
    this.cdr.detectChanges();
  }

  openManageModal() {
    this.isManageModalOpen = true;
    this.cdr.detectChanges();
  }

  closeManageModal() {
    this.isManageModalOpen = false;
    this.cdr.detectChanges();
  }

  openEditCategory(cat: any) {
    this.isEditMode = true;
    this.editingCategoryId = cat.id;
    this.newCategoryName = cat.name;
    this.newCategoryColor = cat.color || '#10b981';
    this.isManageModalOpen = false;
    this.isCategoryModalOpen = true;
    this.cdr.detectChanges();
  }

  // --- API Actions (CRUD) ---
  saveNewCategory() {
    if (!this.newCategoryName.trim() || !this.userData?.id) return alert('Please enter name');

    const payload = {
      name: this.newCategoryName,
      type: this.type,
      color: this.newCategoryColor,
      user_id: this.userData.id // 🔹 ส่ง userId ไปด้วย
    };

    if (this.isEditMode && this.editingCategoryId) {
      this.http.put(`${this.serverUrl}/api/categories/${this.editingCategoryId}`, payload).subscribe({
        next: () => {
          this.loadCategories();
          this.closeCategoryModal();
        },
        error: () => alert('Update failed')
      });
    } else {
      this.http.post(`${this.serverUrl}/api/categories`, payload).subscribe({
        next: (res: any) => {
          this.loadCategories();
          if (res?.category) {
            this.form.get('category_id')?.setValue(res.category.id);
          }
          this.closeCategoryModal();
        },
        error: () => alert('Create failed')
      });
    }
  }

  deleteCategory(id: number) {
    if (confirm('ยืนยันการลบ? รายการในหมวดนี้จะถูกย้ายไปที่ "เบ็ดเตล็ด"')) {
      const options = {
        body: { user_id: this.userData.id }
      };

      this.http.delete(`${this.serverUrl}/api/categories/${id}`, options).subscribe({
        next: () => {
          alert('ลบเรียบร้อย');
          this.loadCategories(); // โหลด List ใหม่
        },
        error: (err) => alert('ลบไม่สำเร็จ: ' + err.error.error)
      });
    }
  }

  submit() {
    if (this.form.valid && this.userData?.id) {
      // มั่นใจว่ามี user_id ก่อนส่ง
      this.form.patchValue({ user_id: this.userData.id });

      this.http.post(`${this.serverUrl}/api/transactions`, this.form.value).subscribe({
        next: () => {
          alert('Transaction saved! ✅');
          this.form.reset({
            type: this.type,
            category_id: '',
            user_id: this.userData.id,
            amount: null,
            name: ''
          });
          this.cdr.detectChanges();
        },
        error: () => alert('Save failed ❌')
      });
    }
  }
}