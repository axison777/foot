import { Competition } from './../../models/competition.model';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LigueService } from '../../service/ligue.service';
import { Ville, VilleService } from '../../service/ville.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { League } from '../../models/league.model';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { Team } from '../../models/team.model';
import { EquipeService } from '../../service/equipe.service';
import { CheckboxModule } from 'primeng/checkbox';
import { RankingTableComponent } from './ranking-table/ranking-table.component';
import { RankingService } from '../../service/ranking.service';
import { Ranking } from '../../models/ranking.model';
import { TabViewModule } from 'primeng/tabview';
import { Group } from '../../models/group.model';

@Component({
  selector: 'app-ligues',
  templateUrl: './competitions.component.html',
  standalone: true,
  styleUrls: ['./competitions.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DropdownModule, // Ajouté pour le dropdown
    ConfirmDialogModule,
    ToastModule,
    SelectModule,
    ReactiveFormsModule,
    FileUploadModule,
    InputNumberModule,
    CheckboxModule,
    RankingTableComponent,
    TabViewModule
  ]
})
export class CompetitionsComponent implements OnInit {
  @ViewChild('fileUploader') fileUploader!: FileUpload;

  leagues: Competition[] = [];
  villes: Ville[] = [];
  selectedLeague!: Competition;
  searchTerm: string = '';
  loading: boolean = false;
  showForm: boolean = false;
  isEditing: boolean = false;
  editingLeagueId?: string | null = null;
  currentLogo: string | null = null;
  selectedFile: File | null = null;
  leagueForm!: FormGroup;

  // Options pour le dropdown des groupes
  groupOptions = [
    { label: '1 ', value: 1 },
    { label: '2 ', value: 2 }
  ];
  teamsForm!: FormGroup;
  teamControls: FormArray<FormControl<boolean>> = new FormArray<FormControl<boolean>>([]);
  selectedTeamIds: string[] = [];
  selectAllTeamsControl = new FormControl(false);
  teams:Team[] = [
  ];
  teamSearchControl = new FormControl('');
  teamSearchTeam: string = '';
  isEditingTeams: boolean = false;
  rankings: Ranking[] = [];
  activeTabIndex: number = 0;


  constructor(
    private ligueService: LigueService,
    private villeService: VilleService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private equipeService: EquipeService,
    private rankingService: RankingService
  ) {
    this.leagueForm = this.fb.group({
      name: ['', Validators.required],
      teams_count: ['', Validators.required],
      pools_count: [1, Validators.required], // Ajouté avec valeur par défaut 1
      logo: ['']
    });

    this.teamsForm = this.fb.group({
      selected_teams: [[], Validators.required]
    });
  }

  ngOnInit(): void {
     this.loadLeagues();
     this.loadTeams();
    this.loadVilles();
  }

  loadLeagues(): void {
    this.leagues=[
        {
            id: '1',
            name: 'Super Ligue Ouaga',
            league_count: 10,
            logo: 'https://via.placeholder.com/80x80.png?text=SLO',
            leagues: [
                {
                    id: '1',
                    name: 'Super Ligue Ouaga U20 Féminine',
                    teams_count: 12,
                    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/00/Barclays_FA_Women%27s_Super_League_logo.svg/langfr-330px-Barclays_FA_Women%27s_Super_League_logo.svg.png',
                    pools_count: 1,
                },
                 {
                    id: '2',
                    name: 'Super Ligue Ouaga U20 Masculine',
                    teams_count: 12,
                    logo: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Ffr.wikipedia.org%2Fwiki%2FChampionnat_d%2527Angleterre_f%25C3%25A9minin_de_football&psig=AOvVaw33wbqmtNVbASo-pqnUu78c&ust=1756734149844000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOi4tumWtY8DFQAAAAAdAAAAABAE',
                    pools_count: 2,
                    pools: [
                        { id: '1', name: 'A', teams: [] },
                        { id: '2', name: 'B', teams: [] }
                    ]
                },
            ]
        },
        {
            id: '2',
            name: 'Ligue blabla',
            league_count: 12,
            logo: 'https://via.placeholder.com/80x80.png?text=U20'
        }
    ]
  }

  loadVilles(): void {
    this.villeService.getAll().subscribe({
      next: (res: any) => {
        this.villes = res?.data.cities || [];
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) this.resetForm();
  }

  resetForm(): void {
    this.leagueForm.reset({
      name: '',
      teams_count: '',
      pools_count: 1, // Valeur par défaut
      logo: ''
    });
    this.fileUploader?.clear();
    this.isEditing = false;
    this.editingLeagueId = null;
    this.currentLogo = null;
    this.selectedFile = null;
  }

  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.leagueForm.get('logo')?.setValue(file.name);
    }
  }

  saveLeague(): void {
    if ((this.leagueForm.invalid && !this.isEditing) || (this.leagueForm.get('name')?.invalid && this.isEditing)) {
      this.leagueForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = new FormData();

    if (this.leagueForm.get('name')?.value)
      formData.append('name', this.leagueForm.get('name')?.value);
    if (this.leagueForm.get('teams_count')?.value)
      formData.append('teams_count', this.leagueForm.get('teams_count')?.value);
    if (this.leagueForm.get('pools_count')?.value)
      formData.append('pools_count', this.leagueForm.get('pools_count')?.value);
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }
    if (this.isEditing) {
      formData.append('_method', 'PUT');
    }

    const request$ = this.isEditing && this.editingLeagueId
      ? this.ligueService.update(this.editingLeagueId, formData)
      : this.ligueService.create(formData);

    request$.subscribe({
      next: () => {
        this.loadLeagues();
        this.toggleForm();
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing ? 'Ligue modifiée' : 'Ligue créée',
          detail: this.leagueForm.get('name')?.value,
          life: 3000
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Erreur lors de la ${this.isEditing ? 'modification' : 'création'} de la ligue`,
        });
      }
    });
  }

  editLeague(league: League): void {
    if(!league.id) return;
    this.isEditing = true;
    this.editingLeagueId = league.id;
    this.currentLogo = league.logo ?? null;
    this.leagueForm.patchValue({
      name: league.name,
      teams_count: league.teams_count,
      pools_count: league.pools_count || 1, // Valeur par défaut si non définie
      logo: league.logo ? league.logo : ''
    });
    this.selectedFile = null;
    this.showForm = true;
  }

  editLeagueTeams(league: Competition): void {
    this.selectedTeamIds = [];
    if (league && league.leagues) {
        league.leagues.forEach(l => {
            if (l.teams_ids) {
                this.selectedTeamIds.push(...l.teams_ids);
            }
        });
    }
    this.isEditingTeams = true;
    this.selectedLeague = league;
    this.updateTeamControls();
    this.activeTabIndex = 0;
    this.rankings = [];
  }

  saveLeagueTeams(): void {
    this.loading = true;
  }

  filteredTeams(): any[] {
  const term = this.teamSearchControl.value?.toLowerCase() || '';
  return this.teams.filter(team =>
    team.name?.toLowerCase().includes(term) ||
    team.abbreviation?.toLowerCase().includes(term)
  );
}

toggleTeamSelection(teamId: string): void {
  const index = this.selectedTeamIds.indexOf(teamId);
  if (index === -1) {
    this.selectedTeamIds.push(teamId);
  } else {
    this.selectedTeamIds = this.selectedTeamIds.filter(id => id !== teamId);
;
  }
  this.updateSelectedTeamsControl();
}

isTeamSelected(teamId: string): boolean {
  return this.selectedTeamIds.includes(teamId);
}

removeTeam(teamId: string): void {
  this.selectedTeamIds = this.selectedTeamIds.filter(id => id !== teamId);
  this.updateSelectedTeamsControl();
  console.log(this.selectedTeamIds);
}

updateSelectedTeamsControl(): void {
  this.teamsForm.get('selected_teams')?.setValue([...this.selectedTeamIds]);
}

updateSearchTeam(event: Event): void {
  this.teamSearchTeam = (event.target as HTMLInputElement).value;
}

get teamSelectionControls(): FormControl[] {
  return this.teamControls.controls as FormControl[];
}

updateTeamControls() {
    const filtered = this.filteredTeams();
    this.teamControls.clear();
    for (let team of filtered) {
        if (team.id) {
            const control = new FormControl<boolean>(this.selectedTeamIds.includes(team.id), { nonNullable: true });

            this.teamControls.push(control);
            control.valueChanges.subscribe(checked => {
                if (team.id) {
                    if (checked && !this.selectedTeamIds.includes(team.id)) {
                        this.selectedTeamIds.push(team.id);
                    } else if (!checked) {
                        this.selectedTeamIds = this.selectedTeamIds.filter(id => id !== team.id);
                    }
                }
            });
        }
    }
}

get selectedTeamObjects() {
  return this.teams.filter(team => team.id && this.selectedTeamIds.includes(team.id));
}

uncheckTeam(teamId: string) {
  const filtered = this.filteredTeams();
  const index = filtered.findIndex(t => t.id === teamId);
  if (index !== -1) {
    this.teamSelectionControls[index].setValue(false);
  } else {
    this.selectedTeamIds = this.selectedTeamIds.filter(id => id !== teamId);
  }
  console.log(this.selectedTeamIds);
}

trackByTeamId( team: any): string {
  return team.id;
}

    loadTeams(): void {
        this.equipeService.getAll().subscribe({
            next: (res: any) => {
                this.teams = res?.data?.teams || [];
                this.updateTeamControls();
            },
            error: (err) => {
                console.error('Erreur lors du chargement des équipes', err);
            }
        });
    }

toggleAllSelections() {
  const value = this.selectAllTeamsControl.value;
  this.teamSelectionControls.forEach(control => control.setValue(value));
}

updateGlobalSelection() {
  const allChecked = this.teamSelectionControls.every(c => c.value === true);
  this.selectAllTeamsControl.setValue(allChecked, { emitEvent: false });
}

  deleteLeague(id?: string): void {
    if(!id) return;
    this.confirmationService.confirm({
     icon: 'pi pi-exclamation-triangle',
      message: 'Voulez-vous vraiment supprimer ce club ?',
      accept: () => {
        this.ligueService.delete(id).subscribe(() => {
            this.loadLeagues();
            this.messageService.add({
                severity: 'success',
                summary: 'Suppression réussie',
                detail: 'La ligue a été supprimée.'
            });
        });
      }
    });
  }

  get filteredLeagues(): Competition[] {
    if (!this.searchTerm) return this.leagues;
    return this.leagues.filter(league =>
      league?.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  closeTeamsForm(){
    this.isEditingTeams = false
    this.selectedTeamIds = [];
    this.teamControls.reset();
    this.teamsForm.reset();
    this.teamSelectionControls.forEach(ctrl => ctrl.setValue(false));
    this.updateGlobalSelection();
    this.updateTeamControls();
    this.updateSelectedTeamsControl();
  }

    getOriginalIndex(obj: any): number {
  return this.leagues.indexOf(obj) + 1;
  }

  loadRankings(leagueId?: string, groupId?: string): void {
    this.rankings = [];
    let request$: Observable<Ranking[]>;

    if (groupId) {
        request$ = this.rankingService.getRankingsByGroupId(groupId);
    } else if(leagueId) {
        request$ = this.rankingService.getRankingsByLeagueId(leagueId);
    } else {
        return;
    }

    request$.subscribe({
        next: (res: any) => {
            this.rankings = res?.data?.rankings || [];
        },
        error: (err) => {
            console.error('Erreur lors du chargement des classements', err);
        }
    });
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    if (!this.selectedLeague || !this.selectedLeague.leagues) return;

    const firstLeague = this.selectedLeague.leagues[0];
    if (!firstLeague) return;

    if (this.activeTabIndex === 0) {
        this.rankings = [];
    } else if (firstLeague.pools_count && firstLeague.pools_count > 1 && firstLeague.pools) {
        // Cup format with groups
        const group = firstLeague.pools[this.activeTabIndex - 1];
        if (group?.id) {
            this.loadRankings(undefined, group.id);
        }
    } else {
        // League format
        if (firstLeague.id) {
            this.loadRankings(firstLeague.id);
        }
    }
  }
}
