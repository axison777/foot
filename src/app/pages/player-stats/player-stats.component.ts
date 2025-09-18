import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlayerStatsService } from '../../service/player-stats.service';
import { AssistEntry, CategoryCode, CleanSheetEntry, ScorerEntry } from '../../models/standings.model';

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-stats.component.html',
  styleUrls: ['./player-stats.component.scss']
})
export class PlayerStatsComponent implements OnInit {
  competitionId!: string;
  category: CategoryCode = 'M_SENIOR';

  tab: 'SCORERS' | 'ASSISTS' | 'CLEANS' = 'SCORERS';

  scorers: ScorerEntry[] = [];
  assists: AssistEntry[] = [];
  cleans: CleanSheetEntry[] = [];
  loading = true;

  categories: CategoryCode[] = ['F_U16','F_U20','M_U16','M_U18','M_U20','M_SENIOR'];

  constructor(
    private route: ActivatedRoute,
    private statsSvc: PlayerStatsService
  ) {}

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAll();
  }

  changeCategory(cat: string) {
    this.category = cat as CategoryCode;
    this.loadAll();
  }

  changeTab(t: 'SCORERS'|'ASSISTS'|'CLEANS') {
    this.tab = t;
  }

  private loadAll() {
    this.loading = true;
    this.statsSvc.getTopScorers(this.competitionId, this.category).subscribe((v: ScorerEntry[]) => this.scorers = v);
    this.statsSvc.getTopAssists(this.competitionId, this.category).subscribe((v: AssistEntry[]) => this.assists = v);
    this.statsSvc.getCleanSheets(this.competitionId, this.category).subscribe((v: CleanSheetEntry[]) => {
      this.cleans = v;
      this.loading = false;
    });
  }
}

