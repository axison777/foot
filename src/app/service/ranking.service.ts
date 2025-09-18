import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Ranking } from '../models/ranking.model';

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getRankingsByLeagueId(leagueId: string): Observable<Ranking[]> {
    return this.http.get<Ranking[]>(`${this.apiUrl}/leagues/${leagueId}/rankings`);
  }

  getRankingsByGroupId(groupId: string): Observable<Ranking[]> {
    return this.http.get<Ranking[]>(`${this.apiUrl}/groups/${groupId}/rankings`);
    }
}
