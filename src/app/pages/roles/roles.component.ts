import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolePermissionService } from '../../service/role-permission.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="p-3">
    <h2>Rôles</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex gap-2 mb-3">
      <input formControlName="name" placeholder="Nom du rôle" class="p-inputtext p-component" />
      <input formControlName="permissions" placeholder="Permissions (slug, séparés par ,)" class="p-inputtext p-component" />
      <button class="p-button p-component" [disabled]="form.invalid">Ajouter</button>
    </form>
    <ul>
      <li *ngFor="let r of roles">{{ r?.name || r?.slug }}</li>
    </ul>
  </div>
  `,
})
export class RolesComponent implements OnInit {
  roles: any[] = [];
  form: FormGroup;

  constructor(private api: RolePermissionService, fb: FormBuilder) {
    this.form = fb.group({
      name: ['', Validators.required],
      permissions: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listRoles(50).subscribe(res => {
      this.roles = res?.data?.roles || res?.data || [];
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const permissions = (this.form.value.permissions || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s);
    this.api.createRole({ name: this.form.value.name, permissions }).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }
}

