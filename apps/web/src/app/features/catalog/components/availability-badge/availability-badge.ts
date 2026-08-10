import { Component, input } from '@angular/core';
import { BookStatus } from '../../models/catalog.models';

@Component({
  selector: 'app-availability-badge',
  templateUrl: './availability-badge.html',
  styleUrl: './availability-badge.scss',
})
export class AvailabilityBadge {
  readonly status = input.required<BookStatus>();

  protected getStatusLabel(): string {
    return {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      BORROWED: 'Borrowed',
    }[this.status()];
  }
}
