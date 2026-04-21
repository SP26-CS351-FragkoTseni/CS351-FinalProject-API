import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-task-detail-page',
  standalone: true,
  templateUrl: './task-detail-page.component.html',
  styleUrl: './task-detail-page.component.scss',
})
export class TaskDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  /** Route param <code>id</code> for when you wire the editor + reminders UI. */
  readonly taskId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), { initialValue: null });
}
