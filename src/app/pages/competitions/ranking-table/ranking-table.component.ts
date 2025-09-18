import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Ranking } from '../../../models/ranking.model';
import { Match } from '../../../models/match.model';
import { Team } from '../../../models/team.model';
import { RankingService } from '../../../service/ranking.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ranking-table',
  templateUrl: './ranking-table.component.html',
  styleUrls: ['./ranking-table.component.scss'],
  standalone: true,
  imports: [CommonModule, TableModule],
})
export class RankingTableComponent implements OnInit {

  @Input() matches: Match[] = [];
  @Input() teams: Team[] = [];

  rankings: Ranking[] = [];

  constructor(private rankingService: RankingService) { }

  ngOnInit(): void {
    if (this.matches && this.teams) {
      this.rankings = this.rankingService.calculateRankings(this.matches, this.teams);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.matches || changes.teams) {
      if (this.matches && this.teams) {
        this.rankings = this.rankingService.calculateRankings(this.matches, this.teams);
      }
    }
  }
}
