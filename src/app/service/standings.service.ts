import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import {
  AnyStandings,
  CategoryCode,
  CompetitionMeta,
  MatchLite,
  TeamLite,
} from '../models/standings.model';
import { computeGroupStandings, computeLeagueStandings } from '../core/utils/standings-calculator';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCompetitionMeta(competitionId: string): Observable<CompetitionMeta> {
    return this.http.get<CompetitionMeta>(`${this.api}/competitions/${competitionId}`);
  }

  getTeams(competitionId: string, category: CategoryCode): Observable<TeamLite[]> {
    return this.http.get<TeamLite[]>(`${this.api}/competitions/${competitionId}/teams`, { params: { category } as any });
  }

  getMatches(competitionId: string, category: CategoryCode): Observable<MatchLite[]> {
    return this.http.get<MatchLite[]>(`${this.api}/competitions/${competitionId}/matches`, { params: { category } as any });
  }

  getStandings(competitionId: string, category: CategoryCode): Observable<AnyStandings> {
    return forkJoin({
      comp: this.getCompetitionMeta(competitionId),
      teams: this.getTeams(competitionId, category),
      matches: this.getMatches(competitionId, category)
    }).pipe(
      map(({ comp, teams, matches }: { comp: CompetitionMeta; teams: TeamLite[]; matches: MatchLite[] }) => {
        const competition = comp;
        if (competition.format === 'LEAGUE') {
          return computeLeagueStandings(teams, matches);
        }
        return computeGroupStandings(teams, matches);
      })
    );
  }
}

