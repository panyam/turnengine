package turnengine

import (
	"fmt"
	"time"
)

type TurnPhase string

const (
	PhaseInit       TurnPhase = "init"
	PhaseMovement   TurnPhase = "movement"
	PhaseCombat     TurnPhase = "combat"
	PhaseProduction TurnPhase = "production"
	PhaseEndTurn    TurnPhase = "endTurn"
	PhaseGameOver   TurnPhase = "gameOver"
)

type TurnStructure string

const (
	TurnSequential    TurnStructure = "sequential"
	TurnSimultaneous  TurnStructure = "simultaneous"
	TurnRealTimeSlow  TurnStructure = "real-time-slow"
	TurnRealTimeFast  TurnStructure = "real-time-fast"
)

type TurnConfig struct {
	Structure     TurnStructure `json:"structure"`
	MaxTurnTime   int           `json:"maxTurnTime"`
	Phases        []TurnPhase   `json:"phases"`
	AutoAdvance   bool          `json:"autoAdvance"`
	AllowUndo     bool          `json:"allowUndo"`
}

type TurnState struct {
	CurrentTurn   int       `json:"currentTurn"`
	CurrentPhase  TurnPhase `json:"currentPhase"`
	CurrentPlayer string    `json:"currentPlayer"`
	TurnStartTime time.Time `json:"turnStartTime"`
	PhaseStartTime time.Time `json:"phaseStartTime"`
	TimeRemaining int       `json:"timeRemaining"`
	PlayersReady  []string  `json:"playersReady"`
}

type TurnManager interface {
	GetCurrentPlayer() string
	GetCurrentPhase() TurnPhase
	GetCurrentTurn() int
	AdvancePhase() error
	AdvanceTurn() error
	IsPlayerTurn(playerID string) bool
	CanPlayerAct(playerID string) bool
	GetTimeRemaining() int
	IsPhaseComplete() bool
	IsTurnComplete() bool
	SetPlayerReady(playerID string) error
	GetPlayersInTurn() []string
}

type SequentialTurnManager struct {
	config      TurnConfig
	state       TurnState
	players     []string
	currentPlayerIndex int
}

func NewSequentialTurnManager(config TurnConfig, players []string) *SequentialTurnManager {
	return &SequentialTurnManager{
		config:             config,
		players:            players,
		currentPlayerIndex: 0,
		state: TurnState{
			CurrentTurn:    1,
			CurrentPhase:   PhaseInit,
			CurrentPlayer:  players[0],
			TurnStartTime:  time.Now(),
			PhaseStartTime: time.Now(),
			TimeRemaining:  config.MaxTurnTime,
			PlayersReady:   make([]string, 0),
		},
	}
}

func (stm *SequentialTurnManager) GetCurrentPlayer() string {
	return stm.state.CurrentPlayer
}

func (stm *SequentialTurnManager) GetCurrentPhase() TurnPhase {
	return stm.state.CurrentPhase
}

func (stm *SequentialTurnManager) GetCurrentTurn() int {
	return stm.state.CurrentTurn
}

func (stm *SequentialTurnManager) AdvancePhase() error {
	currentIndex := stm.getCurrentPhaseIndex()
	if currentIndex == -1 {
		return fmt.Errorf("unknown current phase: %s", stm.state.CurrentPhase)
	}
	
	if currentIndex >= len(stm.config.Phases)-1 {
		return stm.AdvanceTurn()
	}
	
	stm.state.CurrentPhase = stm.config.Phases[currentIndex+1]
	stm.state.PhaseStartTime = time.Now()
	stm.state.PlayersReady = make([]string, 0)
	
	return nil
}

func (stm *SequentialTurnManager) AdvanceTurn() error {
	stm.currentPlayerIndex = (stm.currentPlayerIndex + 1) % len(stm.players)
	
	if stm.currentPlayerIndex == 0 {
		stm.state.CurrentTurn++
	}
	
	stm.state.CurrentPlayer = stm.players[stm.currentPlayerIndex]
	stm.state.CurrentPhase = stm.config.Phases[0]
	stm.state.TurnStartTime = time.Now()
	stm.state.PhaseStartTime = time.Now()
	stm.state.TimeRemaining = stm.config.MaxTurnTime
	stm.state.PlayersReady = make([]string, 0)
	
	return nil
}

func (stm *SequentialTurnManager) IsPlayerTurn(playerID string) bool {
	return stm.state.CurrentPlayer == playerID
}

func (stm *SequentialTurnManager) CanPlayerAct(playerID string) bool {
	return stm.IsPlayerTurn(playerID) && stm.state.CurrentPhase != PhaseGameOver
}

func (stm *SequentialTurnManager) GetTimeRemaining() int {
	if stm.config.MaxTurnTime <= 0 {
		return -1
	}
	
	elapsed := int(time.Since(stm.state.TurnStartTime).Seconds())
	remaining := stm.config.MaxTurnTime - elapsed
	
	if remaining < 0 {
		remaining = 0
	}
	
	return remaining
}

func (stm *SequentialTurnManager) IsPhaseComplete() bool {
	if stm.config.AutoAdvance {
		return stm.GetTimeRemaining() == 0
	}
	
	return len(stm.state.PlayersReady) > 0 && stm.state.PlayersReady[0] == stm.state.CurrentPlayer
}

func (stm *SequentialTurnManager) IsTurnComplete() bool {
	currentIndex := stm.getCurrentPhaseIndex()
	return stm.IsPhaseComplete() && currentIndex >= len(stm.config.Phases)-1
}

func (stm *SequentialTurnManager) SetPlayerReady(playerID string) error {
	if !stm.IsPlayerTurn(playerID) {
		return fmt.Errorf("not player's turn: %s", playerID)
	}
	
	for _, ready := range stm.state.PlayersReady {
		if ready == playerID {
			return nil
		}
	}
	
	stm.state.PlayersReady = append(stm.state.PlayersReady, playerID)
	return nil
}

func (stm *SequentialTurnManager) GetPlayersInTurn() []string {
	return []string{stm.state.CurrentPlayer}
}

func (stm *SequentialTurnManager) getCurrentPhaseIndex() int {
	for i, phase := range stm.config.Phases {
		if phase == stm.state.CurrentPhase {
			return i
		}
	}
	return -1
}

type SimultaneousTurnManager struct {
	config  TurnConfig
	state   TurnState
	players []string
}

func NewSimultaneousTurnManager(config TurnConfig, players []string) *SimultaneousTurnManager {
	return &SimultaneousTurnManager{
		config:  config,
		players: players,
		state: TurnState{
			CurrentTurn:    1,
			CurrentPhase:   PhaseInit,
			TurnStartTime:  time.Now(),
			PhaseStartTime: time.Now(),
			TimeRemaining:  config.MaxTurnTime,
			PlayersReady:   make([]string, 0),
		},
	}
}

func (stm *SimultaneousTurnManager) GetCurrentPlayer() string {
	return ""
}

func (stm *SimultaneousTurnManager) GetCurrentPhase() TurnPhase {
	return stm.state.CurrentPhase
}

func (stm *SimultaneousTurnManager) GetCurrentTurn() int {
	return stm.state.CurrentTurn
}

func (stm *SimultaneousTurnManager) AdvancePhase() error {
	currentIndex := stm.getCurrentPhaseIndex()
	if currentIndex == -1 {
		return fmt.Errorf("unknown current phase: %s", stm.state.CurrentPhase)
	}
	
	if currentIndex >= len(stm.config.Phases)-1 {
		return stm.AdvanceTurn()
	}
	
	stm.state.CurrentPhase = stm.config.Phases[currentIndex+1]
	stm.state.PhaseStartTime = time.Now()
	stm.state.PlayersReady = make([]string, 0)
	
	return nil
}

func (stm *SimultaneousTurnManager) AdvanceTurn() error {
	stm.state.CurrentTurn++
	stm.state.CurrentPhase = stm.config.Phases[0]
	stm.state.TurnStartTime = time.Now()
	stm.state.PhaseStartTime = time.Now()
	stm.state.TimeRemaining = stm.config.MaxTurnTime
	stm.state.PlayersReady = make([]string, 0)
	
	return nil
}

func (stm *SimultaneousTurnManager) IsPlayerTurn(playerID string) bool {
	for _, player := range stm.players {
		if player == playerID {
			return true
		}
	}
	return false
}

func (stm *SimultaneousTurnManager) CanPlayerAct(playerID string) bool {
	return stm.IsPlayerTurn(playerID) && stm.state.CurrentPhase != PhaseGameOver
}

func (stm *SimultaneousTurnManager) GetTimeRemaining() int {
	if stm.config.MaxTurnTime <= 0 {
		return -1
	}
	
	elapsed := int(time.Since(stm.state.TurnStartTime).Seconds())
	remaining := stm.config.MaxTurnTime - elapsed
	
	if remaining < 0 {
		remaining = 0
	}
	
	return remaining
}

func (stm *SimultaneousTurnManager) IsPhaseComplete() bool {
	if stm.config.AutoAdvance && stm.GetTimeRemaining() == 0 {
		return true
	}
	
	return len(stm.state.PlayersReady) >= len(stm.players)
}

func (stm *SimultaneousTurnManager) IsTurnComplete() bool {
	currentIndex := stm.getCurrentPhaseIndex()
	return stm.IsPhaseComplete() && currentIndex >= len(stm.config.Phases)-1
}

func (stm *SimultaneousTurnManager) SetPlayerReady(playerID string) error {
	if !stm.IsPlayerTurn(playerID) {
		return fmt.Errorf("player not in game: %s", playerID)
	}
	
	for _, ready := range stm.state.PlayersReady {
		if ready == playerID {
			return nil
		}
	}
	
	stm.state.PlayersReady = append(stm.state.PlayersReady, playerID)
	return nil
}

func (stm *SimultaneousTurnManager) GetPlayersInTurn() []string {
	return stm.players
}

func (stm *SimultaneousTurnManager) getCurrentPhaseIndex() int {
	for i, phase := range stm.config.Phases {
		if phase == stm.state.CurrentPhase {
			return i
		}
	}
	return -1
}

func CreateTurnManager(config TurnConfig, players []string) TurnManager {
	switch config.Structure {
	case TurnSequential:
		return NewSequentialTurnManager(config, players)
	case TurnSimultaneous:
		return NewSimultaneousTurnManager(config, players)
	default:
		return NewSequentialTurnManager(config, players)
	}
}