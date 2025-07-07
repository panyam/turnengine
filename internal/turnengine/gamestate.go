package turnengine

import (
	"encoding/json"
	"fmt"
	"time"
)

type GameState struct {
	ID          string            `json:"id"`
	Version     int               `json:"version"`
	GameType    string            `json:"gameType"`
	CurrentTurn int               `json:"currentTurn"`
	Phase       string            `json:"phase"`
	Players     []Player          `json:"players"`
	World       *World            `json:"world"`
	Rules       interface{}       `json:"rules"`
	Events      []Event           `json:"events"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type Player struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Team      int                    `json:"team"`
	Status    string                 `json:"status"`
	Resources map[string]interface{} `json:"resources"`
	Metadata  map[string]interface{} `json:"metadata"`
}

type Event struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	PlayerID  string                 `json:"playerId"`
	Turn      int                    `json:"turn"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

type Command struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	PlayerID  string                 `json:"playerId"`
	GameID    string                 `json:"gameId"`
	Version   int                    `json:"version"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

type GameEngine struct {
	validators map[string]CommandValidator
	processors map[string]CommandProcessor
}

type CommandValidator interface {
	ValidateCommand(gameState *GameState, command *Command) error
}

type CommandProcessor interface {
	ProcessCommand(gameState *GameState, command *Command) error
}

func NewGameEngine() *GameEngine {
	return &GameEngine{
		validators: make(map[string]CommandValidator),
		processors: make(map[string]CommandProcessor),
	}
}

func (ge *GameEngine) RegisterCommandHandler(commandType string, validator CommandValidator, processor CommandProcessor) {
	ge.validators[commandType] = validator
	ge.processors[commandType] = processor
}

func NewGameState(gameType string, players []Player, rules interface{}) *GameState {
	now := time.Now()
	return &GameState{
		ID:          generateID(),
		Version:     1,
		GameType:    gameType,
		CurrentTurn: 1,
		Phase:       "init",
		Players:     players,
		World:       NewWorld(),
		Rules:       rules,
		Events:      make([]Event, 0),
		CreatedAt:   now,
		UpdatedAt:   now,
		Metadata:    make(map[string]interface{}),
	}
}

func (gs *GameState) ProcessCommand(engine *GameEngine, command *Command) error {
	if command.Version != gs.Version {
		return fmt.Errorf("version mismatch: expected %d, got %d", gs.Version, command.Version)
	}

	validator, hasValidator := engine.validators[command.Type]
	if !hasValidator {
		return fmt.Errorf("no validator for command type: %s", command.Type)
	}

	processor, hasProcessor := engine.processors[command.Type]
	if !hasProcessor {
		return fmt.Errorf("no processor for command type: %s", command.Type)
	}

	if err := validator.ValidateCommand(gs, command); err != nil {
		return fmt.Errorf("command validation failed: %w", err)
	}

	if err := processor.ProcessCommand(gs, command); err != nil {
		return fmt.Errorf("command processing failed: %w", err)
	}

	gs.Version++
	gs.UpdatedAt = time.Now()

	event := Event{
		ID:        generateID(),
		Type:      command.Type,
		PlayerID:  command.PlayerID,
		Turn:      gs.CurrentTurn,
		Timestamp: time.Now(),
		Data:      command.Data,
	}
	gs.Events = append(gs.Events, event)

	return nil
}

func (gs *GameState) GetPlayer(playerID string) (*Player, bool) {
	for i := range gs.Players {
		if gs.Players[i].ID == playerID {
			return &gs.Players[i], true
		}
	}
	return nil, false
}

func (gs *GameState) NextTurn() {
	gs.CurrentTurn++
	gs.UpdatedAt = time.Now()
}

func (gs *GameState) SetPhase(phase string) {
	gs.Phase = phase
	gs.UpdatedAt = time.Now()
}

func (gs *GameState) Clone() *GameState {
	data, _ := json.Marshal(gs)
	var clone GameState
	json.Unmarshal(data, &clone)
	return &clone
}

func (gs *GameState) ToJSON() ([]byte, error) {
	return json.Marshal(gs)
}

func GameStateFromJSON(data []byte) (*GameState, error) {
	var gs GameState
	if err := json.Unmarshal(data, &gs); err != nil {
		return nil, fmt.Errorf("failed to unmarshal game state: %w", err)
	}
	return &gs, nil
}