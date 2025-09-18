import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolePermissionService } from '../../service/role-permission.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="p-3">
    <h2>Permissions</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex gap-2 mb-3">
      <input formControlName="name" placeholder="Nom de la permission" class="p-inputtext p-component" />
      <button class="p-button p-component" [disabled]="form.invalid">Ajouter</button>
    </form>
    <ul>
      <li *ngFor="let p of permissions">{{ p?.name || p?.slug }}</li>
    </ul>
  </div>
  `,
})
export class PermissionsComponent implements OnInit {
  permissions: any[] = [];
  form: FormGroup;

  constructor(private api: RolePermissionService, fb: FormBuilder) {
    this.form = fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listPermissions(100).subscribe(res => {
      this.permissions = res?.data?.permissions || res?.data || [];
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.api.createPermission({ name: this.form.value.name }).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }
}

