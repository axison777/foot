import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {
	private readonly base = environment.apiUrl;

	constructor(private http: HttpClient) {}

	// Roles
	listRoles(perPage?: number): Observable<any> {
		let params = new HttpParams();
		if (perPage) params = params.set('per_page', String(perPage));
		return this.http.get<any>(`${this.base}/roles`, { params });
	}

	createRole(payload: { name: string; permissions: string[] }): Observable<any> {
		return this.http.post<any>(`${this.base}/roles`, payload);
	}

	getRole(slug: string): Observable<any> {
		return this.http.get<any>(`${this.base}/roles/${slug}`);
	}

	updateRole(slug: string, payload: { name?: string; permissions?: string[] }): Observable<any> {
		return this.http.patch<any>(`${this.base}/roles/${slug}`, payload);
	}

	deleteRole(slug: string): Observable<any> {
		return this.http.delete<any>(`${this.base}/roles/${slug}`);
	}

	// Permissions
	listPermissions(perPage?: number): Observable<any> {
		let params = new HttpParams();
		if (perPage) params = params.set('per_page', String(perPage));
		return this.http.get<any>(`${this.base}/permissions`, { params });
	}

	createPermission(payload: { name: string }): Observable<any> {
		return this.http.post<any>(`${this.base}/permissions`, payload);
	}

	getPermission(slug: string): Observable<any> {
		return this.http.get<any>(`${this.base}/permissions/${slug}`);
	}

	updatePermission(slug: string, payload: { name: string }): Observable<any> {
		return this.http.put<any>(`${this.base}/permissions/${slug}`, payload);
	}

	deletePermission(slug: string): Observable<any> {
		return this.http.delete<any>(`${this.base}/permissions/${slug}`);
	}
}