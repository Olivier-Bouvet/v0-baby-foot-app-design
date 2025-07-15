"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Users,
  User,
  TrendingUp,
  Target,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  Zap,
  Award,
  Crown,
  Medal,
  Star,
} from "lucide-react"
import {
  getPlayers,
  getMatches,
  createPlayer,
  createMatch,
  getPlayerStats,
  getDuoStats,
  deletePlayer,
  updatePlayer,
  deleteMatch,
  updateMatch,
  type Player,
  type Match,
} from "@/lib/database"
import { DeletePlayerModal, EditPlayerModal, EditMatchModal, DeleteMatchModal } from "@/components/admin-modals"
import { SimplePlayerSelect } from "@/components/simple-player-select"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function BabyfootApp() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eloRatings, setEloRatings] = useState<Record<string, number>>({})
  const [duoEloRatings, setDuoEloRatings] = useState<Record<string, number>>({})
  const [colorWinStats, setColorWinStats] = useState<{ redWins: number; blueWins: number; total: number }>({
    redWins: 0,
    blueWins: 0,
    total: 0,
  })
  const [totalGoals, setTotalGoals] = useState(0)

  // État du formulaire
  const [selectedPlayers, setSelectedPlayers] = useState<{
    teamA1: string
    teamA2: string
    teamB1: string
    teamB2: string
  }>({
    teamA1: "",
    teamA2: "",
    teamB1: "",
    teamB2: "",
  })

  const [scores, setScores] = useState({ teamA: "", teamB: "" })
  const [newPlayerNames, setNewPlayerNames] = useState<{
    teamA1: string
    teamA2: string
    teamB1: string
    teamB2: string
  }>({
    teamA1: "",
    teamA2: "",
    teamB1: "",
    teamB2: "",
  })

  // États pour les statistiques
  const [individualStats, setIndividualStats] = useState<any[]>([])
  const [duoStats, setDuoStats] = useState<any[]>([])

  // États pour les modals d'administration
  const [deletePlayerModal, setDeletePlayerModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false,
    player: null,
  })
  const [editPlayerModal, setEditPlayerModal] = useState<{ isOpen: boolean; player: Player | null }>({
    isOpen: false,
    player: null,
  })
  const [editMatchModal, setEditMatchModal] = useState<{ isOpen: boolean; match: Match | null }>({
    isOpen: false,
    match: null,
  })
  const [deleteMatchModal, setDeleteMatchModal] = useState<{ isOpen: boolean; match: Match | null }>({
    isOpen: false,
    match: null,
  })

  const { toast } = useToast()

  // Charger les données au démarrage
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [playersData, matchesData, playerStatsData, duoStatsData] = await Promise.all([
        getPlayers(),
        getMatches(),
        getPlayerStats(),
        getDuoStats(),
      ])

      setPlayers(playersData)
      setMatches(matchesData)
      setIndividualStats(playerStatsData)
      setDuoStats(duoStatsData)
      const elo = computeEloRatings(matchesData, playersData)
      setEloRatings(elo)
      const duoElo = computeDuoEloRatings(matchesData)
      setDuoEloRatings(duoElo)
      const redWins = matchesData.filter((m) => m.score_a > m.score_b).length
      const blueWins = matchesData.filter((m) => m.score_b > m.score_a).length
      const total = redWins + blueWins
      const goals = matchesData.reduce((sum, match) => sum + match.score_a + match.score_b, 0)
      setTotalGoals(goals)

      setColorWinStats({ redWins, blueWins, total })
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction Elo
  const computeEloRatings = (matches: Match[], players: Player[], k = 32) => {
    const ratings: Record<string, number> = {}
    players.forEach((p) => {
      ratings[p.name] = 1000
    })

    matches.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    matches.forEach((match) => {
      const teamA = [match.team_a_player_1, match.team_a_player_2]
      const teamB = [match.team_b_player_1, match.team_b_player_2]

      const teamAElo =
        0.75 * Math.max(ratings[teamA[0]], ratings[teamA[1]]) + 0.25 * Math.min(ratings[teamA[0]], ratings[teamA[1]])
      const teamBElo =
        0.75 * Math.max(ratings[teamB[0]], ratings[teamB[1]]) + 0.25 * Math.min(ratings[teamB[0]], ratings[teamB[1]])

      const expectedA = 1 / (1 + Math.pow(10, (teamBElo - teamAElo) / 400))
      const scoreA = match.score_a > match.score_b ? 1 : 0
      const deltaA = k * (scoreA - expectedA)

      ratings[teamA[0]] += deltaA
      ratings[teamA[1]] += deltaA
      ratings[teamB[0]] -= deltaA
      ratings[teamB[1]] -= deltaA
    })

    return ratings
  }

  // ELO DUO
  const computeDuoEloRatings = (matches: Match[], k = 32) => {
    const duoRatings: Record<string, number> = {}

    matches.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    matches.forEach((match) => {
      const teamA = [match.team_a_player_1, match.team_a_player_2].sort()
      const teamB = [match.team_b_player_1, match.team_b_player_2].sort()
      const keyA = teamA.join(" & ")
      const keyB = teamB.join(" & ")

      if (!(keyA in duoRatings)) duoRatings[keyA] = 1000
      if (!(keyB in duoRatings)) duoRatings[keyB] = 1000

      const eloA = duoRatings[keyA]
      const eloB = duoRatings[keyB]

      const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
      const scoreA = match.score_a > match.score_b ? 1 : 0
      const deltaA = k * (scoreA - expectedA)

      duoRatings[keyA] += deltaA
      duoRatings[keyB] -= deltaA
    })

    return duoRatings
  }

  // Fonctions d'administration
  const handleDeletePlayer = async (playerId: string) => {
    const success = await deletePlayer(playerId)
    if (success) {
      await loadData()
      toast({
        title: "Joueur supprimé",
        description: "Le joueur a été supprimé avec succès !",
        duration: 4000,
      })
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du joueur",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleEditPlayer = async (playerId: string, newName: string) => {
    const updatedPlayer = await updatePlayer(playerId, newName)
    if (updatedPlayer) {
      await loadData()
      toast({
        title: "Joueur modifié",
        description: "Le joueur a été modifié avec succès !",
        duration: 4000,
      })
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du joueur",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    const success = await deleteMatch(matchId)
    if (success) {
      await loadData()
      toast({
        title: "Match supprimé",
        description: "Le match a été supprimé avec succès !",
        duration: 4000,
      })
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du match",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleEditMatch = async (matchId: string, updatedMatch: any) => {
    const result = await updateMatch(matchId, updatedMatch)
    if (result) {
      await loadData()
      toast({
        title: "Match modifié",
        description: "Le match a été modifié avec succès !",
        duration: 4000,
      })
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du match",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const getPlayerName = (position: keyof typeof selectedPlayers): string => {
    return selectedPlayers[position] || newPlayerNames[position] || ""
  }

  const validateMatch = async () => {
    const teamAPlayer1 = getPlayerName("teamA1")
    const teamAPlayer2 = getPlayerName("teamA2")
    const teamBPlayer1 = getPlayerName("teamB1")
    const teamBPlayer2 = getPlayerName("teamB2")

    if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
      toast({
        title: "Joueurs manquants",
        description: "Veuillez sélectionner tous les joueurs",
        variant: "destructive",
        duration: 4000,
      })
      return
    }

    if (!scores.teamA || !scores.teamB) {
      toast({
        title: "Scores manquants",
        description: "Veuillez saisir les scores",
        variant: "destructive",
        duration: 4000,
      })
      return
    }

    // 🆕 Contrôle des doublons : un joueur ne peut pas jouer deux fois dans le même match
    const allSelectedPlayers = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2]
    const uniquePlayers = new Set(allSelectedPlayers)

    if (uniquePlayers.size !== allSelectedPlayers.length) {
      const duplicates = allSelectedPlayers.filter((player, index) => allSelectedPlayers.indexOf(player) !== index)
      toast({
        title: "Joueur en doublon",
        description: `Le joueur "${duplicates[0]}" ne peut pas jouer deux fois dans le même match`,
        variant: "destructive",
        duration: 4000,
      })
      return
    }

    try {
      // Créer les nouveaux joueurs s'ils n'existent pas
      const allPlayerNames = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2]
      const newPlayersToAdd = allPlayerNames.filter((name) => !players.some((p) => p.name === name))

      for (const playerName of newPlayersToAdd) {
        const newPlayer = await createPlayer(playerName)
        if (newPlayer) {
          setPlayers((prev) => [...prev, newPlayer])
        }
      }

      // Créer le nouveau match
      const newMatch = await createMatch({
        team_a_player_1: teamAPlayer1,
        team_a_player_2: teamAPlayer2,
        team_b_player_1: teamBPlayer1,
        team_b_player_2: teamBPlayer2,
        score_a: Number.parseInt(scores.teamA),
        score_b: Number.parseInt(scores.teamB),
      })

      if (newMatch) {
        // Recharger les données pour mettre à jour les statistiques
        await loadData()

        // Réinitialiser le formulaire
        setSelectedPlayers({
          teamA1: "",
          teamA2: "",
          teamB1: "",
          teamB2: "",
        })
        setNewPlayerNames({
          teamA1: "",
          teamA2: "",
          teamB1: "",
          teamB2: "",
        })
        setScores({ teamA: "", teamB: "" })

        toast({
          title: "Match enregistré",
          description: "Le match a été enregistré avec succès !",
          duration: 4000,
        })
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de l'enregistrement du match",
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du match",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Star className="h-4 w-4 text-gray-300" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full border-4 border-blue-200 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-8 p-4">
        {/* Header amélioré */}
        <div className="text-center py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Trophy className="h-12 w-12 text-yellow-500 drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                MyLegiFoot Tracker
              </h1>
            </div>
            <p className="text-gray-600 text-lg font-medium">Enregistrez vos matchs et suivez vos performances</p>

            {/* Stats rapides */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                <div className="text-sm text-gray-500">Joueurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
                <div className="text-sm text-gray-500">Matchs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{totalGoals}</div>
                <div className="text-sm text-gray-500">Buts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation principale améliorée */}
        <Tabs defaultValue="match" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <TabsTrigger
              value="match"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4" />
              Matchs
            </TabsTrigger>
            <TabsTrigger
              value="rankings"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4" />
              Classements
            </TabsTrigger>
          </TabsList>

          {/* Onglet Nouveau match amélioré */}
          <TabsContent value="match">
            <div className="space-y-8">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 animate-pulse"></div>
                  <CardTitle className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Target className="h-6 w-6" />
                    </div>
                    Nouveau match
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-12 lg:items-center">
                    {/* Équipe A - Gauche */}
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg">
                          <Users className="h-5 w-5" />
                          <span className="font-semibold">Équipe Rouge</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <SimplePlayerSelect
                          position="teamA1"
                          label="Joueur 1"
                          teamColor="text-red-600"
                          players={players}
                          selectedPlayer={selectedPlayers.teamA1}
                          newPlayerName={newPlayerNames.teamA1}
                          onPlayerSelect={(value) => setSelectedPlayers((prev) => ({ ...prev, teamA1: value }))}
                          onNewPlayerNameChange={(value) => setNewPlayerNames((prev) => ({ ...prev, teamA1: value }))}
                          onReset={() => {
                            setSelectedPlayers((prev) => ({ ...prev, teamA1: "" }))
                            setNewPlayerNames((prev) => ({ ...prev, teamA1: "" }))
                          }}
                        />
                        <SimplePlayerSelect
                          position="teamA2"
                          label="Joueur 2"
                          teamColor="text-red-600"
                          players={players}
                          selectedPlayer={selectedPlayers.teamA2}
                          newPlayerName={newPlayerNames.teamA2}
                          onPlayerSelect={(value) => setSelectedPlayers((prev) => ({ ...prev, teamA2: value }))}
                          onNewPlayerNameChange={(value) => setNewPlayerNames((prev) => ({ ...prev, teamA2: value }))}
                          onReset={() => {
                            setSelectedPlayers((prev) => ({ ...prev, teamA2: "" }))
                            setNewPlayerNames((prev) => ({ ...prev, teamA2: "" }))
                          }}
                        />
                      </div>
                    </div>

                    {/* Score - Centre amélioré */}
                    <div className="flex flex-col items-center space-y-6 order-last lg:order-none">
                      <div className="text-center w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-full shadow-lg mb-6">
                          <Zap className="h-5 w-5" />
                          <span className="font-semibold">Score</span>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          {/* Score Équipe A */}
                          <div className="text-center flex-1 max-w-[140px]">
                            <Label className="text-sm font-semibold text-red-600 mb-3 block">Rouge</Label>
                            <select
                              value={scores.teamA}
                              onChange={(e) => setScores((prev) => ({ ...prev, teamA: e.target.value }))}
                              className="w-full h-16 text-3xl font-bold text-center border-3 border-red-300 rounded-xl bg-gradient-to-b from-white to-red-50 hover:border-red-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-200 shadow-lg"
                            >
                              <option value="">-</option>
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={i.toString()}>
                                  {i}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* VS */}
                          <div className="flex flex-col items-center px-4">
                            <div className="text-4xl font-bold text-gray-400 mb-2">VS</div>
                            <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
                          </div>

                          {/* Score Équipe B */}
                          <div className="text-center flex-1 max-w-[140px]">
                            <Label className="text-sm font-semibold text-blue-600 mb-3 block">Bleue</Label>
                            <select
                              value={scores.teamB}
                              onChange={(e) => setScores((prev) => ({ ...prev, teamB: e.target.value }))}
                              className="w-full h-16 text-3xl font-bold text-center border-3 border-blue-300 rounded-xl bg-gradient-to-b from-white to-blue-50 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg"
                            >
                              <option value="">-</option>
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={i.toString()}>
                                  {i}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Affichage du score sélectionné */}
                        {(scores.teamA || scores.teamB) && (
                          <div className="mt-6">
                            <Badge
                              variant="secondary"
                              className="text-xl px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 shadow-lg"
                            >
                              {scores.teamA || "0"} - {scores.teamB || "0"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Équipe B - Droite */}
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg">
                          <Users className="h-5 w-5" />
                          <span className="font-semibold">Équipe Bleue</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <SimplePlayerSelect
                          position="teamB1"
                          label="Joueur 1"
                          teamColor="text-blue-600"
                          players={players}
                          selectedPlayer={selectedPlayers.teamB1}
                          newPlayerName={newPlayerNames.teamB1}
                          onPlayerSelect={(value) => setSelectedPlayers((prev) => ({ ...prev, teamB1: value }))}
                          onNewPlayerNameChange={(value) => setNewPlayerNames((prev) => ({ ...prev, teamB1: value }))}
                          onReset={() => {
                            setSelectedPlayers((prev) => ({ ...prev, teamB1: "" }))
                            setNewPlayerNames((prev) => ({ ...prev, teamB1: "" }))
                          }}
                        />
                        <SimplePlayerSelect
                          position="teamB2"
                          label="Joueur 2"
                          teamColor="text-blue-600"
                          players={players}
                          selectedPlayer={selectedPlayers.teamB2}
                          newPlayerName={newPlayerNames.teamB2}
                          onPlayerSelect={(value) => setSelectedPlayers((prev) => ({ ...prev, teamB2: value }))}
                          onNewPlayerNameChange={(value) => setNewPlayerNames((prev) => ({ ...prev, teamB2: value }))}
                          onReset={() => {
                            setSelectedPlayers((prev) => ({ ...prev, teamB2: "" }))
                            setNewPlayerNames((prev) => ({ ...prev, teamB2: "" }))
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 text-center">
                    <Button
                      onClick={validateMatch}
                      disabled={submitting}
                      size="lg"
                      className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-purple-600 hover:to-blue-600 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Trophy className="mr-3 h-5 w-5" />
                          Valider le match
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Historique des matchs amélioré */}
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
                  <CardTitle className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Calendar className="h-6 w-6" />
                    </div>
                    Historique des matchs ({matches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-4 font-bold text-gray-700">Équipe rouge</th>
                          <th className="text-center p-4 font-bold text-gray-700 min-w-[100px]">Score</th>
                          <th className="text-left p-4 font-bold text-gray-700">Équipe bleue</th>
                          <th className="text-center p-4 font-bold text-gray-700 min-w-[120px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...matches]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 20)
                          .map((match, index) => (
                            <tr
                              key={match.id}
                              className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="text-sm font-medium">
                                    <div className="text-red-600 break-words">
                                      <span className="block sm:inline font-semibold">{match.team_a_player_1}</span>
                                      <span className="hidden sm:inline text-gray-400"> & </span>
                                      <span className="block sm:inline font-semibold">{match.team_a_player_2}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Badge
                                    variant={match.score_a > match.score_b ? "default" : "secondary"}
                                    className={`text-lg px-3 py-1 font-bold ${
                                      match.score_a > match.score_b
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {match.score_a}
                                  </Badge>
                                  <span className="text-lg font-bold text-gray-400">-</span>
                                  <Badge
                                    variant={match.score_b > match.score_a ? "default" : "secondary"}
                                    className={`text-lg px-3 py-1 font-bold ${
                                      match.score_b > match.score_a
                                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {match.score_b}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <div className="text-sm font-medium">
                                    <div className="text-blue-600 break-words">
                                      <span className="block sm:inline font-semibold">{match.team_b_player_1}</span>
                                      <span className="hidden sm:inline text-gray-400"> & </span>
                                      <span className="block sm:inline font-semibold">{match.team_b_player_2}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditMatchModal({ isOpen: true, match })}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteMatchModal({ isOpen: true, match })}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-8 w-8 p-0 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {matches.length > 20 && (
                    <p className="text-center text-gray-500 mt-6 text-sm bg-gray-50 py-3 rounded-lg">
                      Affichage des 20 matchs les plus récents sur {matches.length} au total
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques couleurs améliorées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-red-50 to-red-100">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="font-semibold text-red-700">Victoires Rouge</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {((colorWinStats.redWins / colorWinStats.total) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-red-500">{colorWinStats.redWins} victoires</div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-blue-700">Victoires Bleue</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {((colorWinStats.blueWins / colorWinStats.total) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-500">{colorWinStats.blueWins} victoires</div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700">Total Buts</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{totalGoals}</div>
                    <div className="text-sm text-green-500">buts marqués</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Classements amélioré */}
          <TabsContent value="rankings">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 animate-pulse"></div>
                <CardTitle className="flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  Classements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs defaultValue="individual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                    <TabsTrigger
                      value="individual"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                    >
                      <User className="h-4 w-4" />
                      Classement individuel
                    </TabsTrigger>
                    <TabsTrigger
                      value="duo"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      Classement par duo
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="individual">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-4 font-bold text-gray-700">Rang</th>
                            <th className="text-left p-4 font-bold text-gray-700">Joueur</th>
                            <th className="text-center p-4 font-bold text-gray-700">Matchs</th>
                            <th className="text-center p-4 font-bold text-gray-700">V</th>
                            <th className="text-center p-4 font-bold text-gray-700">D</th>
                            <th className="text-center p-4 font-bold text-gray-700">%</th>
                            <th className="text-center p-4 font-bold text-gray-700">ELO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {individualStats
                            .sort((a, b) => {
                              const eloA = eloRatings[a.name] ?? 1000
                              const eloB = eloRatings[b.name] ?? 1000

                              if (a.matches < 10 && b.matches >= 10) return 1
                              if (a.matches >= 10 && b.matches < 10) return -1

                              return eloB - eloA
                            })
                            .map((stat, index) => {
                              const elo = eloRatings[stat.name]
                              const isProvisoire = stat.matches < 10

                              return (
                                <tr
                                  key={stat.name}
                                  className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {getRankIcon(index)}
                                      <Badge
                                        variant={index < 3 ? "default" : "secondary"}
                                        className={`text-sm font-bold px-3 py-1 ${
                                          index === 0
                                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg"
                                            : index === 1
                                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg"
                                              : index === 2
                                                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                      >
                                        #{index + 1}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-4 font-semibold text-gray-800 break-words">{stat.name}</td>
                                  <td className="p-4 text-center font-medium">{stat.matches}</td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                      {stat.wins}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                      {stat.losses}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                                      {stat.matches > 0 ? ((stat.wins / stat.matches) * 100).toFixed(1) + "%" : "-"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    {isProvisoire ? (
                                      <span className="text-gray-400 italic text-sm bg-gray-100 px-2 py-1 rounded-full">
                                        Min 10
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-sm font-bold shadow-lg">
                                        {Math.round(elo ?? 1000)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="duo">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-4 font-bold text-gray-700">Rang</th>
                            <th className="text-left p-4 font-bold text-gray-700">Duo</th>
                            <th className="text-center p-4 font-bold text-gray-700">Matchs</th>
                            <th className="text-center p-4 font-bold text-gray-700">V</th>
                            <th className="text-center p-4 font-bold text-gray-700">D</th>
                            <th className="text-center p-4 font-bold text-gray-700">%</th>
                            <th className="text-center p-4 font-bold text-gray-700">ELO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {duoStats
                            .sort((a, b) => {
                              const keyA = a.players.slice().sort().join(" & ")
                              const keyB = b.players.slice().sort().join(" & ")
                              const eloA = duoEloRatings[keyA] ?? 1000
                              const eloB = duoEloRatings[keyB] ?? 1000

                              if (a.matches < 5 && b.matches >= 5) return 1
                              if (a.matches >= 5 && b.matches < 5) return -1

                              return eloB - eloA
                            })
                            .map((stat, index) => {
                              const key = stat.players.slice().sort().join(" & ")
                              const elo = duoEloRatings[key] ?? 1000
                              const isProvisoire = stat.matches < 5

                              return (
                                <tr
                                  key={key}
                                  className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-pink-50 hover:to-red-50 transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {getRankIcon(index)}
                                      <Badge
                                        variant={index < 3 && !isProvisoire ? "default" : "secondary"}
                                        className={`text-sm font-bold px-3 py-1 ${
                                          index === 0 && !isProvisoire
                                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg"
                                            : index === 1 && !isProvisoire
                                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg"
                                              : index === 2 && !isProvisoire
                                                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                      >
                                        #{index + 1}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-4 font-semibold text-gray-800 break-words">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-gray-500" />
                                      <span>
                                        <span className="block sm:inline">{stat.players[0]}</span>
                                        <span className="hidden sm:inline text-gray-400"> & </span>
                                        <span className="block sm:inline">{stat.players[1]}</span>
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center font-medium">{stat.matches}</td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                      {stat.wins}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                      {stat.losses}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                                      {stat.matches > 0 ? ((stat.wins / stat.matches) * 100).toFixed(1) + "%" : "-"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    {isProvisoire ? (
                                      <span className="text-gray-400 italic text-sm bg-gray-100 px-2 py-1 rounded-full">
                                        Min 5
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-sm font-bold shadow-lg">
                                        {Math.round(elo)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals d'administration */}
        <DeletePlayerModal
          player={deletePlayerModal.player}
          isOpen={deletePlayerModal.isOpen}
          onClose={() => setDeletePlayerModal({ isOpen: false, player: null })}
          onConfirm={handleDeletePlayer}
        />

        <EditPlayerModal
          player={editPlayerModal.player}
          isOpen={editPlayerModal.isOpen}
          onClose={() => setEditPlayerModal({ isOpen: false, player: null })}
          onConfirm={handleEditPlayer}
        />

        <EditMatchModal
          match={editMatchModal.match}
          players={players}
          isOpen={editMatchModal.isOpen}
          onClose={() => setEditMatchModal({ isOpen: false, match: null })}
          onConfirm={handleEditMatch}
        />

        <DeleteMatchModal
          match={deleteMatchModal.match}
          isOpen={deleteMatchModal.isOpen}
          onClose={() => setDeleteMatchModal({ isOpen: false, match: null })}
          onConfirm={handleDeleteMatch}
        />

        {/* Toaster pour les notifications */}
        <Toaster />
      </div>
    </div>
  )
}
