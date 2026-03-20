import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// 👇 เปลี่ยน \ เป็น / และใช้ ./ (ถ้าอยู่โฟลเดอร์เดียวกัน)
import { ThaiDatePipe } from './thai-date-pipe'; 

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThaiDatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}