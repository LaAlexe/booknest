import { Component, inject } from '@angular/core';
import { AdminNavigation } from '../../../../shared/components/admin-navigation/admin-navigation';
import { AdminAuthStore } from '../../services/admin-auth.store';

@Component({
  selector: 'app-admin-page',
  imports: [AdminNavigation],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {
  private readonly adminAuthStore = inject(AdminAuthStore);
  protected readonly admin = this.adminAuthStore.admin;
}
