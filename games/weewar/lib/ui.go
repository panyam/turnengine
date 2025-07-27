package weewar

import (
	"fmt"
	"maps"
	"slices"

	v1 "github.com/panyam/turnengine/games/weewar/gen/go/weewar/v1"
)

// =============================================================================
// UI Helper Methods for WASM/Web Interface
// =============================================================================
// This file contains wrapper methods that combine core game functionality
// into convenient forms for UI consumption, particularly for the WASM bridge.
// These methods reuse existing types (TileOption, CombatResult, AxialCoord)
// and delegate to core Game methods for all logic and validation.

// SelectUnit returns unit at position with movement and attack options for UI
// Combines existing GetUnitAt, GetUnitMovementOptions, and GetUnitAttackOptions
// Returns data needed for UI highlighting and interaction
func (g *Game) SelectUnit(coord AxialCoord) (unit *v1.Unit, movable []TileOption, attackable []AxialCoord, err error) {
	// Get unit at position using existing method
	unit = g.World.UnitAt(coord)
	if unit == nil {
		return nil, nil, nil, fmt.Errorf("no unit at position %v", coord)
	}

	// Check if it's the current player's unit
	if unit.Player != g.CurrentPlayer {
		return nil, nil, nil, fmt.Errorf("unit belongs to player %d, current player is %d", unit.Player, g.CurrentPlayer)
	}

	// Get movement options using existing method from moves.go
	movable, err = g.GetUnitMovementOptions(unit)
	if err != nil {
		return unit, nil, nil, fmt.Errorf("failed to get movement options: %w", err)
	}

	// Get attack options using existing method from moves.go
	attackable, err = g.GetUnitAttackOptions(unit)
	if err != nil {
		return unit, movable, nil, fmt.Errorf("failed to get attack options: %w", err)
	}

	return unit, movable, attackable, nil
}

// GetTerrainStatsAt returns detailed terrain information for UI display
// Combines terrain data from rules engine with world-specific context
func (g *Game) GetTerrainStatsAt(q, r int) (map[string]any, error) {
	coord := AxialCoord{Q: q, R: r}

	// Get tile at position
	tile := g.World.TileAt(coord)
	if tile == nil {
		return nil, fmt.Errorf("no tile at position (%d,%d)", q, r)
	}

	// Get terrain data from game's rules engine
	terrainData, err := g.GetRulesEngine().GetTerrainData(tile.TileType)
	if err != nil {
		return nil, fmt.Errorf("failed to get terrain data for type %d: %w", tile.TileType, err)
	}

	// Get unit at this position (if any)
	unit := g.World.UnitAt(coord)

	// Calculate movement cost for default unit type (Infantry = 1)
	movementCost, err := g.GetRulesEngine().getUnitTerrainCost(1, tile.TileType)
	if err != nil {
		movementCost = terrainData.BaseMoveCost // fallback to base cost
	}

	result := map[string]any{
		"q":            q,
		"r":            r,
		"tileType":     tile.TileType,
		"name":         terrainData.Name,
		"description":  fmt.Sprintf("%s terrain", terrainData.Name),
		"movementCost": movementCost,
		"defenseBonus": terrainData.DefenseBonus,
		"player":       tile.Player,
	}

	// Add unit information if present
	if unit != nil {
		result["hasUnit"] = true
		result["unitType"] = unit.UnitType
		result["unitPlayer"] = unit.Player
	} else {
		result["hasUnit"] = false
	}

	return result, nil
}

// CanSelectUnit checks if a unit at the given position can be selected by current player
func (g *Game) CanSelectUnit(q, r int) bool {
	coord := AxialCoord{Q: q, R: r}
	unit := g.World.UnitAt(coord)

	// Must have a unit and it must belong to current player
	return unit != nil && unit.Player == g.CurrentPlayer
}

// GetTileInfo returns basic tile information for UI
func (g *Game) GetTileInfo(q, r int) (map[string]any, error) {
	coord := AxialCoord{Q: q, R: r}

	// Get tile at position
	tile := g.World.TileAt(coord)
	if tile == nil {
		return nil, fmt.Errorf("no tile at position (%d,%d)", q, r)
	}

	// Get basic terrain name from game's rules engine
	terrainData, err := g.GetRulesEngine().GetTerrainData(tile.TileType)
	terrainName := "Unknown"
	if err == nil {
		terrainName = terrainData.Name
	}

	// Check for unit at this position
	unit := g.World.UnitAt(coord)

	result := map[string]any{
		"q":           q,
		"r":           r,
		"tileType":    tile.TileType,
		"terrainName": terrainName,
		"player":      tile.Player,
		"hasUnit":     unit != nil,
	}

	if unit != nil {
		result["unitType"] = unit.UnitType
		result["unitPlayer"] = unit.Player
	}

	return result, nil
}

// GetGameStateForUI returns complete game state for web UI consumption
// Uses existing Game fields and methods - all already JSON-tagged
// Provides everything needed for UI state management and display
func (g *Game) GetGameStateForUI() map[string]any {
	// Convert unitsByCoord to JSON-serializable format
	// Since JSON object keys must be strings, we'll convert AxialCoord to string format
	allPlayers := map[int32]bool{}
	allUnits := make(map[string]*v1.Unit)
	for coord, unit := range g.World.unitsByCoord {
		coordKey := fmt.Sprintf("%d,%d", coord.Q, coord.R) // e.g., "0,1" for Q=0, R=1
		allUnits[coordKey] = unit
		allPlayers[unit.Player] = true
	}

	out := map[string]any{
		"currentPlayer": g.CurrentPlayer, // Current player's turn
		"turnCounter":   g.TurnCounter,   // Turn number
		"status":        g.Status,        // GameStatus (playing/ended/paused)
		"allUnits":      allUnits,        // All units on map (coord string -> unit)
		"players":       slices.Collect(maps.Values(allPlayers)),
		"teams":         g.Teams, // Team information
		"mapSize": map[string]int{ //  dimensions
			"rows": g.World.NumRows(),
			"cols": g.World.NumCols(),
		},
		"winner":      g.winner, // Winner if game ended
		"hasPlayers":  len(allPlayers) > 0,
		"playerCount": len(allPlayers),
		"unitCount":   len(allUnits),
		"hasUnits":    len(allUnits) > 0,
		"hasWinner":   g.hasWinner, // Whether game has ended
	}
	// fmt.Print("GameStateForUI: ", out)
	/** sample
	  GameData for Validation:  {
	    allUnits: {
	      '0,0': { player: 1, q: 0, r: 0, unit_type: 1 },
	      '2,2': { player: 2, q: 2, r: 2, unit_type: 1 }
	    },
	    currentPlayer: 1,
	    hasWinner: false,
	    mapSize: { cols: 1, rows: 1 },
	    players: null,
	    status: 0,
	    teams: null,
	    turnCounter: 1,
	    winner: -1
	  }
	*/
	return out
}
