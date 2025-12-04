import { Routes } from '@angular/router';
import { JournalListComponent } from './components/journal-list/journal-list.component';
import { JournalEditorComponent } from './components/journal-editor/journal-editor.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';

export const routes: Routes = [
  { path: '', redirectTo: 'entries', pathMatch: 'full' },
  { path: 'entries', component: JournalListComponent, title: 'Journal Entries' },
  { path: 'entries/new', component: JournalEditorComponent, title: 'New Entry' },
  { path: 'entries/:id', component: JournalEditorComponent, title: 'Edit Entry' },
  { path: 'calendar', component: CalendarViewComponent, title: 'Calendar' },
  { path: '**', redirectTo: 'entries' }
];
