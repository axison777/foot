import { Injectable } from '@angular/core';
import { Match } from '../models/match.model';
import { Ranking } from '../models/ranking.model';
import { Team } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class RankingService {

  constructor() { }

  calculateRankings(matches: Match[], teams: Team[]): Ranking[] {
    const rankings: Ranking[] = [];

    // Initialize rankings for each team
    for (const team of teams) {
      rankings.push({
        team: team,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      });
    }

    // Calculate rankings based on match results
    for (const match of matches) {
      const teamOneRanking = rankings.find(r => r.team.id === match.team_one_id);
      const teamTwoRanking = rankings.find(r => r.team.id === match.team_two_id);

      if (teamOneRanking && teamTwoRanking) {
        teamOneRanking.played++;
        teamTwoRanking.played++;

        teamOneRanking.goalsFor += match.team_one_score;
        teamOneRanking.goalsAgainst += match.team_two_score;
        teamOneRanking.goalDifference = teamOneRanking.goalsFor - teamOneRanking.goalsAgainst;

        teamTwoRanking.goalsFor += match.team_two_score;
        teamTwoRanking.goalsAgainst += match.team_one_score;
        teamTwoRanking.goalDifference = teamTwoRanking.goalsFor - teamTwoRanking.goalsAgainst;

        if (match.team_one_score > match.team_two_score) {
          teamOneRanking.wins++;
          teamOneRanking.points += 3;
          teamTwoRanking.losses++;
        } else if (match.team_one_score < match.team_two_score) {
          teamTwoRanking.wins++;
          teamTwoRanking.points += 3;
          teamOneRanking.losses++;
        } else {
          teamOneRanking.draws++;
          teamTwoRanking.draws++;
          teamOneRanking.points += 1;
          teamTwoRanking.points += 1;
        }
      }
    }

    // Sort rankings
    rankings.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      } else if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      } else {
        return b.goalsFor - a.goalsFor;
      }
    });

    return rankings;
  }
}
