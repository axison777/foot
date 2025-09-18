export type CategoryCode =
  | 'F_U16' | 'F_U20'
  | 'M_U16' | 'M_U18' | 'M_U20' | 'M_SENIOR';

export type CompetitionFormat = 'LEAGUE' | 'CUP_GROUPS';

export interface CompetitionMeta {
  id: string;
  name: string;
  category?: CategoryCode;
  season?: string;
  format: CompetitionFormat;
  qualificationSlots?: {
    championsLeague?: number;
    europaLeague?: number;
    conferenceLeague?: number;
    relegation?: number;
  };
}

export interface TeamLite {
  id: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  logo_url?: string;
  groupLabel?: string; // for group stages
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'ASSIST' | 'YELLOW' | 'RED' | 'OWN_GOAL' | 'PENALTY_GOAL';
  teamId: string;
  playerId?: string;
  assistedByPlayerId?: string;
}

export interface MatchLite {
  id: string;
  competitionId: string;
  category: CategoryCode;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  dateUtc?: string;
  groupLabel?: string;
  events?: MatchEvent[];
  lineups?: {
    home?: { players: { playerId: string; role: 'GK' | 'DF' | 'MF' | 'FW' | 'SUB'; starter: boolean; }[] };
    away?: { players: { playerId: string; role: 'GK' | 'DF' | 'MF' | 'FW' | 'SUB'; starter: boolean; }[] };
  };
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  formLast5?: ('W' | 'D' | 'L')[];
}

export interface LeagueStandings {
  kind: 'LEAGUE';
  rows: StandingsRow[];
}

export interface GroupStandings {
  kind: 'GROUPS';
  groups: Record<string, StandingsRow[]>;
}

export type AnyStandings = LeagueStandings | GroupStandings;

export interface PlayerLite {
  id: string;
  first_name?: string;
  last_name?: string;
  fullName?: string;
  team_id: string;
  preferred_position?: 'GOALKEEPER' | 'DEFENSE' | 'MIDFIELD' | 'ATTACK';
}

export interface ScorerEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  penalties?: number;
}

export interface AssistEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  assists: number;
}

export interface CleanSheetEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  cleanSheets: number;
}

