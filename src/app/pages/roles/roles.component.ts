import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RolePermissionService } from '../../service/role-permission.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, CardModule],
  template: `
  <div class="p-3 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h2 class="m-0">Rôles & Permissions</h2>
      <button class="p-button p-component" (click)="openCreate()">Créer un rôle</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <p-card *ngFor="let r of roles" header="{{ r?.name || r?.slug }}" subheader="{{ r?.slug }}">
        <ng-template pTemplate="content">
          <div class="text-sm text-gray-600 mb-2">Permissions:</div>
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="px-2 py-1 bg-gray-100 rounded" *ngFor="let p of (r?.permissions || [])">{{ p?.name || p?.slug }}</span>
          </div>
        </ng-template>
        <ng-template pTemplate="footer">
          <div class="flex gap-2">
            <button class="p-button p-component p-button-text" (click)="view(r)">Voir détails</button>
            <button class="p-button p-component p-button-warning p-button-text" (click)="edit(r)">Modifier</button>
            <button class="p-button p-component p-button-danger p-button-text" (click)="remove(r)">Supprimer</button>
          </div>
        </ng-template>
      </p-card>
    </div>

    <!-- Dialog create/edit -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'560px'}" [draggable]="false" [resizable]="false">
      <ng-template pTemplate="header">{{ isEditing ? 'Modifier le rôle' : 'Créer un rôle' }}</ng-template>
      <form [formGroup]="roleForm" class="flex flex-col gap-3">
        <input formControlName="name" placeholder="Nom du rôle" class="p-inputtext p-component" />
        <div>
          <div class="text-sm mb-2">Permissions disponibles</div>
          <div class="flex flex-wrap gap-2 max-h-48 overflow-auto">
            <label class="flex items-center gap-2" *ngFor="let p of allPermissions; let i = index">
              <input type="checkbox" [checked]="selectedPermissionSlugs.has(p.slug)" (change)="togglePermission(p.slug, $any($event.target).checked)" />
              <span>{{ p.name || p.slug }}</span>
            </label>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button class="p-button p-component p-button-text" (click)="dialogVisible=false">Annuler</button>
        <button class="p-button p-component" (click)="saveRole()" [disabled]="roleForm.invalid">{{ isEditing ? 'Enregistrer' : 'Créer' }}</button>
      </ng-template>
    </p-dialog>

    <!-- Dialog details -->
    <p-dialog [(visible)]="detailVisible" [modal]="true" [style]="{width:'520px'}" [draggable]="false" [resizable]="false">
      <ng-template pTemplate="header">Détails du rôle</ng-template>
      <div class="flex flex-col gap-2">
        <div><b>Nom:</b> {{ selectedRole?.name || selectedRole?.slug }}</div>
        <div>
          <b>Permissions:</b>
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="px-2 py-1 bg-gray-100 rounded" *ngFor="let p of (selectedRole?.permissions || [])">{{ p?.name || p?.slug }}</span>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="p-button p-component" (click)="detailVisible=false">Fermer</button>
      </ng-template>
    </p-dialog>
  </div>
  `,
})
export class RolesComponent implements OnInit {
  roles: any[] = [];
  allPermissions: any[] = [];

  dialogVisible = false;
  detailVisible = false;
  isEditing = false;
  selectedRole: any = null;

  roleForm: FormGroup;
  selectedPermissionSlugs = new Set<string>();

  constructor(private api: RolePermissionService, fb: FormBuilder) {
    this.roleForm = fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadPermissions();
  }

  load(): void {
    this.api.listRoles(100).subscribe(res => {
      this.roles = res?.data?.roles || res?.data || [];
    });
  }

  loadPermissions(): void {
    this.api.listPermissions(500).subscribe(res => {
      this.allPermissions = res?.data?.permissions || res?.data || [];
    });
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedRole = null;
    this.roleForm.reset();
    this.selectedPermissionSlugs.clear();
    this.dialogVisible = true;
  }

  view(role: any): void {
    const slug = role?.slug || role?.name;
    if (!slug) return;
    this.api.getRole(slug).subscribe(res => {
      this.selectedRole = res?.data?.role || res?.data || role;
      this.detailVisible = true;
    });
  }

  edit(role: any): void {
    const slug = role?.slug || role?.name;
    if (!slug) return;
    this.isEditing = true;
    this.api.getRole(slug).subscribe(res => {
      this.selectedRole = res?.data?.role || res?.data || role;
      this.roleForm.patchValue({ name: this.selectedRole?.name || this.selectedRole?.slug || '' });
      this.selectedPermissionSlugs = new Set<string>((this.selectedRole?.permissions || []).map((p: any) => p.slug));
      this.dialogVisible = true;
    });
  }

  togglePermission(slug: string, checked?: boolean): void {
    if (checked) this.selectedPermissionSlugs.add(slug);
    else this.selectedPermissionSlugs.delete(slug);
  }

  saveRole(): void {
    const payload = { name: this.roleForm.value.name, permissions: Array.from(this.selectedPermissionSlugs) } as any;
    const obs = this.isEditing && this.selectedRole?.slug
      ? this.api.updateRole(this.selectedRole.slug, payload)
      : this.api.createRole(payload);
    obs.subscribe(() => {
      this.dialogVisible = false;
      this.load();
    });
  }

  remove(role: any): void {
    if (!role?.slug) return;
    this.api.deleteRole(role.slug).subscribe(() => this.load());
  }
}

