import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription, switchMap, combineLatest } from 'rxjs';
import { StandingsService } from '../../service/standings.service';
import { AnyStandings, CategoryCode, CompetitionMeta, MatchLite, TeamLite } from '../../models/standings.model';
import { computeGroupStandings, computeLeagueStandings } from '../../core/utils/standings-calculator';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.scss']
})
export class StandingsComponent implements OnInit, OnDestroy {
  competitionId!: string;
  competition?: CompetitionMeta;
  category: CategoryCode = 'M_SENIOR';

  standings?: AnyStandings;
  loading = true;
  private sub?: Subscription;

  categories: CategoryCode[] = ['F_U16','F_U20','M_U16','M_U18','M_U20','M_SENIOR'];

  private readonly defaultSlots = { championsLeague: 0, europaLeague: 0, conferenceLeague: 0, relegation: 0 } as const;
  get slots(): { championsLeague: number; europaLeague: number; conferenceLeague: number; relegation: number } {
    const s = this.competition?.qualificationSlots || {} as any;
    return {
      championsLeague: s.championsLeague ?? 0,
      europaLeague: s.europaLeague ?? 0,
      conferenceLeague: s.conferenceLeague ?? 0,
      relegation: s.relegation ?? 0,
    };
  }

  constructor(
    private route: ActivatedRoute,
    private standingsSvc: StandingsService
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([this.route.paramMap, this.route.queryParamMap])
      .subscribe(([pm, qm]: [ParamMap, ParamMap]) => {
        this.competitionId = pm.get('id') || '';
        const mock = qm.get('mock') === '1';
        const mockFormat = (qm.get('format') || 'league').toUpperCase();
        const qpCategory = (qm.get('category') as CategoryCode) || undefined;

        if (mock) {
          const comp: CompetitionMeta = {
            id: this.competitionId || 'mock-1',
            name: mockFormat === 'GROUPS' ? 'Mock Coupe (Poules)' : 'Mock Ligue',
            format: mockFormat === 'GROUPS' ? 'CUP_GROUPS' : 'LEAGUE',
            season: '2024/25',
            qualificationSlots: { championsLeague: 2, europaLeague: 1, conferenceLeague: 1, relegation: 2 }
          };
          this.competition = comp;
          this.category = (qpCategory || 'M_SENIOR');
          this.loadMockStandings(comp.format);
        } else {
          this.loading = true;
          this.standingsSvc.getCompetitionMeta(this.competitionId).subscribe((comp: CompetitionMeta) => {
            this.competition = comp;
            this.category = (qpCategory || comp.category || 'M_SENIOR') as CategoryCode;
            this.loadStandings();
          });
        }
      });
  }

  loadStandings(): void {
    if (!this.competitionId) return;
    this.loading = true;
    this.standingsSvc.getStandings(this.competitionId, this.category).subscribe((st: AnyStandings) => {
      this.standings = st;
      this.loading = false;
    });
  }

  onCategoryChange(cat: string): void {
    this.category = cat as CategoryCode;
    this.loadStandings();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackByTeam = (_: number, row: any) => row.teamId;
  groupKeys = (obj?: Record<string, any[]>) => obj ? Object.keys(obj) : [];

  private loadMockStandings(format: 'LEAGUE' | 'CUP_GROUPS') {
    this.loading = true;
    if (format === 'LEAGUE') {
      const teams: TeamLite[] = [
        { id: 't1', name: 'Lions FC' },
        { id: 't2', name: 'Aigles United' },
        { id: 't3', name: 'Panthères SC' },
        { id: 't4', name: 'Étoile Rouge' },
        { id: 't5', name: 'Gazelles' },
        { id: 't6', name: 'Tigres' },
      ];
      const M = (id: number, h: string, a: string, hg: number, ag: number): MatchLite => ({
        id: `m${id}`, competitionId: this.competitionId || 'mock-1', category: this.category, status: 'FINISHED', homeTeamId: h, awayTeamId: a, homeGoals: hg, awayGoals: ag
      });
      const matches: MatchLite[] = [
        M(1,'t1','t2',2,1), M(2,'t3','t4',0,0), M(3,'t5','t6',1,3),
        M(4,'t1','t3',1,1), M(5,'t2','t4',0,2), M(6,'t6','t3',2,0),
        M(7,'t4','t1',1,2), M(8,'t2','t5',3,0), M(9,'t6','t1',0,2),
      ];
      this.standings = computeLeagueStandings(teams, matches);
      this.loading = false;
      return;
    }

    // CUP_GROUPS mock: 2 groupes de 4
    const teams: TeamLite[] = [
      { id: 'a1', name: 'Groupe A - Lions', groupLabel: 'A' },
      { id: 'a2', name: 'Groupe A - Aigles', groupLabel: 'A' },
      { id: 'a3', name: 'Groupe A - Panthères', groupLabel: 'A' },
      { id: 'a4', name: 'Groupe A - Gazelles', groupLabel: 'A' },
      { id: 'b1', name: 'Groupe B - Étoiles', groupLabel: 'B' },
      { id: 'b2', name: 'Groupe B - Tigres', groupLabel: 'B' },
      { id: 'b3', name: 'Groupe B - Hérons', groupLabel: 'B' },
      { id: 'b4', name: 'Groupe B - Cygnes', groupLabel: 'B' },
    ];
    const MG = (id: number, g: 'A' | 'B', h: string, a: string, hg: number, ag: number): MatchLite => ({
      id: `gm${id}`, competitionId: this.competitionId || 'mock-1', category: this.category, status: 'FINISHED', homeTeamId: h, awayTeamId: a, homeGoals: hg, awayGoals: ag, groupLabel: g
    });
    const matches: MatchLite[] = [
      MG(1,'A','a1','a2',1,0), MG(2,'A','a3','a4',2,2), MG(3,'A','a1','a3',0,1), MG(4,'A','a2','a4',3,2),
      MG(5,'B','b1','b2',0,0), MG(6,'B','b3','b4',1,2), MG(7,'B','b1','b3',2,1), MG(8,'B','b2','b4',1,0),
    ];
    this.standings = computeGroupStandings(teams, matches);
    this.loading = false;
  }
}

