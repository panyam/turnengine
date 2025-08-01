package weewar

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"

	v1 "github.com/panyam/turnengine/games/weewar/gen/go/weewar/v1"
	"google.golang.org/protobuf/encoding/protojson"
)

// LoadRulesEngineFromFile loads a RulesEngine from a canonical rules JSON file
func LoadRulesEngineFromFile(filename string) (*RulesEngine, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read rules file %s: %w", filename, err)
	}

	return LoadRulesEngineFromJSON(data)
}

// LoadRulesEngineFromJSON loads a RulesEngine from JSON bytes with proper proto field handling
func LoadRulesEngineFromJSON(jsonData []byte) (*RulesEngine, error) {
	// Parse the raw JSON structure first
	var rawData map[string]interface{}
	if err := json.Unmarshal(jsonData, &rawData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal raw JSON: %w", err)
	}

	rulesEngine := &RulesEngine{
		Units:    make(map[int32]*v1.UnitDefinition),
		Terrains: make(map[int32]*v1.TerrainDefinition),
	}

	// Load terrains using protojson for proper field handling
	if terrainData, ok := rawData["terrains"].(map[string]interface{}); ok {
		for idStr, terrainJson := range terrainData {
			id, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				continue // Skip invalid IDs
			}

			// Marshal back to JSON bytes for protojson.Unmarshal
			terrainBytes, err := json.Marshal(terrainJson)
			if err != nil {
				continue
			}

			terrain := &v1.TerrainDefinition{}
			if err := protojson.Unmarshal(terrainBytes, terrain); err != nil {
				return nil, fmt.Errorf("failed to unmarshal terrain %d: %w", id, err)
			}

			rulesEngine.Terrains[int32(id)] = terrain
		}
	}

	// Load units using protojson for proper field handling
	if unitData, ok := rawData["units"].(map[string]interface{}); ok {
		for idStr, unitJson := range unitData {
			id, err := strconv.ParseInt(idStr, 10, 32)
			if err != nil {
				continue // Skip invalid IDs
			}

			// Marshal back to JSON bytes for protojson.Unmarshal
			unitBytes, err := json.Marshal(unitJson)
			if err != nil {
				continue
			}

			unit := &v1.UnitDefinition{}
			if err := protojson.Unmarshal(unitBytes, unit); err != nil {
				return nil, fmt.Errorf("failed to unmarshal unit %d: %w", id, err)
			}

			rulesEngine.Units[int32(id)] = unit
		}
	}

	// Load other fields using regular JSON marshaling
	if movementMatrixData, ok := rawData["movementMatrix"]; ok {
		movementBytes, _ := json.Marshal(movementMatrixData)
		movementMatrix := &v1.MovementMatrix{}
		if err := protojson.Unmarshal(movementBytes, movementMatrix); err == nil {
			rulesEngine.MovementMatrix = movementMatrix
		}
	}

	if attackMatrixData, ok := rawData["attackMatrix"]; ok {
		attackBytes, _ := json.Marshal(attackMatrixData)
		attackMatrix := &AttackMatrix{}
		if err := json.Unmarshal(attackBytes, attackMatrix); err == nil {
			rulesEngine.AttackMatrix = attackMatrix
		}
	}

	// Validate the loaded data
	if err := rulesEngine.ValidateRules(); err != nil {
		return nil, fmt.Errorf("invalid rules data: %w", err)
	}

	return rulesEngine, nil
}

// LoadRulesEngineFromLegacy loads a RulesEngine by converting from legacy weewar-data.json format
func LoadRulesEngineFromLegacy(filename string) (*RulesEngine, error) {
	// This would use the conversion logic from the CLI tool
	// For now, return an error suggesting to use the converter first
	return nil, fmt.Errorf("legacy format loading not implemented - use weewar-convert CLI tool first to convert %s to canonical format", filename)
}

// SaveRulesEngineToFile saves a RulesEngine to a JSON file
func SaveRulesEngineToFile(rulesEngine *RulesEngine, filename string) error {
	data, err := json.MarshalIndent(rulesEngine, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal rules engine: %w", err)
	}

	if err := os.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write rules file %s: %w", filename, err)
	}

	return nil
}

// CreateGameWithRules creates a new game instance with a loaded RulesEngine
func CreateGameWithRules(world *World, rulesFile string, seed int64) (*Game, error) {
	// Load rules engine
	rulesEngine, err := LoadRulesEngineFromFile(rulesFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load rules: %w", err)
	}

	// Create game with rules engine
	game, err := NewGame(world, rulesEngine, seed)
	if err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	return game, nil
}