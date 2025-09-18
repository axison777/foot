import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { forkJoin, map, Observable } from 'rxjs';
import {
  AssistEntry,
  CategoryCode,
  CleanSheetEntry,
  MatchEvent,
  MatchLite,
  PlayerLite,
  ScorerEntry,
  TeamLite
} from '../models/standings.model';

@Injectable({ providedIn: 'root' })
export class PlayerStatsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTeams(competitionId: string, category: CategoryCode) {
    return this.http.get<TeamLite[]>(`${this.api}/competitions/${competitionId}/teams`, { params: { category } as any });
  }

  getPlayers(competitionId: string, category: CategoryCode) {
    return this.http.get<PlayerLite[]>(`${this.api}/competitions/${competitionId}/players`, { params: { category } as any });
  }

  getMatches(competitionId: string, category: CategoryCode) {
    return this.http.get<MatchLite[]>(`${this.api}/competitions/${competitionId}/matches`, { params: { category } as any });
  }

  getTopScorers(competitionId: string, category: CategoryCode): Observable<ScorerEntry[]> {
    return forkJoin({
      teams: this.getTeams(competitionId, category),
      players: this.getPlayers(competitionId, category),
      matches: this.getMatches(competitionId, category),
    }).pipe(
      map(({ teams, players, matches }) => {
        const idToTeam = new Map(teams.map(t => [t.id, t]));
        const idToPlayer = new Map(players.map(p => [p.id, p]));
        const totals = new Map<string, { goals: number; pens: number }>();

        for (const m of matches) {
          for (const e of (m.events || []) as MatchEvent[]) {
            if (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') {
              const pid = e.playerId;
              if (!pid) continue;
              const entry = totals.get(pid) || { goals: 0, pens: 0 };
              entry.goals += 1;
              if (e.type === 'PENALTY_GOAL') entry.pens += 1;
              totals.set(pid, entry);
            }
          }
        }

        const rows: ScorerEntry[] = [];
        for (const [playerId, { goals, pens }] of totals.entries()) {
          const player = idToPlayer.get(playerId);
          if (!player) continue;
          const team = idToTeam.get(player.team_id);
          rows.push({
            playerId,
            playerName: player.fullName || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            teamId: player.team_id,
            teamName: team?.name || '',
            goals,
            penalties: pens || 0,
          });
        }

        rows.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
        return rows;
      })
    );
  }

  getTopAssists(competitionId: string, category: CategoryCode): Observable<AssistEntry[]> {
    return forkJoin({
      teams: this.getTeams(competitionId, category),
      players: this.getPlayers(competitionId, category),
      matches: this.getMatches(competitionId, category),
    }).pipe(
      map(({ teams, players, matches }) => {
        const idToTeam = new Map(teams.map(t => [t.id, t]));
        const idToPlayer = new Map(players.map(p => [p.id, p]));
        const totals = new Map<string, number>();

        for (const m of matches) {
          for (const e of (m.events || []) as MatchEvent[]) {
            if (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') {
              const assistId = e.assistedByPlayerId;
              if (!assistId) continue;
              totals.set(assistId, (totals.get(assistId) || 0) + 1);
            }
          }
        }

        const rows: AssistEntry[] = [];
        for (const [playerId, assists] of totals.entries()) {
          const player = idToPlayer.get(playerId);
          if (!player) continue;
          const team = idToTeam.get(player.team_id);
          rows.push({
            playerId,
            playerName: player.fullName || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            teamId: player.team_id,
            teamName: team?.name || '',
            assists,
          });
        }

        rows.sort((a, b) => b.assists - a.assists || a.playerName.localeCompare(b.playerName));
        return rows;
      })
    );
  }

  getCleanSheets(competitionId: string, category: CategoryCode): Observable<CleanSheetEntry[]> {
    return forkJoin({
      teams: this.getTeams(competitionId, category),
      players: this.getPlayers(competitionId, category),
      matches: this.getMatches(competitionId, category),
    }).pipe(
      map(({ teams, players, matches }) => {
        const idToTeam = new Map(teams.map(t => [t.id, t]));
        const idToPlayer = new Map(players.map(p => [p.id, p]));
        const totals = new Map<string, number>();

        for (const m of matches) {
          if (m.status !== 'FINISHED') continue;

          const homeCS = m.awayGoals === 0;
          const awayCS = m.homeGoals === 0;

          if (homeCS && m.lineups?.home?.players) {
            const gk = m.lineups.home.players.find(p => p.role === 'GK' && p.starter);
            if (gk?.playerId) totals.set(gk.playerId, (totals.get(gk.playerId) || 0) + 1);
          }
          if (awayCS && m.lineups?.away?.players) {
            const gk = m.lineups.away.players.find(p => p.role === 'GK' && p.starter);
            if (gk?.playerId) totals.set(gk.playerId, (totals.get(gk.playerId) || 0) + 1);
          }
        }

        const rows: CleanSheetEntry[] = [];
        for (const [playerId, cleanSheets] of totals.entries()) {
          const player = idToPlayer.get(playerId);
          if (!player) continue;
          const team = idToTeam.get(player.team_id);
          rows.push({
            playerId,
            playerName: player.fullName || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            teamId: player.team_id,
            teamName: team?.name || '',
            cleanSheets,
          });
        }

        rows.sort((a, b) => b.cleanSheets - a.cleanSheets || a.playerName.localeCompare(b.playerName));
        return rows;
      })
    );
  }
}

