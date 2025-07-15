"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Plus, X, ChevronDown } from "lucide-react"

interface SimplePlayerSelectProps {
  position: string
  label: string
  teamColor: string
  players: Array<{ id: string; name: string }>
  selectedPlayer: string
  newPlayerName: string
  onPlayerSelect: (value: string) => void
  onNewPlayerNameChange: (value: string) => void
  onReset: () => void
}

export function SimplePlayerSelect({
  position,
  label,
  teamColor,
  players,
  selectedPlayer,
  newPlayerName,
  onPlayerSelect,
  onNewPlayerNameChange,
  onReset,
}: SimplePlayerSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isNewPlayerMode, setIsNewPlayerMode] = useState(false)

  console.log(`🎯 SimplePlayerSelect ${position}:`, {
    selectedPlayer,
    newPlayerName,
    isNewPlayerMode,
    showDropdown,
  })

  const handlePlayerClick = (playerName: string) => {
    console.log(`👤 Joueur sélectionné: ${playerName}`)
    onPlayerSelect(playerName)
    setShowDropdown(false)
    setIsNewPlayerMode(false)
  }

  const handleNewPlayerClick = () => {
    console.log(`➕ Mode nouveau joueur activé pour ${position}`)
    setIsNewPlayerMode(true)
    setShowDropdown(false)
    onPlayerSelect("")
  }

  const handleReset = () => {
    console.log(`🔄 Reset pour ${position}`)
    setIsNewPlayerMode(false)
    setShowDropdown(false)
    onReset()
  }

  // État initial : rien de sélectionné
  if (!selectedPlayer && !newPlayerName && !isNewPlayerMode) {
    return (
      <div className="space-y-3">
        <Label className={`text-sm font-semibold ${teamColor} flex items-center gap-2`}>
          <User className="h-4 w-4" />
          {label}
        </Label>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between h-12 bg-white/80 backdrop-blur-sm border-2 hover:border-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => {
              console.log(`🔽 Ouverture dropdown pour ${position}`)
              setShowDropdown(!showDropdown)
            }}
          >
            <span className="text-gray-500">Sélectionner un joueur</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-auto backdrop-blur-sm">
              {players.map((player) => (
                <button
                  key={player.id}
                  className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 flex items-center gap-3"
                  onClick={() => handlePlayerClick(player.name)}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{player.name}</span>
                </button>
              ))}
              <button
                className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 font-semibold text-blue-600 transition-all duration-200 flex items-center gap-3"
                onClick={handleNewPlayerClick}
              >
                <Plus className="h-4 w-4" />
                Nouveau joueur
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mode nouveau joueur
  if (isNewPlayerMode || (!selectedPlayer && newPlayerName !== "")) {
    return (
      <div className="space-y-3">
        <Label className={`text-sm font-semibold ${teamColor} flex items-center gap-2`}>
          <Plus className="h-4 w-4" />
          {label} (nouveau)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nom du nouveau joueur"
            value={newPlayerName}
            onChange={(e) => {
              console.log(`✏️ Saisie: ${e.target.value}`)
              onNewPlayerNameChange(e.target.value)
            }}
            className="flex-1 h-12 bg-white/80 backdrop-blur-sm border-2 focus:border-blue-400 transition-all duration-200 shadow-lg"
            autoFocus
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-12 px-3 hover:bg-red-50 hover:border-red-300 transition-colors bg-transparent"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    )
  }

  // Joueur sélectionné
  return (
    <div className="space-y-3">
      <Label className={`text-sm font-semibold ${teamColor} flex items-center gap-2`}>
        <User className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="flex-1 justify-center py-3 px-4 text-base font-semibold bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 shadow-lg"
        >
          <User className="h-4 w-4 mr-2 text-gray-500" />
          {selectedPlayer}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-12 px-3 hover:bg-blue-50 hover:border-blue-300 transition-colors bg-transparent"
        >
          <X className="h-4 w-4 text-blue-500" />
        </Button>
      </div>
    </div>
  )
}
