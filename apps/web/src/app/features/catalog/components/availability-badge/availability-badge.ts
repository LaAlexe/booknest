import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BookStatus } from '../../models/catalog.models';

@Component({
  selector: 'app-availability-badge',
  imports: [TranslatePipe],
  templateUrl: './availability-badge.html',
  styleUrl: './availability-badge.scss',
})
export class AvailabilityBadge {
  readonly status = input.required<BookStatus>();
}
