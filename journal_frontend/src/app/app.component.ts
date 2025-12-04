import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
  <header class="header">
    <h1>Personal Journal</h1>
  </header>
  <main class="container">
    <app-journal-list></app-journal-list>
  </main>
  `,
  styles: [`
    .header {
      background: linear-gradient(90deg, rgba(37,99,235,0.1), #f9fafb);
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .header h1 { margin: 0; color: #111827; }
    .container {
      max-width: 900px;
      margin: 18px auto;
      padding: 0 12px;
    }
  `]
})
export class AppComponent {}
