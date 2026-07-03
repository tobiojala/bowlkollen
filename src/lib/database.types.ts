export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anon_views: {
        Row: {
          anon_id: string
          entity_id: string
          entity_type: string
          id: string
          viewed_at: string
        }
        Insert: {
          anon_id: string
          entity_id: string
          entity_type: string
          id?: string
          viewed_at?: string
        }
        Update: {
          anon_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      availability_polls: {
        Row: {
          created_at: string | null
          created_by: string | null
          deadline: string | null
          id: string
          match_id: string | null
          question: string
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          id?: string
          match_id?: string | null
          question: string
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          id?: string
          match_id?: string | null
          question?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_polls_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_polls_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "availability_polls_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_responses: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          poll_id: string | null
          response: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          poll_id?: string | null
          response: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          poll_id?: string | null
          response?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "availability_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      bits_clubs: {
        Row: {
          bits_id: number
          county: string | null
          county_id: number | null
          hall_id: number | null
          hall_name: string | null
          is_active: boolean | null
          is_play_bowl: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          bits_id: number
          county?: string | null
          county_id?: number | null
          hall_id?: number | null
          hall_name?: string | null
          is_active?: boolean | null
          is_play_bowl?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          bits_id?: number
          county?: string | null
          county_id?: number | null
          hall_id?: number | null
          hall_name?: string | null
          is_active?: boolean | null
          is_play_bowl?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bits_divisions: {
        Row: {
          bits_division_id: number
          name: string
          season_id: number
          synced_at: string | null
        }
        Insert: {
          bits_division_id: number
          name: string
          season_id: number
          synced_at?: string | null
        }
        Update: {
          bits_division_id?: number
          name?: string
          season_id?: number
          synced_at?: string | null
        }
        Relationships: []
      }
      bits_match_player_results: {
        Row: {
          bits_match_id: number
          id: number
          is_home_team: boolean
          lic_nbr: string
          player_name: string
          series: number[]
          synced_at: string | null
          total_result: number
        }
        Insert: {
          bits_match_id: number
          id?: number
          is_home_team: boolean
          lic_nbr: string
          player_name: string
          series: number[]
          synced_at?: string | null
          total_result: number
        }
        Update: {
          bits_match_id?: number
          id?: number
          is_home_team?: boolean
          lic_nbr?: string
          player_name?: string
          series?: number[]
          synced_at?: string | null
          total_result?: number
        }
        Relationships: [
          {
            foreignKeyName: "bits_match_player_results_bits_match_id_fkey"
            columns: ["bits_match_id"]
            isOneToOne: false
            referencedRelation: "bits_matches"
            referencedColumns: ["bits_match_id"]
          },
        ]
      }
      bits_match_scores: {
        Row: {
          bits_lic_nbr: string | null
          bits_match_id: number
          board: number
          id: number
          is_home_team: boolean | null
          order_index: number
          player_name: string
          score: number
          serie: number
          synced_at: string | null
        }
        Insert: {
          bits_lic_nbr?: string | null
          bits_match_id: number
          board: number
          id?: number
          is_home_team?: boolean | null
          order_index: number
          player_name: string
          score: number
          serie: number
          synced_at?: string | null
        }
        Update: {
          bits_lic_nbr?: string | null
          bits_match_id?: number
          board?: number
          id?: number
          is_home_team?: boolean | null
          order_index?: number
          player_name?: string
          score?: number
          serie?: number
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bits_match_scores_bits_lic_nbr_fkey"
            columns: ["bits_lic_nbr"]
            isOneToOne: false
            referencedRelation: "bits_players"
            referencedColumns: ["lic_nbr"]
          },
          {
            foreignKeyName: "bits_match_scores_bits_match_id_fkey"
            columns: ["bits_match_id"]
            isOneToOne: false
            referencedRelation: "bits_matches"
            referencedColumns: ["bits_match_id"]
          },
        ]
      }
      bits_matches: {
        Row: {
          away_bits_team_id: number
          away_result: number | null
          away_score: number | null
          away_team_name: string
          bits_division_id: number | null
          bits_match_id: number
          division_name: string | null
          exact_results_synced: boolean | null
          hall_city: string | null
          hall_name: string | null
          home_bits_team_id: number
          home_result: number | null
          home_score: number | null
          home_team_name: string
          is_finished: boolean | null
          match_date: string
          match_scheme_id: string | null
          oil_pattern: string | null
          round_id: number | null
          scores_synced: boolean | null
          season_id: number
          supabase_match_id: string | null
          synced_at: string | null
        }
        Insert: {
          away_bits_team_id: number
          away_result?: number | null
          away_score?: number | null
          away_team_name: string
          bits_division_id?: number | null
          bits_match_id: number
          division_name?: string | null
          exact_results_synced?: boolean | null
          hall_city?: string | null
          hall_name?: string | null
          home_bits_team_id: number
          home_result?: number | null
          home_score?: number | null
          home_team_name: string
          is_finished?: boolean | null
          match_date: string
          match_scheme_id?: string | null
          oil_pattern?: string | null
          round_id?: number | null
          scores_synced?: boolean | null
          season_id: number
          supabase_match_id?: string | null
          synced_at?: string | null
        }
        Update: {
          away_bits_team_id?: number
          away_result?: number | null
          away_score?: number | null
          away_team_name?: string
          bits_division_id?: number | null
          bits_match_id?: number
          division_name?: string | null
          exact_results_synced?: boolean | null
          hall_city?: string | null
          hall_name?: string | null
          home_bits_team_id?: number
          home_result?: number | null
          home_score?: number | null
          home_team_name?: string
          is_finished?: boolean | null
          match_date?: string
          match_scheme_id?: string | null
          oil_pattern?: string | null
          round_id?: number | null
          scores_synced?: boolean | null
          season_id?: number
          supabase_match_id?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bits_matches_supabase_match_id_fkey"
            columns: ["supabase_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      bits_players: {
        Row: {
          abbr_name: string | null
          agreement_club_id: number | null
          agreement_club_name: string | null
          agreement_synced_at: string | null
          club_name: string | null
          first_name: string
          lic_nbr: string
          lic_type_name: string | null
          licence_average: number | null
          licence_skill_lvl: number | null
          public_id: string
          sur_name: string
          synced_at: string | null
        }
        Insert: {
          abbr_name?: string | null
          agreement_club_id?: number | null
          agreement_club_name?: string | null
          agreement_synced_at?: string | null
          club_name?: string | null
          first_name?: string
          lic_nbr: string
          lic_type_name?: string | null
          licence_average?: number | null
          licence_skill_lvl?: number | null
          public_id?: string
          sur_name?: string
          synced_at?: string | null
        }
        Update: {
          abbr_name?: string | null
          agreement_club_id?: number | null
          agreement_club_name?: string | null
          agreement_synced_at?: string | null
          club_name?: string | null
          first_name?: string
          lic_nbr?: string
          lic_type_name?: string | null
          licence_average?: number | null
          licence_skill_lvl?: number | null
          public_id?: string
          sur_name?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      bits_teams: {
        Row: {
          bits_club_id: number | null
          bits_team_id: number
          club_name: string | null
          hall_id: number | null
          hall_name: string | null
          name: string
          team_alias: string | null
          team_type: number | null
          team_type_desc: string | null
          updated_at: string | null
        }
        Insert: {
          bits_club_id?: number | null
          bits_team_id: number
          club_name?: string | null
          hall_id?: number | null
          hall_name?: string | null
          name: string
          team_alias?: string | null
          team_type?: number | null
          team_type_desc?: string | null
          updated_at?: string | null
        }
        Update: {
          bits_club_id?: number | null
          bits_team_id?: number
          club_name?: string | null
          hall_id?: number | null
          hall_name?: string | null
          name?: string
          team_alias?: string | null
          team_type?: number | null
          team_type_desc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bits_teams_bits_club_id_fkey"
            columns: ["bits_club_id"]
            isOneToOne: false
            referencedRelation: "bits_clubs"
            referencedColumns: ["bits_id"]
          },
        ]
      }
      bowling_centers: {
        Row: {
          accepts_gift_cards: boolean | null
          city: string | null
          created_at: string | null
          email: string | null
          id: number
          inspection_date: string | null
          inspection_status: string | null
          lane_type: string | null
          lanes: number | null
          machine_type: string | null
          name: string
          oil_machine: string | null
          online_booking: boolean | null
          online_booking_url: string | null
          online_scoring: boolean | null
          online_scoring_url: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          street_address: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accepts_gift_cards?: boolean | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id: number
          inspection_date?: string | null
          inspection_status?: string | null
          lane_type?: string | null
          lanes?: number | null
          machine_type?: string | null
          name: string
          oil_machine?: string | null
          online_booking?: boolean | null
          online_booking_url?: string | null
          online_scoring?: boolean | null
          online_scoring_url?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accepts_gift_cards?: boolean | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          inspection_date?: string | null
          inspection_status?: string | null
          lane_type?: string | null
          lanes?: number | null
          machine_type?: string | null
          name?: string
          oil_machine?: string | null
          online_booking?: boolean | null
          online_booking_url?: string | null
          online_scoring?: boolean | null
          online_scoring_url?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      club_claims: {
        Row: {
          claimed_at: string | null
          id: string
          role: string | null
          status: string | null
          team_id: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_claims_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "club_claims_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          player_id: string | null
          team_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "favorites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          click_count: number
          code: string
          created_at: string
          id: string
          invitee_name: string | null
          is_active: boolean
        }
        Insert: {
          click_count?: number
          code: string
          created_at?: string
          id?: string
          invitee_name?: string | null
          is_active?: boolean
        }
        Update: {
          click_count?: number
          code?: string
          created_at?: string
          id?: string
          invitee_name?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          code: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      league_teams: {
        Row: {
          id: string
          league_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          league_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          league_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          id: string
          level: string
          name: string
          season_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          name: string
          season_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          name?: string
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_slots: {
        Row: {
          bord: number | null
          id: string
          is_reserve: boolean | null
          lineup_id: string | null
          player_name: string | null
          position: number | null
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          bord?: number | null
          id?: string
          is_reserve?: boolean | null
          lineup_id?: string | null
          player_name?: string | null
          position?: number | null
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          bord?: number | null
          id?: string
          is_reserve?: boolean | null
          lineup_id?: string | null
          player_name?: string | null
          position?: number | null
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineup_slots_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          match_id: string | null
          published_at: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id?: string | null
          published_at?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id?: string | null
          published_at?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          bord: number
          created_at: string | null
          id: string
          match_id: string | null
          player_name: string
          position: number
          team_id: string | null
        }
        Insert: {
          bord: number
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_name: string
          position: number
          team_id?: string | null
        }
        Update: {
          bord?: number
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_name?: string
          position?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "match_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          prediction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          prediction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          prediction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          bord: number | null
          created_at: string | null
          date: string
          games: number[]
          id: string
          match_id: string | null
          player_id: string | null
          position: number | null
          round: string
          team_id: string | null
          total: number | null
          type: string | null
        }
        Insert: {
          bord?: number | null
          created_at?: string | null
          date: string
          games?: number[]
          id?: string
          match_id?: string | null
          player_id?: string | null
          position?: number | null
          round: string
          team_id?: string | null
          total?: number | null
          type?: string | null
        }
        Update: {
          bord?: number | null
          created_at?: string | null
          date?: string
          games?: number[]
          id?: string
          match_id?: string | null
          player_id?: string | null
          position?: number | null
          round?: string
          team_id?: string | null
          total?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "match_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string | null
          date: string
          division: string | null
          external_id: string | null
          external_match_id: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          league_id: string | null
          location: string | null
          oil_pattern: string | null
          oil_profile: string | null
          round: string | null
          status: string | null
          stream_label: string | null
          stream_live: boolean | null
          stream_url: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          date: string
          division?: string | null
          external_id?: string | null
          external_match_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          location?: string | null
          oil_pattern?: string | null
          oil_profile?: string | null
          round?: string | null
          status?: string | null
          stream_label?: string | null
          stream_live?: boolean | null
          stream_url?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          date?: string
          division?: string | null
          external_id?: string | null
          external_match_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          location?: string | null
          oil_pattern?: string | null
          oil_profile?: string | null
          round?: string | null
          status?: string | null
          stream_label?: string | null
          stream_live?: boolean | null
          stream_url?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          read_at: string | null
          team_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          read_at?: string | null
          team_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          read_at?: string | null
          team_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_profiles: {
        Row: {
          category: string | null
          created_at: string | null
          dat_url: string | null
          description: string | null
          id: number
          kosi_url: string | null
          length_ft: number | null
          name: string
          pat_url: string | null
          pdf_url: string | null
          ratio: number | null
          season: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          dat_url?: string | null
          description?: string | null
          id?: number
          kosi_url?: string | null
          length_ft?: number | null
          name: string
          pat_url?: string | null
          pdf_url?: string | null
          ratio?: number | null
          season?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          dat_url?: string | null
          description?: string | null
          id?: number
          kosi_url?: string | null
          length_ft?: number | null
          name?: string
          pat_url?: string | null
          pdf_url?: string | null
          ratio?: number | null
          season?: string | null
        }
        Relationships: []
      }
      player_cheers: {
        Row: {
          created_at: string
          id: string
          player_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_cheers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_cheers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "player_cheers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_claims: {
        Row: {
          claimed_at: string | null
          id: string
          player_id: string | null
          status: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_claims_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "bits_players"
            referencedColumns: ["public_id"]
          },
        ]
      }
      players: {
        Row: {
          achievements: string[] | null
          age: number | null
          avatar_url: string | null
          ball_brand: string | null
          bio: string | null
          created_at: string | null
          facebook: string | null
          favorite_center: string | null
          hand: string | null
          hometown: string | null
          id: string
          instagram: string | null
          name: string
          style: string | null
          team_id: string | null
          youtube: string | null
        }
        Insert: {
          achievements?: string[] | null
          age?: number | null
          avatar_url?: string | null
          ball_brand?: string | null
          bio?: string | null
          created_at?: string | null
          facebook?: string | null
          favorite_center?: string | null
          hand?: string | null
          hometown?: string | null
          id?: string
          instagram?: string | null
          name: string
          style?: string | null
          team_id?: string | null
          youtube?: string | null
        }
        Update: {
          achievements?: string[] | null
          age?: number | null
          avatar_url?: string | null
          ball_brand?: string | null
          bio?: string | null
          created_at?: string | null
          facebook?: string | null
          favorite_center?: string | null
          hand?: string | null
          hometown?: string | null
          id?: string
          instagram?: string | null
          name?: string
          style?: string | null
          team_id?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_shops: {
        Row: {
          accepts_gift_cards: boolean | null
          city: string | null
          created_at: string | null
          email: string | null
          ibpsia_certified: boolean | null
          id: number
          mobile: string | null
          name: string
          phone: string | null
          postal_code: string | null
          street_address: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accepts_gift_cards?: boolean | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ibpsia_certified?: boolean | null
          id: number
          mobile?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accepts_gift_cards?: boolean | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ibpsia_certified?: boolean | null
          id?: number
          mobile?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          year?: number
        }
        Relationships: []
      }
      team_event_reactions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_event_reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
        ]
      }
      team_events: {
        Row: {
          body: string | null
          captain_note: string | null
          created_at: string
          event_date: string
          event_type: string
          featured_player_id: string | null
          id: string
          is_hidden: boolean
          is_pinned: boolean
          match_id: string | null
          payload: Json
          team_id: string
          title: string
        }
        Insert: {
          body?: string | null
          captain_note?: string | null
          created_at?: string
          event_date: string
          event_type: string
          featured_player_id?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          match_id?: string | null
          payload?: Json
          team_id: string
          title: string
        }
        Update: {
          body?: string | null
          captain_note?: string | null
          created_at?: string
          event_date?: string
          event_type?: string
          featured_player_id?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          match_id?: string | null
          payload?: Json
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_events_featured_player_id_fkey"
            columns: ["featured_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string | null
          status: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_type: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_type?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_type?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sponsors: {
        Row: {
          created_at: string
          display_order: number
          id: string
          logo_url: string | null
          name: string
          tagline: string | null
          team_id: string
          tier: string
          website: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name: string
          tagline?: string | null
          team_id: string
          tier?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name?: string
          tagline?: string | null
          team_id?: string
          tier?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_sponsors_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_sponsors_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          accepting_sponsors: boolean
          city: string | null
          club: string
          club_slug: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          external_name: string | null
          facebook: string | null
          founded_year: number | null
          home_hall: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          slug: string | null
          team_path: string | null
          website: string | null
        }
        Insert: {
          accepting_sponsors?: boolean
          city?: string | null
          club: string
          club_slug?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          external_name?: string | null
          facebook?: string | null
          founded_year?: number | null
          home_hall?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          slug?: string | null
          team_path?: string | null
          website?: string | null
        }
        Update: {
          accepting_sponsors?: boolean
          city?: string | null
          club?: string
          club_slug?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          external_name?: string | null
          facebook?: string | null
          founded_year?: number | null
          home_hall?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          team_path?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      follow_counts: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          follower_count: number | null
        }
        Relationships: []
      }
      standings: {
        Row: {
          club: string | null
          league_id: string | null
          losses: number | null
          matches_played: number | null
          pin_diff: number | null
          pins_against: number | null
          pins_for: number | null
          team_id: string | null
          team_name: string | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bits_player_is_junior: { Args: { p_lic_nbr: string }; Returns: boolean }
      delete_anon_views: { Args: { p_anon_id: string }; Returns: undefined }
      fix_bits_home_team_assignment: { Args: never; Returns: number }
      get_anon_view_suggestions: {
        Args: { p_anon_id: string }
        Returns: {
          entity_id: string
          entity_type: string
          viewed_at: string
        }[]
      }
      get_discover_most_followed: {
        Args: { p_limit?: number }
        Returns: {
          club_name: string
          follower_count: number
          name: string
          public_id: string
        }[]
      }
      get_discover_recent_players: {
        Args: { p_limit?: number }
        Returns: {
          club_name: string
          hall_name: string
          last_date: string
          last_total: number
          name: string
          public_id: string
        }[]
      }
      get_discover_top_series: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          club_name: string
          hall_name: string
          match_date: string
          name: string
          public_id: string
          total: number
        }[]
      }
      get_division_rivals: {
        Args: { p_bits_team_id: number; p_limit?: number }
        Returns: {
          bits_team_id: number
          club_name: string
          name: string
        }[]
      }
      get_nearby_teams: {
        Args: { p_bits_team_id: number; p_limit?: number }
        Returns: {
          bits_team_id: number
          club_name: string
          name: string
          reason: string
        }[]
      }
      get_pending_claims: {
        Args: never
        Returns: {
          claim_id: string
          claimed_at: string
          club_name: string
          player_name: string
          public_id: string
        }[]
      }
      get_player_identity: {
        Args: { p_public_id: string }
        Returns: {
          club_name: string
          is_claimed: boolean
          is_junior: boolean
          licence_average: number
          licence_skill_lvl: number
          name: string
          public_id: string
        }[]
      }
      get_player_match_history: {
        Args: { p_public_id: string }
        Returns: {
          away_points: number
          division_name: string
          home_points: number
          is_home_team: boolean
          match_date: string
          opponent_name: string
          season_id: number
          series: number[]
          total_result: number
        }[]
      }
      get_player_percentile: { Args: { p_public_id: string }; Returns: number }
      get_regional_elitserien_teams: {
        Args: { p_bits_team_id: number }
        Returns: {
          bits_team_id: number
          club_name: string
          division_name: string
          name: string
        }[]
      }
      get_team_roster: {
        Args: { p_bits_team_id: number; p_limit?: number }
        Returns: {
          appearances: number
          licence_average: number
          name: string
          public_id: string
        }[]
      }
      get_user_season_matches: {
        Args: never
        Returns: {
          away_score: number
          away_team_name: string
          bits_match_id: number
          division_name: string
          hall_name: string
          home_score: number
          home_team_name: string
          is_finished: boolean
          is_personalized: boolean
          match_date: string
          round_id: number
        }[]
      }
      resolve_bits_player_lic_nbrs: { Args: never; Returns: number }
      resolve_bits_player_lic_nbrs_by_agreement: {
        Args: never
        Returns: number
      }
      resolve_bits_player_lic_nbrs_by_club: { Args: never; Returns: number }
      resolve_bits_team_id: {
        Args: { p_legacy_team_id: string }
        Returns: number
      }
      submit_player_claim: {
        Args: { p_lic_nbr: string; p_public_id: string }
        Returns: Json
      }
      team_current_division: {
        Args: { p_bits_team_id: number }
        Returns: {
          bits_division_id: number
          division_name: string
        }[]
      }
      update_claim_status: {
        Args: { p_claim_id: string; p_status: string }
        Returns: undefined
      }
      validate_and_redeem_invite_code: {
        Args: { p_code: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
