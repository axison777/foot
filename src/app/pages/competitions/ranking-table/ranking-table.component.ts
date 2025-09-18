import { Component, Input, OnInit } from '@angular/core';
import { Ranking } from '../../../models/ranking.model';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ranking-table',
  templateUrl: './ranking-table.component.html',
  styleUrls: ['./ranking-table.component.scss'],
  standalone: true,
  imports: [CommonModule, TableModule],
})
export class RankingTableComponent {
  @Input() rankings: Ranking[] = [];
}
