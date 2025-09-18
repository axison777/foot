import { AnyStandings, MatchLite, StandingsRow, TeamLite } from '../../models/standings.model';

interface TieBreakerOptions {
  useHeadToHead: boolean;
}

const defaultTieBreakers: TieBreakerOptions = {
  useHeadToHead: true,
};

interface TeamAggregate {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: ('W' | 'D' | 'L')[];
}

export function computeLeagueStandings(
  teams: TeamLite[],
  matches: MatchLite[],
  opts: Partial<TieBreakerOptions> = {}
): AnyStandings {
  const options = { ...defaultTieBreakers, ...opts };

  const byTeam: Record<string, TeamAggregate> = {};
  for (const t of teams) {
    byTeam[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      form: [],
    };
  }

  const finished = matches.filter(m => m.status === 'FINISHED');

  const lastResultsByTeam: Record<string, ('W' | 'D' | 'L')[]> = {};

  for (const m of finished) {
    const home = byTeam[m.homeTeamId];
    const away = byTeam[m.awayTeamId];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += m.homeGoals; home.goalsAgainst += m.awayGoals;
    away.goalsFor += m.awayGoals; away.goalsAgainst += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.wins++; away.losses++;
      (lastResultsByTeam[m.homeTeamId] ||= []).push('W');
      (lastResultsByTeam[m.awayTeamId] ||= []).push('L');
    } else if (m.homeGoals < m.awayGoals) {
      home.losses++; away.wins++;
      (lastResultsByTeam[m.homeTeamId] ||= []).push('L');
      (lastResultsByTeam[m.awayTeamId] ||= []).push('W');
    } else {
      home.draws++; away.draws++;
      (lastResultsByTeam[m.homeTeamId] ||= []).push('D');
      (lastResultsByTeam[m.awayTeamId] ||= []).push('D');
    }
  }

  const rows: StandingsRow[] = Object.values(byTeam).map(a => ({
    teamId: a.teamId,
    teamName: a.teamName,
    played: a.played,
    wins: a.wins,
    draws: a.draws,
    losses: a.losses,
    goalsFor: a.goalsFor,
    goalsAgainst: a.goalsAgainst,
    goalDifference: a.goalsFor - a.goalsAgainst,
    points: a.wins * 3 + a.draws,
    formLast5: (lastResultsByTeam[a.teamId] || []).slice(-5),
  }));

  rows.sort((a, b) => tieBreakCompare(a, b, finished, options));

  return { kind: 'LEAGUE', rows };
}

export function computeGroupStandings(
  teams: TeamLite[],
  matches: MatchLite[],
  opts: Partial<TieBreakerOptions> = {}
): AnyStandings {
  const groups = groupBy(teams, t => t.groupLabel || 'A');
  const standings: Record<string, StandingsRow[]> = {};

  for (const [groupLabel, groupTeams] of Object.entries(groups)) {
    const groupTeamIds = new Set(groupTeams.map(t => t.id));
    const groupMatches = matches.filter(
      m => m.status === 'FINISHED'
        && m.groupLabel === groupLabel
        && groupTeamIds.has(m.homeTeamId)
        && groupTeamIds.has(m.awayTeamId)
    );
    const league = computeLeagueStandings(groupTeams, groupMatches, opts) as { kind: 'LEAGUE', rows: StandingsRow[] };
    standings[groupLabel] = league.rows;
  }

  return { kind: 'GROUPS', groups: standings };
}

function tieBreakCompare(
  a: StandingsRow,
  b: StandingsRow,
  matches: MatchLite[],
  options: TieBreakerOptions
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  if (options.useHeadToHead) {
    const h2h = headToHeadCompare(a.teamId, b.teamId, matches);
    if (h2h !== 0) return h2h;
  }

  return a.teamName.localeCompare(b.teamName);
}

function headToHeadCompare(teamA: string, teamB: string, matches: MatchLite[]): number {
  const h2h = matches.filter(m =>
    m.status === 'FINISHED' &&
    ((m.homeTeamId === teamA && m.awayTeamId === teamB) ||
     (m.homeTeamId === teamB && m.awayTeamId === teamA))
  );

  let aPts = 0, bPts = 0, aGD = 0;
  for (const m of h2h) {
    const aIsHome = m.homeTeamId === teamA;
    const aGoals = aIsHome ? m.homeGoals : m.awayGoals;
    const bGoals = aIsHome ? m.awayGoals : m.homeGoals;

    if (aGoals > bGoals) aPts += 3;
    else if (aGoals === bGoals) { aPts += 1; bPts += 1; }
    else bPts += 3;

    aGD += (aGoals - bGoals);
  }

  if (aPts !== bPts) return bPts - aPts;
  if (aGD !== 0) return -aGD;
  return 0;
}

function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (t: T) => K
): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(keyFn(item));
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

