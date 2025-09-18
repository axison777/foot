import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolePermissionService } from '../../service/role-permission.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: ``,
})
export class PermissionsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    // empty - merged into Roles panel UX
  }

  // Deprecated in favor of unified Roles page
}

