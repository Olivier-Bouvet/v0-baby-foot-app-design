"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, User, TrendingUp, Target, Loader2, Settings, Edit, Trash2, Calendar } from "lucide-react"
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
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction Elo
  const computeEloRatings = (matches: Match[], players: Player[], k = 32) => {
  const ratings: Record<string, number> = {}
  players.forEach(p => { ratings[p.name] = 1000 })

  matches.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  matches.forEach(match => {
    const teamA = [match.team_a_player_1, match.team_a_player_2]
    const teamB = [match.team_b_player_1, match.team_b_player_2]

    const teamAElo = (ratings[teamA[0]] + ratings[teamA[1]]) / 2
    const teamBElo = (ratings[teamB[0]] + ratings[teamB[1]]) / 2

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">Baby-foot Tracker</h1>
          </div>
          <p className="text-gray-600">Enregistrez vos matchs et suivez vos performances</p>
        </div>

        {/* Navigation principale */}
        <Tabs defaultValue="match" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="match" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Matchs
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Classements
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Administration
            </TabsTrigger>
          </TabsList>

          {/* Onglet Nouveau match */}
          <TabsContent value="match" >
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Nouveau match
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-8 items-center">
                  {/* Équipe A - Gauche */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-600 flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Équipe rouge
                    </h3>
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

                  {/* Score - Centre */}
                  <div className="flex flex-col items-center space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Score</h3>
                      <div className="flex items-center justify-center gap-4">
                        {/* Score Équipe A */}
                        <div className="text-center">
                          <Label className="text-sm font-medium text-red-600 mb-2 block">Équipe rouge</Label>
                          <select
                            value={scores.teamA}
                            onChange={(e) => setScores((prev) => ({ ...prev, teamA: e.target.value }))}
                            className="w-16 h-16 text-2xl font-bold text-center border-2 border-red-300 rounded-lg bg-white hover:border-red-400 focus:border-red-500 focus:outline-none"
                          >
                            <option value="">-</option>
                            {Array.from({ length: 11 }, (_, i) => (
                              <option key={i} value={i.toString()}>
                                {i}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Trait d'union */}
                        <div className="text-4xl font-bold text-gray-400 px-4">-</div>

                        {/* Score Équipe B */}
                        <div className="text-center">
                          <Label className="text-sm font-medium text-blue-600 mb-2 block">Équipe bleue</Label>
                          <select
                            value={scores.teamB}
                            onChange={(e) => setScores((prev) => ({ ...prev, teamB: e.target.value }))}
                            className="w-16 h-16 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
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
                        <div className="mt-4">
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            {scores.teamA || "0"} - {scores.teamB || "0"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Équipe B - Droite */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600 flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Équipe bleue
                    </h3>
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

                <div className="mt-8 text-center">
                  <Button
                    onClick={validateMatch}
                    disabled={submitting}
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white px-8 py-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Valider le match"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

          {/* Gestion des matchs */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historique des matchs ({matches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-3 font-semibold">Équipe rouge</th>
                          <th className="text-center p-3 font-semibold">Score</th>
                          <th className="text-left p-3 font-semibold">Équipe bleue</th>
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.slice(0, 20).map((match) => (
                          <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-medium text-red-600">
                                  {match.team_a_player_1} & {match.team_a_player_2}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={match.score_a > match.score_b ? "default" : "secondary"} className="mr-1">
                                {match.score_a}
                              </Badge>
                              -
                              <Badge variant={match.score_b > match.score_a ? "default" : "secondary"} className="ml-1">
                                {match.score_b}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-medium text-blue-600">
                                  {match.team_b_player_1} & {match.team_b_player_2}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditMatchModal({ isOpen: true, match })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteMatchModal({ isOpen: true, match })}
                                  className="text-red-600 hover:text-red-700"
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
                    <p className="text-center text-gray-500 mt-4">
                      Affichage des 20 matchs les plus récents sur {matches.length} au total
                    </p>
                  )}
                </CardContent>
              </Card>
         
            </div>
           </TabsContent>
       

          {/* Onglet Classements */}
          <TabsContent value="rankings">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Classements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="individual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="individual" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Classement individuel
                    </TabsTrigger>
                    <TabsTrigger value="duo" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Classement par duo
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="individual">
                    <Tabs defaultValue="score" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="score">Nombre de victoires</TabsTrigger>
                        <TabsTrigger value="ratio">Ratio V/D</TabsTrigger>
                      </TabsList>

                      <TabsContent value="score">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left p-3 font-semibold">Rang</th>
                                <th className="text-left p-3 font-semibold">Joueur</th>
                                <th className="text-center p-3 font-semibold">Matchs</th>
                                <th className="text-center p-3 font-semibold">Victoires</th>
                                <th className="text-center p-3 font-semibold">Défaites</th>
                               <th className="text-center p-3 font-semibold">
                                <Tooltip>
                                  <TooltipTrigger>ELO</TooltipTrigger>
                                  <TooltipContent>
                                    Classement basé sur la difficulté de l'adversaire, recalculé à chaque match.
                                  </TooltipContent>
                                </Tooltip>
                              </th>
                              </tr>
                            </thead>
                            <tbody>
                              {individualStats
                                .sort((a, b) => b.totalScore - a.totalScore)
                                .map((stat, index) => (
                                  <tr key={stat.name} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3">
                                      <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </td>
                                    <td className="p-3 font-medium">{stat.name}</td>
                                    <td className="p-3 text-center">{stat.matches}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{stat.wins}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{stat.losses}</td>
                                    <td className="p-3 text-center font-bold text-blue-600">{stat.totalScore}</td>
                                    <td className="p-3 text-center font-bold text-yellow-600">
                                    {Math.round(eloRatings[stat.name] ?? 1000)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      <TabsContent value="ratio">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left p-3 font-semibold">Rang</th>
                                <th className="text-left p-3 font-semibold">Joueur</th>
                                <th className="text-center p-3 font-semibold">Matchs</th>
                                <th className="text-center p-3 font-semibold">Victoires</th>
                                <th className="text-center p-3 font-semibold">Défaites</th>
                                <th className="text-center p-3 font-semibold">Ratio V/D</th>
                              </tr>
                            </thead>
                            <tbody>
                              {individualStats
                                .sort((a, b) => b.ratio - a.ratio)
                                .map((stat, index) => (
                                  <tr key={stat.name} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3">
                                      <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </td>
                                    <td className="p-3 font-medium">{stat.name}</td>
                                    <td className="p-3 text-center">{stat.matches}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{stat.wins}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{stat.losses}</td>
                                    <td className="p-3 text-center font-bold text-purple-600">
                                      {stat.ratio.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>

                  <TabsContent value="duo">
                    <Tabs defaultValue="score" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="score">Nombre de victoires</TabsTrigger>
                        <TabsTrigger value="ratio">Ratio V/D</TabsTrigger>
                      </TabsList>

                      <TabsContent value="score">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left p-3 font-semibold">Rang</th>
                                <th className="text-left p-3 font-semibold">Duo</th>
                                <th className="text-center p-3 font-semibold">Matchs</th>
                                <th className="text-center p-3 font-semibold">Victoires</th>
                                <th className="text-center p-3 font-semibold">Défaites</th>
                                <th className="text-center p-3 font-semibold">Victoires cumulées</th>
                              </tr>
                            </thead>
                            <tbody>
                              {duoStats
                                .sort((a, b) => b.totalScore - a.totalScore)
                                .map((stat, index) => (
                                  <tr
                                    key={stat.players.join("-")}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                  >
                                    <td className="p-3">
                                      <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </td>
                                    <td className="p-3 font-medium">
                                      {stat.players[0]} & {stat.players[1]}
                                    </td>
                                    <td className="p-3 text-center">{stat.matches}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{stat.wins}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{stat.losses}</td>
                                    <td className="p-3 text-center font-bold text-blue-600">{stat.totalScore}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      <TabsContent value="ratio">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left p-3 font-semibold">Rang</th>
                                <th className="text-left p-3 font-semibold">Duo</th>
                                <th className="text-center p-3 font-semibold">Matchs</th>
                                <th className="text-center p-3 font-semibold">Victoires</th>
                                <th className="text-center p-3 font-semibold">Défaites</th>
                                <th className="text-center p-3 font-semibold">Ratio V/D</th>
                              </tr>
                            </thead>
                            <tbody>
                              {duoStats
                                .sort((a, b) => b.ratio - a.ratio)
                                .map((stat, index) => (
                                  <tr
                                    key={stat.players.join("-")}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                  >
                                    <td className="p-3">
                                      <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </td>
                                    <td className="p-3 font-medium">
                                      {stat.players[0]} & {stat.players[1]}
                                    </td>
                                    <td className="p-3 text-center">{stat.matches}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{stat.wins}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{stat.losses}</td>
                                    <td className="p-3 text-center font-bold text-purple-600">
                                      {stat.ratio.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🆕 Onglet Administration */}
          <TabsContent value="admin">
            <div className="space-y-6">
              {/* Gestion des joueurs */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Gestion des joueurs ({players.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-3 font-semibold">Nom</th>
                          <th className="text-center p-3 font-semibold">Date de création</th>
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player) => (
                          <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3 font-medium">{player.name}</td>
                            <td className="p-3 text-center text-gray-600">
                              {new Date(player.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditPlayerModal({ isOpen: true, player })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletePlayerModal({ isOpen: true, player })}
                                  className="text-red-600 hover:text-red-700"
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
                </CardContent>
              </Card>

            </div>
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
