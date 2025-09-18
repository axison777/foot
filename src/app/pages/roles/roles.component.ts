import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { RolePermissionService } from '../../service/role-permission.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ButtonModule, CardModule, MultiSelectModule],
  template: `
  <div class="p-3 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h2 class="m-0">Rôles & Permissions</h2>
      <button class="p-button p-component" (click)="openCreate()">Créer un rôle</button>
    </div>

    <p-card>
      <ng-template pTemplate="content">
        <div class="overflow-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-gray-600">
                <th class="py-2 px-2">Nom</th>
                <th class="py-2 px-2">Slug</th>
                <th class="py-2 px-2 w-[240px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of roles" class="border-t">
                <td class="py-2 px-2 font-semibold">{{ r?.name || r?.slug }}</td>
                <td class="py-2 px-2">{{ r?.slug }}</td>
                <td class="py-2 px-2">
                  <div class="flex gap-2">
                    <button class="p-button p-component p-button-text" (click)="view(r)">Détails</button>
                    <button class="p-button p-component p-button-warning p-button-text" (click)="edit(r)">Modifier</button>
                    <button class="p-button p-component p-button-danger p-button-text" (click)="remove(r)">Supprimer</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-template>
    </p-card>

    <!-- Dialog create/edit -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width:'560px'}" [draggable]="false" [resizable]="false">
      <ng-template pTemplate="header">{{ isEditing ? 'Modifier le rôle' : 'Créer un rôle' }}</ng-template>
      <form [formGroup]="roleForm" class="flex flex-col gap-3">
        <input formControlName="name" placeholder="Nom du rôle" class="p-inputtext p-component" />
        <div>
          <div class="text-sm mb-2">Permissions</div>
          <p-multiSelect
            [options]="allPermissions"
            optionLabel="name"
            optionValue="slug"
            display="chip"
            placeholder="Sélectionner des permissions"
            [selectionLimit]="200"
            [(ngModel)]="selectedPermissionList"
            class="w-full"
          ></p-multiSelect>
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
  selectedPermissionList: string[] = [];

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
    this.selectedPermissionList = [];
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
      this.selectedPermissionList = (this.selectedRole?.permissions || []).map((p: any) => p.slug);
      this.dialogVisible = true;
    });
  }

  saveRole(): void {
    const payload = { name: this.roleForm.value.name, permissions: this.selectedPermissionList } as any;
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

