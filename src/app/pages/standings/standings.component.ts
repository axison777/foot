import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { StandingsService } from '../../service/standings.service';
import { AnyStandings, CategoryCode, CompetitionMeta } from '../../models/standings.model';

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

  constructor(
    private route: ActivatedRoute,
    private standingsSvc: StandingsService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.pipe(
      switchMap((pm: ParamMap) => {
        this.competitionId = pm.get('id') || '';
        this.loading = true;
        return this.standingsSvc.getCompetitionMeta(this.competitionId);
      })
    ).subscribe((comp: CompetitionMeta) => {
      this.competition = comp;
      this.category = (comp.category || 'M_SENIOR') as CategoryCode;
      this.loadStandings();
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
}

