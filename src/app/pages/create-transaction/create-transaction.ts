import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './create-transaction.html',
  styleUrls: ['./create-transaction.scss']
})
export class CreateTransactionComponent {
  form: FormGroup;
  type: 'income' | 'expense' = 'income';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      type: [this.type, Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      name: ['', Validators.required],
    });
  }

  setType(type: 'income' | 'expense') {
    this.type = type;
    this.form.get('type')?.setValue(type);
  }

  submit() {
    if (this.form.valid) {
      const payload = { ...this.form.value }; // ไม่ต้องส่ง date

      this.http.post('https://ebas-backend.onrender.com/api/transactions', payload)
        .subscribe({
          next: (res) => {
            console.log('Transaction saved', res);
            alert('Transaction saved successfully ✅');
            this.form.reset({ type: this.type });
          },
          error: (err) => {
            console.error('Error saving transaction', err);
            alert('Failed to save transaction ❌');
          }
        });
    } else {
      alert('Please fill in all required fields!');
    }
  }
}